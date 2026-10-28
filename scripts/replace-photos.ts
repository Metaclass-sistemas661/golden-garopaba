/**
 * Script para SUBSTITUIR fotos corrompidas de um imóvel
 * 
 * USO:
 *   1. Coloque as fotos originais em uma pasta local
 *   2. Execute: npx tsx scripts/replace-photos.ts --property=REF.01 --folder="C:\fotos\ref01"
 *   3. Adicione --apply para executar de verdade
 * 
 * EXEMPLO:
 *   npx tsx scripts/replace-photos.ts --property=REF.01 --folder="C:\fotos\casa-moderna" --apply
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import * as fs from 'fs/promises'
import * as path from 'path'

const APPLY = process.argv.includes('--apply')
const PROPERTY_ARG = process.argv.find(a => a.startsWith('--property='))?.split('=')[1]
const FOLDER_ARG = process.argv.find(a => a.startsWith('--folder='))?.split('=')[1]

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const PUBLIC_BUCKET = 'properties'

if (!PROPERTY_ARG || !FOLDER_ARG) {
  console.log('USO: npx tsx scripts/replace-photos.ts --property=REF.XX --folder="C:\\caminho\\fotos"')
  console.log('     Adicione --apply para executar de verdade')
  process.exit(1)
}

// Após a validação, garantimos que os valores existem
const propertyCode = PROPERTY_ARG as string
const folderPath = FOLDER_ARG as string

async function loadLogo(): Promise<Buffer | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'nova-logo.png')
    return await fs.readFile(logoPath)
  } catch {
    return null
  }
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

  // Prepara logo com 35% opacidade
  const maxW = Math.round(W * 0.15)
  const maxH = Math.round(H * 0.15)
  const resizedLogo = await sharp(logo).resize(maxW, maxH, { fit: 'inside' }).ensureAlpha().toBuffer()
  const lMeta = await sharp(resizedLogo).metadata()
  const lw = lMeta.width!, lh = lMeta.height!

  const rawLogo = await sharp(resizedLogo).raw().toBuffer()
  for (let i = 3; i < rawLogo.length; i += 4) {
    rawLogo[i] = Math.round(rawLogo[i] * 0.50)
  }
  const semiLogo = await sharp(rawLogo, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer()

  return sharp(resized)
    .composite([{ input: semiLogo, top: Math.round((H - lh) / 2), left: Math.round((W - lw) / 2), blend: 'over' }])
    .webp({ quality: 88 })
    .toBuffer()
}

async function main() {
  console.log(APPLY ? '🚀 MODO EXECUÇÃO\n' : '🔍 MODO SIMULAÇÃO (use --apply para executar)\n')

  // Busca o imóvel
  const property = await prisma.property.findFirst({
    where: { code: propertyCode },
    select: { id: true, code: true, title: true, photos: true }
  })

  if (!property) {
    console.error(`❌ Imóvel ${propertyCode} não encontrado!`)
    process.exit(1)
  }

  console.log(`📍 Imóvel: ${property.code} - ${property.title}`)
  console.log(`📸 Fotos atuais: ${property.photos.length}`)
  console.log(`📁 Pasta de origem: ${folderPath}\n`)

  // Lista arquivos na pasta
  const files = await fs.readdir(folderPath)
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f)).sort()

  console.log(`📷 Fotos encontradas na pasta: ${imageFiles.length}`)
  imageFiles.forEach((f, i) => console.log(`   ${i + 1}. ${f}`))

  if (imageFiles.length === 0) {
    console.error('\n❌ Nenhuma foto encontrada na pasta!')
    process.exit(1)
  }

  if (!APPLY) {
    console.log('\n⚠️  SIMULAÇÃO: Nenhuma alteração foi feita.')
    console.log('   Use --apply para substituir as fotos.')
    return
  }

  // Carrega logo
  const logo = await loadLogo()
  console.log(logo ? '\n✨ Logo carregada para marca d\'água' : '\n⚠️  Logo não encontrada, sem marca d\'água')

  // Processa cada foto
  const newPhotos: string[] = []
  const oldPhotos = [...property.photos]

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    console.log(`\n[${i + 1}/${imageFiles.length}] Processando ${file}...`)

    const filePath = path.join(folderPath, file)
    const photoBuffer = await fs.readFile(filePath)
    const processed = await watermark(photoBuffer, logo)

    const newPath = `imoveis/wm_${Math.random().toString(36).slice(2, 12)}_${Date.now()}.webp`
    const { error } = await supabase.storage.from(PUBLIC_BUCKET)
      .upload(newPath, processed, { contentType: 'image/webp', cacheControl: '31536000' })

    if (error) {
      console.error(`   ❌ Erro: ${error.message}`)
      continue
    }

    const publicUrl = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(newPath).data.publicUrl
    newPhotos.push(publicUrl)
    console.log(`   ✅ Upload OK`)
  }

  // Atualiza o banco de dados
  await prisma.property.update({
    where: { id: property.id },
    data: { photos: newPhotos }
  })
  console.log(`\n✅ Banco de dados atualizado com ${newPhotos.length} fotos`)

  // Remove fotos antigas do storage
  const pathsToDelete = oldPhotos
    .map(url => {
      const match = url.match(/\/properties\/(.+?)(\?|$)/)
      return match ? match[1] : null
    })
    .filter(Boolean) as string[]

  if (pathsToDelete.length > 0) {
    await supabase.storage.from(PUBLIC_BUCKET).remove(pathsToDelete)
    console.log(`🗑️  ${pathsToDelete.length} fotos antigas removidas do storage`)
  }

  console.log('\n✅ SUBSTITUIÇÃO CONCLUÍDA!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
