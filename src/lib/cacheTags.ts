import { revalidateTag } from 'next/cache'

/**
 * Tags centralizadas do Data Cache do Next.js.
 * Toda mutação de imóveis deve chamar `invalidatePublicPropertyCache()` para
 * que a landing page reflita a alteração imediatamente.
 */
export const FEATURED_PROPERTIES_TAG = 'featured-properties'

/**
 * Expira imediatamente o cache público de imóveis.
 * Usa `revalidateTag(..., { expire: 0 })` em vez de `updateTag` porque também é
 * chamado a partir de Route Handlers (ex.: POST /api/admin/properties).
 */
export function invalidatePublicPropertyCache() {
  revalidateTag(FEATURED_PROPERTIES_TAG, { expire: 0 })
}
