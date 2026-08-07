// Every product image is one of two shapes:
//   - legacy:   "https://...jpg"                (pre-optimization products)
//   - current:  { large: "https://...webp", thumb: "https://...webp" }
//
// These helpers are the single place that resolves either shape to a
// displayable URL, so every page/component can ask for "the thumb" or
// "the large" version without caring which format a given product was
// saved with. This is what lets old and new products render side by side
// during migration.

export function getImageUrl(image, size = 'large') {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image[size] || image.large || image.thumb || '';
}

export function getThumbUrl(image) {
  return getImageUrl(image, 'thumb');
}

export function getLargeUrl(image) {
  return getImageUrl(image, 'large');
}

// Convenience wrapper for the common "give me the right-sized image for
// this context" case. `type` is one of:
//   'collection' | 'related' | 'cart'  -> thumb
//   'detail'                           -> large
// Existing call sites already use getThumbUrl/getLargeUrl directly and
// don't need to change — this just gives new code a single, explicit
// entry point that encodes the sizing rule instead of repeating it.
const THUMB_CONTEXTS = new Set(['collection', 'related', 'cart', 'thumb']);

export function getProductImage(product, type = 'thumb') {
  const image = product?.images?.[0];
  const size = THUMB_CONTEXTS.has(type) ? 'thumb' : 'large';
  return getImageUrl(image, size);
}
