// Client-side image optimization pipeline. Every image picked in the
// admin product form is resized + re-encoded here, in the browser,
// *before* it's ever uploaded to Django — so the backend only ever
// stores small, fast-loading WebP files instead of raw camera-sized
// originals.

export const LARGE_MAX_WIDTH = 1600;
export const THUMB_MAX_WIDTH = 400;
export const IMAGE_QUALITY = 0.82; // ~80-85% visual quality target

// Decodes a File into an HTMLImageElement so it can be drawn to a canvas.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't read "${file.name}" as an image.`));
    };
    img.src = url;
  });
}

// Draws `img` onto a canvas scaled down to `maxWidth` (never upscales a
// source image that's already smaller than the target), then encodes the
// result as WebP at `quality`.
function drawToWebP(img, maxWidth, quality) {
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image encoding failed.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

// Produces the two optimized variants the backend expects for every
// product image: a large (max 1600px wide) and a thumb (max 400px wide),
// both WebP at ~80-85% quality. Runs entirely in-browser before upload —
// the original full-resolution file is never sent anywhere.
export async function processProductImage(
  file,
  {
    largeMaxWidth = LARGE_MAX_WIDTH,
    thumbMaxWidth = THUMB_MAX_WIDTH,
    quality = IMAGE_QUALITY,
  } = {}
) {
  const img = await loadImage(file);
  const [large, thumb] = await Promise.all([
    drawToWebP(img, largeMaxWidth, quality),
    drawToWebP(img, thumbMaxWidth, quality),
  ]);
  return { large, thumb };
}

// Strips the original extension so the optimized upload is named
// `<base>.webp` regardless of the source format (jpg/png/heic/etc).
export function toWebPFilename(originalName) {
  const base = originalName.replace(/\.[^/.]+$/, '') || 'image';
  return `${base}.webp`;
}

// A handful of browsers/environments fall back to PNG when asked to
// encode WebP via canvas.toBlob. We upload whatever the browser actually
// produced (never a broken file) but name it to match the real content
// type instead of lying and calling a PNG "*.webp".
export function extensionForMime(mime) {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  return 'webp';
}
