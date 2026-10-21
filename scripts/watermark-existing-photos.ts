/**
 * Aplica a marca d'água (logo do sistema) em TODAS as fotos de imóveis já existentes.
 *
 * Uso:
 *   npx tsx scripts/watermark-existing-photos.ts            → simulação (não altera nada)
 *   npx tsx scripts/watermark-existing-photos.ts --apply    → executa de verdade
 *   Opções: --property=<id>  (processa um único imóvel)
 *           --keep-originals (não remove os originais do bucket público)
 *
 * Segurança do processo (idempotente e retomável):
 *   1. Original é copiado para o bucket PRIVADO "properties-originals" (backup).
 *   2. Versão com marca d'água é enviada como imoveis/wm_<id>.webp.
 *   3. O banco é atualizado imóvel a imóvel (ordem das fotos preservada).
 *   4. Só depois o original é removido do bucket público (senão continuaria acessível pela URL antiga).
 *   Fotos com prefixo "wm_" são ignoradas — pode rodar várias vezes sem duplicar marca.
 */
import 'dotenv/config'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import prisma from '../src/lib/prisma'

const APPLY = process.argv.includes('--apply')
const KEEP_ORIGINALS = process.argv.includes('--keep-originals')
const ONLY_PROPERTY = process.argv.find(a => a.startsWith('--property='))?.split('=')[1]

const PUBLIC_BUCKET = 'properties'
const BACKUP_BUCKET = 'properties-originals'
const MAX_DIMENSION = 4000
const WM_PREFIX = 'wm_'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/`

/** Extrai o caminho no bucket a partir da URL pública (null se for externa). */
function storagePath(url: string): string | null {
  if (!url.startsWith(publicPrefix)) return null
  return decodeURIComponent(url.slice(publicPrefix.length).split('?')[0])
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Gera o overlay SVG com o nome da imobiliária em texto dourado semitransparente.
 * Sharp suporta SVG nativamente via librsvg — sem dependências extras.
 * O texto é renderizado com filtros de sombra e brilho dourado.
 */
function buildTextSvg(text: string, W: number, H: number): Buffer {
  const fontSize = Math.max(20, Math.min(120, Math.round(W * 0.04)))
  // Estimativa conservadora da largura do texto (será centralizado pelo SVG)
  const svgW = W
  const svgH = H
  const cx = W / 2
  const cy = H / 2 + fontSize * 0.35
  const blur = Math.max(3, Math.round(fontSize * 0.08))
  const label = text.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="${blur * 1.5}" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.55"/>
    </filter>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0" stdDeviation="${blur}" flood-color="#E8D5A3" flood-opacity="0.4"/>
    </filter>
  </defs>
  <!-- Sombra escura: visível em fotos claras -->
  <text
    x="${cx}" y="${cy}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="rgba(0,0,0,0.01)"
    filter="url(#shadow)"
    opacity="1"
  >${label}</text>
  <!-- Texto dourado principal -->
  <text
    x="${cx}" y="${cy}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#C5A55A"
    opacity="0.52"
  >${label}</text>
  <!-- Brilho dourado claro (efeito metálico) -->
  <text
    x="${cx}" y="${cy}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#E8D5A3"
    filter="url(#glow)"
    opacity="0.28"
  >${label}</text>
</svg>`
  return Buffer.from(svg)
}

/**
 * Remove o fundo branco/sólido da logo e apara margens vazias.
 * Usa o mesmo algoritmo de detecção de bordas e flood-fill para preservar
 * partes brancas internas da marca e remover apenas o fundo externo.
 */
async function prepareLogo(logoRaw: Buffer): Promise<Buffer> {
  const img = sharp(logoRaw).ensureAlpha()
  const meta = await img.metadata()
  const w = meta.width || 800
  const h = meta.height || 400
  const { data } = await img.raw().toBuffer({ resolveWithObject: true })
  const d = Buffer.from(data)

  // 1. Amostra bordas para identificar fundo opaco
  let total = 0, opaque = 0, sr = 0, sg = 0, sb = 0
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4
    total++
    if (d[i + 3] > 200) { opaque++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2] }
  }
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1) }
  for (let y = 1; y < h - 1; y++) { sample(0, y); sample(w - 1, y) }

  // Se metade ou mais da borda for opaca, assume que há fundo a ser removido
  if (opaque / total >= 0.5) {
    const bgR = sr / opaque, bgG = sg / opaque, bgB = sb / opaque
    const tolerance = 42
    const dist = (i: number) =>
      Math.max(Math.abs(d[i] - bgR), Math.abs(d[i + 1] - bgG), Math.abs(d[i + 2] - bgB))

    const removed = new Uint8Array(w * h)
    const queue = new Int32Array(w * h)
    let head = 0, tail = 0
    const push = (p: number) => {
      if (removed[p]) return
      const i = p * 4
      if (d[i + 3] === 0 || dist(i) <= tolerance) { removed[p] = 1; queue[tail++] = p }
    }
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
    while (head < tail) {
      const p = queue[head++]
      const x = p % w, y = (p / w) | 0
      if (x > 0) push(p - 1)
      if (x < w - 1) push(p + 1)
      if (y > 0) push(p - w)
      if (y < h - 1) push(p + w)
    }
    for (let p = 0; p < w * h; p++) if (removed[p]) d[p * 4 + 3] = 0

    // Descontaminação de halo nas bordas
    const haloRange = tolerance * 3
    for (let pass = 0; pass < 2; pass++) {
      const edge: number[] = []
      for (let p = 0; p < w * h; p++) {
        if (removed[p]) continue
        const x = p % w, y = (p / w) | 0
        if ((x > 0 && removed[p - 1]) || (x < w - 1 && removed[p + 1]) ||
            (y > 0 && removed[p - w]) || (y < h - 1 && removed[p + w])) edge.push(p)
      }
      for (const p of edge) {
        const i = p * 4
        const dd = dist(i)
        if (dd < haloRange) {
          const a = Math.max(0.05, dd / haloRange)
          d[i]     = Math.max(0, Math.min(255, Math.round((d[i]     - bgR * (1 - a)) / a)))
          d[i + 1] = Math.max(0, Math.min(255, Math.round((d[i + 1] - bgG * (1 - a)) / a)))
          d[i + 2] = Math.max(0, Math.min(255, Math.round((d[i + 2] - bgB * (1 - a)) / a)))
          d[i + 3] = Math.round(d[i + 3] * a)
        }
        removed[p] = 2
      }
    }
  }

  // Gera imagem PNG e remove margens vazias
  return sharp(d, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer()
}

/** Aplica marca d'água na foto (prioriza logo limpa com 22% de opacidade; fallback para texto). */
async function watermark(photo: Buffer, opts: { logoBuffer?: Buffer | null; companyName: string }): Promise<Buffer> {
  const resizedBuf = await sharp(photo)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toFormat('png')
    .toBuffer()

  const meta = await sharp(resizedBuf).metadata()
  const W = meta.width!
  const H = meta.height!

  if (opts.logoBuffer) {
    try {
      const maxW = Math.round(W * 0.35)
      const maxH = Math.round(H * 0.35)
      const resizedLogo = await sharp(opts.logoBuffer)
        .resize(maxW, maxH, { fit: 'inside' })
        .toBuffer()

      const lMeta = await sharp(resizedLogo).metadata()
      const lw = lMeta.width!
      const lh = lMeta.height!

      // Aplica 22% de opacidade (0.22) no canal alpha
      const rawLogo = await sharp(resizedLogo).ensureAlpha().raw().toBuffer()
      for (let i = 3; i < rawLogo.length; i += 4) {
        rawLogo[i] = Math.round(rawLogo[i] * 0.22)
      }
      const semiLogo = await sharp(rawLogo, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer()

      const left = Math.round((W - lw) / 2)
      const top = Math.round((H - lh) / 2)

      return sharp(resizedBuf)
        .composite([{ input: semiLogo, top, left, blend: 'over' }])
        .webp({ quality: 88 })
        .toBuffer()
    } catch (e) {
      console.warn('   ⚠ Falha ao aplicar overlay da logo, usando texto como fallback:', e)
    }
  }

  // Fallback: texto dourado elegante
  const overlay = buildTextSvg(opts.companyName, W, H)
  return sharp(resizedBuf)
    .composite([{ input: overlay, top: 0, left: 0, blend: 'over' }])
    .webp({ quality: 88 })
    .toBuffer()
}

async function ensureBackupBucket() {
  const { data } = await supabase.storage.getBucket(BACKUP_BUCKET)
  if (data) return
  const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, { public: false })
  if (error && !/already exists/i.test(error.message)) throw error
  console.log(`🔒 Bucket privado "${BACKUP_BUCKET}" criado para backup dos originais.`)
}

async function main() {
  console.log(APPLY ? '🚀 MODO EXECUÇÃO (alterações serão gravadas)\n' : '🔎 MODO SIMULAÇÃO (use --apply para executar)\n')

  const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
  const companyName = settings?.companyName?.trim() || 'Minha Imobiliária'
  const logoUrl = settings?.logoUrl?.trim()

  let preparedLogo: Buffer | null = null
  if (logoUrl) {
    try {
      console.log(`📥 Baixando logo de: ${logoUrl}`)
      const raw = await download(logoUrl)
      preparedLogo = await prepareLogo(raw)
      console.log('✨ Logo processada com sucesso: fundo branco removido e margens recortadas.\n')
    } catch (err) {
      console.warn(`⚠ Não foi possível preparar a logo (${(err as Error).message}). Será usado texto dourado.\n`)
    }
  } else {
    console.log(`🏢  Empresa: ${companyName} (sem logo cadastrada, usando texto dourado)\n`)
  }

  if (APPLY) await ensureBackupBucket()

  const properties = await prisma.property.findMany({
    where: ONLY_PROPERTY ? { id: ONLY_PROPERTY } : undefined,
    select: { id: true, code: true, title: true, photos: true },
  })

  const stats = { properties: 0, done: 0, skipped: 0, external: 0, failed: 0 }

  for (const p of properties) {
    const pending = p.photos.filter(u => { const s = storagePath(u); return s && !s.split('/').pop()!.startsWith(WM_PREFIX) })
    if (!pending.length) continue
    stats.properties++
    console.log(`🏠 [${p.code || p.id}] ${p.title} — ${pending.length}/${p.photos.length} foto(s) a proteger`)

    const newPhotos = [...p.photos]
    const toDelete: string[] = []

    for (let i = 0; i < p.photos.length; i++) {
      const url = p.photos[i]
      const path = storagePath(url)
      if (!path) { stats.external++; console.log(`   ↷ externa (ignorada): ${url}`); continue }
      const fileName = path.split('/').pop()!
      if (fileName.startsWith(WM_PREFIX)) { stats.skipped++; continue }

      try {
        if (!APPLY) { console.log(`   • ${path} → imoveis/${WM_PREFIX}….webp`); stats.done++; continue }

        const original = await download(url)

        // 1) Backup privado do original
        const { error: bErr } = await supabase.storage.from(BACKUP_BUCKET)
          .upload(path, original, { upsert: true, contentType: 'application/octet-stream' })
        if (bErr) throw new Error(`backup: ${bErr.message}`)

        // 2) Gera e envia versão protegida
        const protectedImg = await watermark(original, { logoBuffer: preparedLogo, companyName })
        const newPath = `imoveis/${WM_PREFIX}${Math.random().toString(36).slice(2, 12)}_${Date.now()}.webp`
        const { error: uErr } = await supabase.storage.from(PUBLIC_BUCKET)
          .upload(newPath, protectedImg, { contentType: 'image/webp', cacheControl: '31536000' })
        if (uErr) throw new Error(`upload: ${uErr.message}`)

        newPhotos[i] = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(newPath).data.publicUrl
        toDelete.push(path)
        stats.done++
        console.log(`   ✔ ${fileName}`)
      } catch (err) {
        stats.failed++
        console.error(`   ✖ ${fileName}: ${(err as Error).message}`)
      }
    }

    if (APPLY && toDelete.length) {
      // 3) Atualiza banco (ordem preservada); 4) remove originais públicos
      await prisma.property.update({ where: { id: p.id }, data: { photos: newPhotos } })
      if (!KEEP_ORIGINALS) {
        const { error } = await supabase.storage.from(PUBLIC_BUCKET).remove(toDelete)
        if (error) console.warn(`   ⚠ originais não removidos: ${error.message}`)
      }
    }
  }

  console.log('\n──────── Resumo ────────')
  console.log(`Imóveis afetados:  ${stats.properties}`)
  console.log(`Fotos protegidas:  ${stats.done}${APPLY ? '' : ' (simulação)'}`)
  console.log(`Já protegidas:     ${stats.skipped}`)
  console.log(`Externas ignoradas:${stats.external}`)
  console.log(`Falhas:            ${stats.failed}`)
}

main()
  .catch(err => { console.error('❌', err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
