// Django owns product image *files*: Product.images is a JSONField of
// URLs the backend hands back after an upload. Client-side resize/WebP-
// encode still happens in imageProcessing.js; only the upload/delete
// transport lives here. The saved shape is { large: "<url>", thumb:
// "<url>" } — src/lib/images.js is the single place that resolves that
// shape for display, so nothing downstream (ProductDetail, Collection,
// Cart, Inventory, Admin Products) needs to know how it got there.
import { authFetch } from '../services/api';
import { processProductImage, toWebPFilename, extensionForMime } from './imageProcessing';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — applies to the original picked file, before optimization
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Checked at selection time, before we ever touch the network, so bad
// files never even get queued for processing/upload.
export function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a supported image type (use JPG, PNG, WEBP, GIF, or AVIF).`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" is ${mb}MB — max size is 5MB.`;
  }
  return null;
}

// Nothing in this pipeline should ever be able to hang the "Uploading…"
// button forever with no feedback.
function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function friendlyUploadError(err) {
  if (err?.status === 401 || err?.status === 403) {
    return 'Upload blocked — your admin session may have expired. Try signing in again.';
  }
  if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
    return 'Upload failed to reach the server. Check your connection and that the backend is running.';
  }
  return err?.message || 'Upload failed for an unknown reason.';
}

// Optimizes one picked file into large (max 1600px) + thumb (max 400px)
// WebP variants (via imageProcessing.js) and uploads both to Django in a
// single multipart request to POST /api/products/<productId>/images/.
// Resolves with { large: url, thumb: url }.
//
// fetch's native XHR-less upload doesn't expose byte-level progress, so
// onProgress here reports coarse milestones (0 -> start, 1 -> done)
// rather than a smooth stream. The admin form only ever displays this as
// a percentage/spinner, so this is a visual-smoothness trade-off only —
// no behavior depends on fine-grained progress values.
export async function uploadProductImageSet(productId, file, onProgress) {
  const invalidReason = validateImageFile(file);
  if (invalidReason) throw new Error(invalidReason);

  onProgress?.(0);

  const { large, thumb } = await withTimeout(
    processProductImage(file),
    20000,
    `"${file.name}" took too long to process in this browser — try a smaller image or a different browser.`
  );

  const baseName = toWebPFilename(file.name).replace(/\.webp$/, '');
  const largeName = `${baseName}.${extensionForMime(large.type)}`;
  const thumbName = `${baseName}.${extensionForMime(thumb.type)}`;

  const formData = new FormData();
  formData.append('large', large, largeName);
  formData.append('thumb', thumb, thumbName);

  try {
    const result = await withTimeout(
      authFetch(`/products/${productId}/images/`, { method: 'POST', body: formData }),
      60000,
      `"${file.name}" upload timed out — check your connection and that the backend is reachable.`
    );
    onProgress?.(1);
    if (!result?.large || !result?.thumb) {
      throw new Error('Upload finished but the server did not return image URLs.');
    }
    return { large: result.large, thumb: result.thumb };
  } catch (err) {
    throw new Error(friendlyUploadError(err));
  }
}

// Each file's optimize+upload runs independently, so one bad file or
// network hiccup never blocks the others.
export async function uploadProductImageSets(productId, files, onFileProgress) {
  const results = await Promise.allSettled(
    files.map((file) =>
      uploadProductImageSet(productId, file, (p) => onFileProgress?.(file, p))
    )
  );
  const succeeded = [];
  const failed = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      succeeded.push({ file: files[i], large: result.value.large, thumb: result.value.thumb });
    } else {
      failed.push({ file: files[i], error: result.reason?.message || 'Upload failed.' });
    }
  });
  return { succeeded, failed };
}

// ProductForm.jsx calls this as deleteProductImageSet(image), with no
// productId in scope at the call site (see removeExistingImage). The
// Django delete endpoint is scoped at /api/products/<id>/images/, so the
// id is recovered here by parsing it back out of our own upload
// endpoint's URL shape (".../media/products/<id>/large|thumb/<file>"),
// which every Django-saved image URL always contains. A URL that doesn't
// match this shape (e.g. a legacy image URL from before this pipeline
// existed) simply isn't something this endpoint owns — a non-fatal no-op.
function extractProductId(url) {
  const match = typeof url === 'string' && url.match(/\/products\/(\d+)\//);
  return match ? match[1] : null;
}

export async function deleteProductImageSet(image) {
  if (!image || typeof image === 'string') return;

  const productId = extractProductId(image.large) || extractProductId(image.thumb);
  if (!productId) return; // not a Django-hosted image — nothing owned here to delete

  const params = new URLSearchParams();
  if (image.large) params.set('large', image.large);
  if (image.thumb) params.set('thumb', image.thumb);
  try {
    await authFetch(`/products/${productId}/images/?${params.toString()}`, { method: 'DELETE' });
  } catch {
    // already gone, or not a path this product's images endpoint owns —
    // non-fatal, matches storage.js
  }
}
