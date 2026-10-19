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
  'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence',
  '.jpg', '.jpeg', '.jfif', '.pjpeg', '.png', '.webp', '.avif', '.gif', '.bmp',
  '.ico', '.svg', '.heic', '.heif', '.tif', '.tiff', '.psd', '.pdf',
].join(',')

const MAX_DIMENSION = 4000
const QUALITY = 0.88

export interface ProcessOptions {
  /** Lado maior máximo em px (padrão 4000) */
  maxDimension?: number
  /** Preserva transparência (logos). Fallback em PNG em vez de JPEG. */
  transparent?: boolean
  /** Texto da marca d'água (nome da imobiliária) */
  watermarkText?: string | null
}

// Opções da conversão em andamento (uploads são processados sequencialmente)
let opts: { maxDimension: number; transparent: boolean; watermarkText: string | null } =
  { maxDimension: MAX_DIMENSION, transparent: false, watermarkText: null }

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
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

// ─── WATERMARK: texto dourado puro, sem fundo ────────────────────────────────

const WATERMARK_FONT = '"Playfair Display", "Georgia", "Times New Roman", serif'
const GOLD_COLOR = '#C5A55A'        // Dourado elegante
const GOLD_LIGHT = '#E8D5A3'        // Dourado claro (para brilho)

let fontLoaded = false
let fontLoadPromise: Promise<void> | null = null

/** Carrega Playfair Display do Google Fonts e adiciona ao document. Idempotente. */
function ensureFont(): Promise<void> {
  if (fontLoaded) return Promise.resolve()
  if (fontLoadPromise) return fontLoadPromise
  fontLoadPromise = (async () => {
    try {
      const font = new FontFace(
        'Playfair Display',
        'url(https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2)',
        { weight: '700', style: 'normal' }
      )
      const loaded = await font.load()
      document.fonts.add(loaded)
    } catch {
      // Fallback silencioso: Georgia/serif também é elegante
    } finally {
      fontLoaded = true
    }
  })()
  return fontLoadPromise
}

/**
 * Grava o nome da imobiliária em texto dourado no centro da foto.
 * Técnica multi-passada robusta — testada e visível em qualquer cor de fundo.
 *
 * IMPORTANTE: esta função é async porque aguarda o carregamento da fonte
 * antes de desenhar, garantindo que Playfair Display seja usada.
 */
async function applyWatermark(canvas: HTMLCanvasElement): Promise<void> {
  const text = opts.watermarkText
  if (!text) return

  // Garante que a fonte está carregada ANTES de medir/desenhar
  await ensureFont()

  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  // Tamanho proporcional: 5% da largura, entre 24px e 140px
  const fontSize = Math.max(24, Math.min(140, Math.round(W * 0.05)))
  const fontStr = `bold ${fontSize}px "Playfair Display", Georgia, serif`

  ctx.save()
  ctx.font = fontStr
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const cx = W / 2
  const cy = H / 2
  const blur = Math.max(4, Math.round(fontSize * 0.10))
  const label = text.toUpperCase()

  // ── Passada 1: sombra escura sólida (garante legibilidade em fotos claras) ──
  // Usamos strokeText com fill sólido: técnica confiável em todos os browsers
  ctx.globalAlpha = 0.60
  ctx.shadowColor = 'rgba(0,0,0,1)'
  ctx.shadowBlur = blur * 4
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = 'rgba(0,0,0,0.001)'      // quase invisível: ativa a sombra
  ctx.strokeStyle = 'rgba(0,0,0,0.001)'
  ctx.lineWidth = fontSize * 0.08
  ctx.strokeText(label, cx, cy)            // strokeText é mais confiável p/ sombra
  ctx.fillText(label, cx, cy)

  // ── Passada 2: halo branco difuso (garante legibilidade em fotos escuras) ──
  ctx.globalAlpha = 0.45
  ctx.shadowColor = 'rgba(255,255,255,1)'
  ctx.shadowBlur = blur * 2
  ctx.fillStyle = 'rgba(255,255,255,0.001)'
  ctx.strokeStyle = 'rgba(255,255,255,0.001)'
  ctx.strokeText(label, cx, cy)
  ctx.fillText(label, cx, cy)

  // ── Passada 3: texto dourado principal — sólido e visível ──
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.globalAlpha = 0.70            // 70%: bem visível sem cobrir a foto
  ctx.fillStyle = GOLD_COLOR        // #C5A55A
  ctx.strokeStyle = 'rgba(80,50,0,0.3)'   // borda sutilíssima marrom para definição
  ctx.lineWidth = 1
  ctx.strokeText(label, cx, cy)
  ctx.fillText(label, cx, cy)

  // ── Passada 4: brilho metalizado dourado claro ──
  ctx.globalAlpha = 0.30
  ctx.shadowColor = GOLD_LIGHT      // #E8D5A3
  ctx.shadowBlur = blur
  ctx.fillStyle = GOLD_LIGHT
  ctx.fillText(label, cx, cy)

  ctx.restore()
}

/** Pré-carrega a fonte para garantir que está pronta na hora do upload. */
export async function prepareWatermark(text: string): Promise<string> {
  await ensureFont()
  return text
}

async function finalize(canvas: HTMLCanvasElement, sourceName: string): Promise<ProcessedImage> {
  await applyWatermark(canvas)   // ← await: garante fonte carregada e texto desenhado
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
    const isSvg = blob.type.includes('svg') || /\.svg$/i.test(name)
    // Sem dimensões = decodificação falhou silenciosamente (evita gerar imagem em branco)
    if (!img.naturalWidth && !isSvg) throw new Error('Imagem sem dimensões (decodificação falhou)')
    const w = img.naturalWidth || 1920
    const h = img.naturalHeight || 1080
    return finalize(drawToCanvas(img, w, h), name)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Detecta HEIC/HEIF pelo conteúdo (assinatura ISO-BMFF "ftyp" + brand),
 * independente de extensão ou MIME — cobre arquivos renomeados para .jpg,
 * vindos do WhatsApp/AirDrop/Google Fotos, ou com MIME vazio no Windows.
 */
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'mif2', 'miaf']
async function sniffHeic(file: Blob): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 64).arrayBuffer())
    if (head.length < 16) return false
    const ascii = (a: number, b: number) => String.fromCharCode(...head.slice(a, b))
    if (ascii(4, 8) !== 'ftyp') return false
    const boxSize = Math.min(64, (head[0] << 24) | (head[1] << 16) | (head[2] << 8) | head[3])
    const brands = [ascii(8, 12)]
    for (let i = 16; i + 4 <= boxSize; i += 4) brands.push(ascii(i, i + 4))
    // AVIF também usa mif1, mas navegadores modernos decodificam nativamente
    if (brands.includes('avif') || brands.includes('avis')) return false
    return brands.some(b => HEIF_BRANDS.includes(b))
  } catch {
    return false
  }
}

async function decodeHeic(file: File): Promise<ProcessedImage> {
  const errors: string[] = []

  // 1) Nativo: Safari/macOS/iOS (e Windows com extensão HEIF) decodificam direto
  try { return await decodeNative(file, file.name) } catch (e) { errors.push(`nativo: ${(e as Error).message}`) }

  // 2) heic-to (libheif 1.23 — suporta HEIC de iPhones recentes, HDR, grids, 10-bit)
  try {
    const { heicTo } = await import('heic-to/next')
    const bmp = await heicTo({ blob: file, type: 'bitmap', options: { imageOrientation: 'from-image' } })
    const canvas = drawToCanvas(bmp, bmp.width, bmp.height)
    bmp.close()
    return await finalize(canvas, file.name)
  } catch (e) {
    errors.push(`heic-to: ${(e as Error)?.message || e}`)
  }

  // 3) heic2any (libheif antigo) como último recurso
  try {
    const heic2any = (await import('heic2any')).default
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
    const jpeg = Array.isArray(out) ? out[0] : out
    return await decodeNative(jpeg, file.name)
  } catch (e) {
    const err = e as { message?: string; code?: number }
    errors.push(`heic2any: ${err?.message || JSON.stringify(e)}`)
  }

  console.error('[HEIC] Todas as estratégias falharam:', file.name, errors)
  throw new Error('Não foi possível converter o HEIC. No iPhone, ative Ajustes → Câmera → Formatos → "Mais Compatível" ou exporte como JPG.')
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
  opts = {
    maxDimension: options.maxDimension ?? MAX_DIMENSION,
    transparent: options.transparent ?? false,
    watermarkText: options.watermarkText ?? null,
  }
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
  if (type.includes('heic') || type.includes('heif') || ext === 'heic' || ext === 'heif' || await sniffHeic(file)) return [await decodeHeic(file)]
  if (type === 'image/tiff' || ext === 'tif' || ext === 'tiff') {
    try { return [await decodeNative(file, file.name)] } catch { return decodeTiff(file) }
  }
  if (ext === 'psd' || type.includes('photoshop') || type === 'image/vnd.adobe.photoshop') return [await decodePsd(file)]

  // GIF animado: mantém original para preservar animação — exceto quando há
  // marca d'água, pois um GIF sem proteção anularia a segurança.
  if ((type === 'image/gif' || ext === 'gif') && !opts.watermarkText) {
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
