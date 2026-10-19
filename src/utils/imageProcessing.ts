"use client"

/**
 * Pipeline profissional de imagens:
 * aceita praticamente qualquer formato e converte para WebP/JPEG otimizado
 * (com redimensionamento e correção de orientação EXIF) antes do upload.
 *
 * Suporte: JPG, PNG, WebP, AVIF, GIF, BMP, ICO, SVG, HEIC/HEIF (iPhone),
 * TIFF, PSD (Photoshop) e PDF (cada página vira uma foto).
 */

export const ACCEPTED_FILE_TYPES = [
  'image/*',
  'application/pdf',
  '.jpg', '.jpeg', '.jfif', '.pjpeg', '.png', '.webp', '.avif', '.gif', '.bmp',
  '.ico', '.svg', '.heic', '.heif', '.tif', '.tiff', '.psd', '.pdf',
].join(',')

const MAX_DIMENSION = 2560
const QUALITY = 0.88

export interface ProcessOptions {
  /** Lado maior máximo em px (padrão 2560) */
  maxDimension?: number
  /** Preserva transparência (logos). Fallback em PNG em vez de JPEG. */
  transparent?: boolean
}

// Opções da conversão em andamento (uploads são processados sequencialmente)
let opts: Required<ProcessOptions> = { maxDimension: MAX_DIMENSION, transparent: false }

export interface ProcessedImage {
  blob: Blob
  ext: 'webp' | 'jpg' | 'png' | 'gif'
  contentType: string
  sourceName: string
}

const extOf = (name: string) => (name.split('.').pop() || '').toLowerCase()

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<{ blob: Blob; ext: 'webp' | 'jpg' | 'png' }> {
  const toBlob = (type: string) =>
    new Promise<Blob | null>(res => canvas.toBlob(b => res(b), type, QUALITY))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' }
  const fallback = opts.transparent ? 'image/png' : 'image/jpeg'
  const out = await toBlob(fallback)
  if (!out) throw new Error('Falha ao gerar imagem')
  return { blob: out, ext: opts.transparent ? 'png' : 'jpg' }
}

function fitSize(w: number, h: number) {
  const scale = Math.min(1, opts.maxDimension / Math.max(w, h))
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

function drawToCanvas(source: CanvasImageSource, srcW: number, srcH: number) {
  const { w, h } = fitSize(srcW, srcH)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  if (!opts.transparent) {
    // Fundo branco: evita transparência virar preto no JPEG
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

async function finalize(canvas: HTMLCanvasElement, sourceName: string): Promise<ProcessedImage> {
  const { blob, ext } = await canvasToBlob(canvas)
  return { blob, ext, contentType: blob.type, sourceName }
}

/** Decodifica qualquer blob que o navegador entenda nativamente. */
async function decodeNative(blob: Blob, name: string): Promise<ProcessedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      const canvas = drawToCanvas(bmp, bmp.width, bmp.height)
      bmp.close()
      return finalize(canvas, name)
    } catch { /* fallback para <img> (ex.: SVG) */ }
  }
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = () => rej(new Error('Formato não suportado pelo navegador'))
      el.src = url
    })
    const w = img.naturalWidth || 1920
    const h = img.naturalHeight || 1080
    return finalize(drawToCanvas(img, w, h), name)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function decodeHeic(file: File): Promise<ProcessedImage> {
  // Safari decodifica HEIC nativamente; tenta primeiro
  try { return await decodeNative(file, file.name) } catch { /* usa heic2any */ }
  const heic2any = (await import('heic2any')).default
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
  const jpeg = Array.isArray(out) ? out[0] : out
  return decodeNative(jpeg, file.name)
}

async function decodeTiff(file: File): Promise<ProcessedImage[]> {
  const UTIF = (await import('utif2')).default
  const buf = await file.arrayBuffer()
  const ifds = UTIF.decode(buf)
  const results: ProcessedImage[] = []
  for (const ifd of ifds) {
    UTIF.decodeImage(buf, ifd)
    const w = ifd.width as number
    const h = ifd.height as number
    if (!w || !h) continue
    const rgba = UTIF.toRGBA8(ifd)
    const src = document.createElement('canvas')
    src.width = w
    src.height = h
    src.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0)
    results.push(await finalize(drawToCanvas(src, w, h), file.name))
    break // apenas a imagem principal (demais páginas costumam ser miniaturas)
  }
  if (!results.length) throw new Error('TIFF sem imagem válida')
  return results
}

async function decodePsd(file: File): Promise<ProcessedImage> {
  const { readPsd } = await import('ag-psd')
  const psd = readPsd(await file.arrayBuffer(), {
    skipLayerImageData: true,
    skipThumbnail: true,
    useImageData: false,
  })
  const composite = psd.canvas as HTMLCanvasElement | undefined
  if (!composite) throw new Error('PSD sem imagem composta (salve com "Maximizar compatibilidade")')
  return finalize(drawToCanvas(composite, composite.width, composite.height), file.name)
}

async function decodePdf(file: File): Promise<ProcessedImage[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const results: ProcessedImage[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const base = page.getViewport({ scale: 1 })
    const scale = opts.maxDimension / Math.max(base.width, base.height)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    results.push(await finalize(canvas, `${file.name} (pág. ${p})`))
  }
  return results
}

/** Converte um arquivo qualquer em uma ou mais imagens prontas para web. */
export async function processUploadFile(file: File, options: ProcessOptions = {}): Promise<ProcessedImage[]> {
  const previous = opts
  opts = { maxDimension: options.maxDimension ?? MAX_DIMENSION, transparent: options.transparent ?? false }
  try {
    return await processInternal(file)
  } finally {
    opts = previous
  }
}

async function processInternal(file: File): Promise<ProcessedImage[]> {
  const ext = extOf(file.name)
  const type = (file.type || '').toLowerCase()

  if (type === 'application/pdf' || ext === 'pdf') return decodePdf(file)
  if (type.includes('heic') || type.includes('heif') || ext === 'heic' || ext === 'heif') return [await decodeHeic(file)]
  if (type === 'image/tiff' || ext === 'tif' || ext === 'tiff') {
    try { return [await decodeNative(file, file.name)] } catch { return decodeTiff(file) }
  }
  if (ext === 'psd' || type.includes('photoshop') || type === 'image/vnd.adobe.photoshop') return [await decodePsd(file)]

  // GIF animado: mantém original para preservar animação
  if (type === 'image/gif' || ext === 'gif') {
    return [{ blob: file, ext: 'gif', contentType: 'image/gif', sourceName: file.name }]
  }

  return [await decodeNative(file, file.name)]
}

/** Atalho para campos de imagem única (avatar, logo): retorna a primeira imagem. */
export async function processSingleImage(file: File, options: ProcessOptions = {}): Promise<ProcessedImage> {
  const [first] = await processUploadFile(file, options)
  if (!first) throw new Error('Nenhuma imagem encontrada no arquivo')
  return first
}
