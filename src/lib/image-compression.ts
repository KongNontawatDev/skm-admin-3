const SMALL_IMAGE_BYTES = 500 * 1024
const SMALL_IMAGE_MAX_DIMENSION = 1400

type ImageSize = { width: number; height: number }

function targetMaxDimension(bytes: number, maxDimension: number): number {
  if (bytes > 8 * 1024 * 1024 || maxDimension > 4200) return 1920
  if (bytes > 3 * 1024 * 1024 || maxDimension > 2600) return 1800
  return 1600
}

function qualityForImage(bytes: number): number {
  if (bytes > 8 * 1024 * 1024) return 0.72
  if (bytes > 3 * 1024 * 1024) return 0.76
  return 0.8
}

function loadImage(file: File): Promise<{ image: HTMLImageElement; size: ImageSize }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ image, size: { width: image.naturalWidth, height: image.naturalHeight } })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('INVALID_IMAGE_DATA'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('IMAGE_COMPRESSION_FAILED'))
    }, type, quality)
  })
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const { image, size } = await loadImage(file)
  const maxDimension = Math.max(size.width, size.height)
  if (file.size <= SMALL_IMAGE_BYTES && maxDimension <= SMALL_IMAGE_MAX_DIMENSION) return file

  const target = targetMaxDimension(file.size, maxDimension)
  const scale = Math.min(1, target / maxDimension)
  const width = Math.max(1, Math.round(size.width * scale))
  const height = Math.max(1, Math.round(size.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/webp', qualityForImage(file.size))
  if (blob.size >= file.size * 0.92) return file

  const nextName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${nextName}.webp`, { type: 'image/webp', lastModified: Date.now() })
}
