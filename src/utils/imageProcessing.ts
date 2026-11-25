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

const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_QUALITY = 0.82

export interface ProcessedImage {
  blob: Blob
  ext: 'webp' | 'jpg' | 'png' | 'gif'
  contentType: string
  sourceName: string
}

export interface Watermark {
  /** Canvas com logo já processada (fundo branco removido) */
  image: HTMLCanvasElement
  width: number
  height: number
}

export interface ProcessOptions {
  maxDimension?: number
  quality?: number
  transparent?: boolean
  /** Logo para marca d'água (use loadWatermark). Fundo branco removido automaticamente. */
  watermark?: Watermark | null
  /** Texto fallback caso não haja logo cadastrada */
  watermarkText?: string | null
}

interface ResolvedOptions {
  maxDimension: number
  quality: number
  transparent: boolean
  watermark: Watermark | null
  watermarkText: string | null
}

const extOf = (name: string) => (name.split('.').pop() || '').toLowerCase()

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  opts: ResolvedOptions
): Promise<{ blob: Blob; ext: 'webp' | 'jpg' | 'png' }> {
  const toBlob = (type: string) =>
    new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), type, opts.quality))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' }
  const fallback = opts.transparent ? 'image/png' : 'image/jpeg'
  const out = await toBlob(fallback)
  if (!out) throw new Error('Falha ao gerar imagem')
  return { blob: out, ext: opts.transparent ? 'png' : 'jpg' }
}

function fitSize(w: number, h: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(w, h))
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

function drawToCanvas(source: CanvasImageSource, srcW: number, srcH: number, opts: ResolvedOptions) {
  const { w, h } = fitSize(srcW, srcH, opts.maxDimension)
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

// ─── WATERMARK: logo sem fundo branco ────────────────────────────────────────

function removeLogoBackground(canvas: HTMLCanvasElement, tolerance = 42): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { width: w, height: h } = canvas
  if (!w || !h) return canvas
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  let total = 0, opaque = 0, sr = 0, sg = 0, sb = 0
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4
    total++
    if (d[i + 3] > 200) { opaque++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2] }
  }
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1) }
  for (let y = 1; y < h - 1; y++) { sample(0, y); sample(w - 1, y) }

  if (opaque / total >= 0.5) {
    const bgR = sr / opaque, bgG = sg / opaque, bgB = sb / opaque
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
    ctx.putImageData(imageData, 0, 0)
  }

  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return canvas
  const pad = 2
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad)
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad)
  const tw = maxX - minX + 1, th = maxY - minY + 1
  if (tw === w && th === h) return canvas
  const out = document.createElement('canvas')
  out.width = tw
  out.height = th
  out.getContext('2d')!.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th)
  return out
}

const watermarkCache = new Map<string, Promise<Watermark>>()

export function loadWatermark(url: string): Promise<Watermark> {
  if (!watermarkCache.has(url)) {
    const p = (async () => {
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`Logo indisponível (HTTP ${res.status})`)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      try {
        const img = await new Promise<HTMLImageElement>((ok, fail) => {
          const el = new Image()
          el.onload = () => ok(el)
          el.onerror = () => fail(new Error('Logo em formato inválido'))
          el.src = objUrl
        })
        const nw = img.naturalWidth || 1200
        const nh = img.naturalHeight || 400
        const scale = Math.max(1, 1600 / Math.max(nw, nh))
        const c = document.createElement('canvas')
        c.width = Math.round(nw * scale)
        c.height = Math.round(nh * scale)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        const clean = removeLogoBackground(c)
        return { image: clean, width: clean.width, height: clean.height }
      } finally {
        URL.revokeObjectURL(objUrl)
      }
    })()
    p.catch(() => watermarkCache.delete(url))
    watermarkCache.set(url, p)
  }
  return watermarkCache.get(url)!
}

async function applyWatermark(canvas: HTMLCanvasElement, opts: ResolvedOptions): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  const wm = opts.watermark
  if (wm && wm.width && wm.height) {
    let w = W * 0.15
    let h = w * (wm.height / wm.width)
    if (h > H * 0.15) { h = H * 0.15; w = h * (wm.width / wm.height) }
    const x = (W - w) / 2
    const y = (H - h) / 2

    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.globalAlpha = 0.75
    ctx.drawImage(wm.image, x, y, w, h)
    ctx.restore()
    return
  }

  const text = opts.watermarkText
  if (!text) return

  const fontSize = Math.max(18, Math.min(80, Math.round(W * 0.03)))
  const fontStr = `bold ${fontSize}px "Playfair Display", Georgia, serif`
  const label = text.toUpperCase()
  const blur = Math.max(2, Math.round(fontSize * 0.08))

  ctx.save()
  ctx.font = fontStr
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  ctx.globalAlpha = 0.45
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = blur * 2
  ctx.fillStyle = 'rgba(0,0,0,0.001)'
  ctx.strokeStyle = 'rgba(0,0,0,0.001)'
  ctx.lineWidth = fontSize * 0.06
  ctx.strokeText(label, W / 2, H / 2)
  ctx.fillText(label, W / 2, H / 2)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#C5A55A'
  ctx.fillText(label, W / 2, H / 2)

  ctx.restore()
}

export async function prepareWatermark(url: string): Promise<Watermark> {
  return loadWatermark(url)
}

async function finalize(canvas: HTMLCanvasElement, sourceName: string, opts: ResolvedOptions): Promise<ProcessedImage> {
  await applyWatermark(canvas, opts)
  const { blob, ext } = await canvasToBlob(canvas, opts)
  return { blob, ext, contentType: blob.type, sourceName }
}

async function decodeNative(blob: Blob, name: string, opts: ResolvedOptions): Promise<ProcessedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      const canvas = drawToCanvas(bmp, bmp.width, bmp.height, opts)
      bmp.close()
      return finalize(canvas, name, opts)
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
    if (!img.naturalWidth && !isSvg) throw new Error('Imagem sem dimensões (decodificação falhou)')
    const w = img.naturalWidth || 1920
    const h = img.naturalHeight || 1080
    return finalize(drawToCanvas(img, w, h, opts), name, opts)
  } finally {
    URL.revokeObjectURL(url)
  }
}

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
    if (brands.includes('avif') || brands.includes('avis')) return false
    return brands.some(b => HEIF_BRANDS.includes(b))
  } catch {
    return false
  }
}

async function decodeHeic(file: File, opts: ResolvedOptions): Promise<ProcessedImage> {
  const errors: string[] = []

  try { return await decodeNative(file, file.name, opts) } catch (e) { errors.push(`nativo: ${(e as Error).message}`) }

  try {
    const { heicTo } = await import('heic-to/next')
    const bmp = await heicTo({ blob: file, type: 'bitmap', options: { imageOrientation: 'from-image' } })
    const canvas = drawToCanvas(bmp, bmp.width, bmp.height, opts)
    bmp.close()
    return await finalize(canvas, file.name, opts)
  } catch (e) {
    errors.push(`heic-to: ${(e as Error)?.message || e}`)
  }

  try {
    const heic2any = (await import('heic2any')).default
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const jpeg = Array.isArray(out) ? out[0] : out
    return await decodeNative(jpeg, file.name, opts)
  } catch (e) {
    const err = e as { message?: string }
    errors.push(`heic2any: ${err?.message || JSON.stringify(e)}`)
  }

  console.error('[HEIC] Todas as estratégias falharam:', file.name, errors)
  throw new Error('Não foi possível converter o HEIC. No iPhone, ative Ajustes → Câmera → Formatos → "Mais Compatível" ou exporte como JPG.')
}

async function decodeTiff(file: File, opts: ResolvedOptions): Promise<ProcessedImage[]> {
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
    results.push(await finalize(drawToCanvas(src, w, h, opts), file.name, opts))
    break
  }
  if (!results.length) throw new Error('TIFF sem imagem válida')
  return results
}

async function decodePsd(file: File, opts: ResolvedOptions): Promise<ProcessedImage> {
  const { readPsd } = await import('ag-psd')
  const psd = readPsd(await file.arrayBuffer(), {
    skipLayerImageData: true,
    skipThumbnail: true,
    useImageData: false,
  })
  const composite = psd.canvas as HTMLCanvasElement | undefined
  if (!composite) throw new Error('PSD sem imagem composta (salve com "Maximizar compatibilidade")')
  return finalize(drawToCanvas(composite, composite.width, composite.height, opts), file.name, opts)
}

async function decodePdf(file: File, opts: ResolvedOptions): Promise<ProcessedImage[]> {
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
    results.push(await finalize(canvas, `${file.name} (pág. ${p})`, opts))
  }
  return results
}

/** Converte um arquivo qualquer em uma ou mais imagens prontas para web. */
export async function processUploadFile(file: File, options: ProcessOptions = {}): Promise<ProcessedImage[]> {
  const opts: ResolvedOptions = {
    maxDimension: options.maxDimension ?? DEFAULT_MAX_DIMENSION,
    quality: options.quality ?? DEFAULT_QUALITY,
    transparent: options.transparent ?? false,
    watermark: options.watermark ?? null,
    watermarkText: options.watermarkText ?? null,
  }
  return processInternal(file, opts)
}

async function processInternal(file: File, opts: ResolvedOptions): Promise<ProcessedImage[]> {
  const ext = extOf(file.name)
  const type = (file.type || '').toLowerCase()

  if (type === 'application/pdf' || ext === 'pdf') return decodePdf(file, opts)
  if (type.includes('heic') || type.includes('heif') || ext === 'heic' || ext === 'heif' || await sniffHeic(file)) {
    return [await decodeHeic(file, opts)]
  }
  if (type === 'image/tiff' || ext === 'tif' || ext === 'tiff') {
    try { return [await decodeNative(file, file.name, opts)] } catch { return decodeTiff(file, opts) }
  }
  if (ext === 'psd' || type.includes('photoshop') || type === 'image/vnd.adobe.photoshop') {
    return [await decodePsd(file, opts)]
  }

  if ((type === 'image/gif' || ext === 'gif') && !opts.watermarkText && !opts.watermark) {
    return [{ blob: file, ext: 'gif', contentType: 'image/gif', sourceName: file.name }]
  }

  return [await decodeNative(file, file.name, opts)]
}

/** Atalho para campos de imagem única (avatar, logo): retorna a primeira imagem. */
export async function processSingleImage(file: File, options: ProcessOptions = {}): Promise<ProcessedImage> {
  const [first] = await processUploadFile(file, options)
  if (!first) throw new Error('Nenhuma imagem encontrada no arquivo')
  return first
}
