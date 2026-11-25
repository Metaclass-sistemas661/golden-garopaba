'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { shouldUnoptimizeImage } from '@/utils/propertyDisplay'

interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  fallbackSrc?: string
}

/**
 * Wrapper resiliente sobre `next/image`:
 * - Otimiza automaticamente imagens do Supabase, Unsplash e assets locais via AVIF/WebP (Sharp).
 * - Preserva `unoptimized` apenas para `blob:`, `data:`, SVGs ou domínios externos não listados.
 * - Evita 404 quebrado com fallback seguro para `/placeholder.svg`.
 */
export default function SmartImage({
  src,
  fallbackSrc = '/placeholder.svg',
  alt,
  unoptimized,
  onError,
  ...rest
}: SmartImageProps) {
  const normalizedSrc = src && src.trim().length > 0 ? src : fallbackSrc
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const effectiveSrc = failedSrc === normalizedSrc ? fallbackSrc : normalizedSrc
  const isUnoptimized = unoptimized ?? shouldUnoptimizeImage(effectiveSrc)

  return (
    <Image
      {...rest}
      src={effectiveSrc}
      alt={alt}
      unoptimized={isUnoptimized}
      onError={(e) => {
        if (effectiveSrc !== fallbackSrc) {
          setFailedSrc(normalizedSrc)
        }
        onError?.(e)
      }}
    />
  )
}
