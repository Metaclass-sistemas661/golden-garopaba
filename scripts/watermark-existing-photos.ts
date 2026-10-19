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

/** Aplica marca d'água em texto dourado (sem fundo). */
async function watermark(photo: Buffer, companyName: string): Promise<Buffer> {
  const resized = await sharp(photo, { failOn: 'none' })
    .rotate() // aplica orientação EXIF
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .toBuffer({ resolveWithObject: true })
  const W = resized.info.width, H = resized.info.height

  const overlay = buildTextSvg(companyName, W, H)

  return sharp(resized.data, { raw: { width: W, height: H, channels: 3 } })
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
  const companyName = settings?.companyName?.trim()
  if (!companyName) throw new Error('Nome da imobiliária não configurado. Preencha em Configurações → Minha Imobiliária.')
  console.log(`🏢  Empresa: ${companyName}\n`)

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
        const protectedImg = await watermark(original, companyName)
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
