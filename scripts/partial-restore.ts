/**
 * TENTATIVA DE RESTAURAÇÃO PARCIAL
 * 
 * Baseado na análise, encontramos 13 backups órfãos que provavelmente são de REF.01.
 * REF.01 tem 16 fotos, então 3 foram perdidas permanentemente.
 * 
 * USO:
 *   npx tsx scripts/partial-restore.ts           → Simula
 *   npx tsx scripts/partial-restore.ts --apply   → Executa
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import * as fs from 'fs/promises'
import * as path from 'path'

const APPLY = process.argv.includes('--apply')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Backups órfãos identificados (13 fotos grandes de 13/10)
const ORPHAN_BACKUPS_REF01 = [
  'w13fb6vkdj8_1791910773232.jpg',
  'axnsd3ma6rr_1791910777579.jpg',
  'flcty2wrwya_1791910780958.jpg',
  'b2ok0yv9b7u_1791910783621.jpg',
  '9et64kw6ymf_1791910790281.jpg',
  'teq8caihgbk_1791910792958.jpg',
  'ya9odx90tts_1791910796011.jpg',
  '80nvcf9t16y_1791910798994.jpg',
  'lfbwc9xoiqk_1791910802463.jpg',
  'byebebjjr0f_1791910804820.jpg',
  'lyi0meq1xy_1791910810447.jpg',
  'ykx40mepx2c_1791910812912.jpg',
  'z0d0fw7b1e_1791910816902.jpg',
]

async function loadLogo(): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'public', 'nova-logo.png'))
  } catch { return null }
}

async function watermark(photo: Buffer, logo: Buffer | null): Promise<Buffer> {
  const resized = await sharp(photo)
    .rotate()
    .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toFormat('png')
    .toBuffer()

  if (!logo) return sharp(resized).webp({ quality: 88 }).toBuffer()

  const meta = await sharp(resized).metadata()
  const W = meta.width!, H = meta.height!
  const maxW = Math.round(W * 0.15), maxH = Math.round(H * 0.15)
  const resizedLogo = await sharp(logo).resize(maxW, maxH, { fit: 'inside' }).ensureAlpha().toBuffer()
  const lMeta = await sharp(resizedLogo).metadata()
  const lw = lMeta.width!, lh = lMeta.height!

  const rawLogo = await sharp(resizedLogo).raw().toBuffer()
  for (let i = 3; i < rawLogo.length; i += 4) rawLogo[i] = Math.round(rawLogo[i] * 0.75)
  const semiLogo = await sharp(rawLogo, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer()

  return sharp(resized)
    .composite([{ input: semiLogo, top: Math.round((H - lh) / 2), left: Math.round((W - lw) / 2), blend: 'over' }])
    .webp({ quality: 88 })
    .toBuffer()
}

async function main() {
  console.log(APPLY ? '🚀 MODO EXECUÇÃO\n' : '🔍 MODO SIMULAÇÃO\n')

  console.log('=== RESTAURAÇÃO PARCIAL DE REF.01 ===\n')
  console.log('Backups órfãos identificados: 13')
  console.log('Fotos esperadas em REF.01: 16')
  console.log('Fotos que serão perdidas: 3 (backups deletados pelo bug)\n')

  if (!APPLY) {
    console.log('Backups que seriam usados para restaurar:')
    ORPHAN_BACKUPS_REF01.forEach((b, i) => console.log(`  ${i+1}. ${b}`))
    console.log('\n⚠️  Use --apply para executar a restauração')
    console.log('\n⚠️  IMPORTANTE: Isso vai SUBSTITUIR as 16 fotos atuais por apenas 13!')
    console.log('   Se quiser manter 16 fotos, o proprietário precisa fornecer 3 fotos adicionais.')
    return
  }

  const property = await prisma.property.findFirst({ where: { code: 'REF.01' } })
  if (!property) throw new Error('REF.01 não encontrado!')

  const logo = await loadLogo()
  const newPhotos: string[] = []
  const oldPhotos = [...property.photos]

  for (let i = 0; i < ORPHAN_BACKUPS_REF01.length; i++) {
    const backupName = ORPHAN_BACKUPS_REF01[i]
    console.log(`[${i+1}/${ORPHAN_BACKUPS_REF01.length}] ${backupName}`)

    // Baixa do backup
    const { data, error } = await supabase.storage
      .from('properties-originals')
      .download(`imoveis/${backupName}`)
    
    if (error || !data) {
      console.log(`  ❌ Erro: ${error?.message || 'Arquivo não encontrado'}`)
      continue
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    const processed = await watermark(buffer, logo)

    // Upload para bucket público
    const newPath = `imoveis/wm_${Math.random().toString(36).slice(2, 12)}_${Date.now()}.webp`
    const { error: uploadErr } = await supabase.storage
      .from('properties')
      .upload(newPath, processed, { contentType: 'image/webp', cacheControl: '31536000' })

    if (uploadErr) {
      console.log(`  ❌ Upload falhou: ${uploadErr.message}`)
      continue
    }

    const url = supabase.storage.from('properties').getPublicUrl(newPath).data.publicUrl
    newPhotos.push(url)
    console.log(`  ✅ OK`)
  }

  // Atualiza banco
  await prisma.property.update({
    where: { id: property.id },
    data: { photos: newPhotos }
  })
  console.log(`\n✅ REF.01 atualizado com ${newPhotos.length} fotos`)

  // Remove fotos antigas
  const toDelete = oldPhotos.map(url => {
    const m = url.match(/\/properties\/(.+?)(\?|$)/)
    return m ? m[1] : null
  }).filter(Boolean) as string[]

  if (toDelete.length > 0) {
    await supabase.storage.from('properties').remove(toDelete)
    console.log(`🗑️  ${toDelete.length} fotos corrompidas removidas`)
  }

  console.log('\n✅ RESTAURAÇÃO PARCIAL CONCLUÍDA!')
  console.log(`   REF.01 agora tem ${newPhotos.length} fotos (antes tinha 16)`)
  console.log('   O proprietário pode adicionar 3 fotos manualmente se quiser completar.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
