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
const MAX_DIMENSION = 2560
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

/** Camada da logo com opacidade, cor sólida opcional (sombra/halo) e desfoque. */
async function logoLayer(logo: Buffer, w: number, h: number, opacity: number, color?: { r: number; g: number; b: number }, blur = 0) {
  let base = await sharp(logo).resize(w, h, { fit: 'inside' }).ensureAlpha().png().toBuffer()
  const meta = await sharp(base).metadata()
  const lw = meta.width!, lh = meta.height!

  if (color) {
    // Silhueta colorida: cor sólida recortada pelo alfa da logo
    base = await sharp({ create: { width: lw, height: lh, channels: 4, background: { ...color, alpha: 1 } } })
      .composite([{ input: base, blend: 'dest-in' }])
      .png().toBuffer()
  }
  // Margem para o desfoque não ser cortado
  const pad = Math.ceil(blur * 3)
  let img = sharp(base).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  if (blur > 0.3) img = sharp(await img.png().toBuffer()).blur(blur)
  // Aplica opacidade multiplicando o canal alfa
  const out = await sharp(await img.png().toBuffer())
    .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
    .png().toBuffer()
  return { buffer: out, width: lw + pad * 2, height: lh + pad * 2 }
}

/** Mesma composição do navegador: sombra escura + halo claro + logo (≈38%). */
async function watermark(photo: Buffer, logo: Buffer): Promise<Buffer> {
  const resized = await sharp(photo, { failOn: 'none' })
    .rotate() // aplica orientação EXIF
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .toBuffer({ resolveWithObject: true })
  const W = resized.info.width, H = resized.info.height

  const lm = await sharp(logo).metadata()
  let w = W * 0.45
  let h = w * (lm.height! / lm.width!)
  if (h > H * 0.45) { h = H * 0.45; w = h * (lm.width! / lm.height!) }
  w = Math.round(w); h = Math.round(h)
  const blur = Math.max(2, Math.round(Math.min(W, H) * 0.006))

  const layers = await Promise.all([
    logoLayer(logo, w, h, 0.22, { r: 0, g: 0, b: 0 }, blur * 2),
    logoLayer(logo, w, h, 0.18, { r: 255, g: 255, b: 255 }, blur),
    logoLayer(logo, w, h, 0.38),
  ])

  return sharp(resized.data)
    .composite(layers.map(l => ({
      input: l.buffer,
      left: Math.max(0, Math.round((W - l.width) / 2)),
      top: Math.max(0, Math.round((H - l.height) / 2)),
    })))
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
  if (!settings?.logoUrl) throw new Error('Nenhuma logo cadastrada em Configurações. Cadastre antes de rodar.')
  const logo = await sharp(await download(settings.logoUrl), { density: 300 }).png().toBuffer()
  console.log(`🖼️  Logo: ${settings.logoUrl}\n`)

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
        const protectedImg = await watermark(original, logo)
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
