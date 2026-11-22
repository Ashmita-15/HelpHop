/**
 * Preparing a cover photograph for upload.
 *
 * Organisations upload straight from a phone, where a photo is routinely 4MB
 * and 4000px wide. Everything here happens in the browser: the picture is
 * drawn into a canvas at a sensible size and re-encoded, so what reaches the
 * API is a small JPEG rather than the original.
 */

/** Longest edge of the stored picture. Cards and detail headers never exceed this. */
const MAX_EDGE = 1600;

/** Roughly the server's ceiling, with room to spare. */
const MAX_BYTES = 850 * 1024;

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Approximate decoded byte length of a base64 data URL. */
export const dataUrlBytes = (dataUrl) => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
};

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
      reject(new Error('That file could not be opened as an image.'));
    };
    img.src = url;
  });
}

/**
 * Reads a File and returns a JPEG data URL no larger than MAX_EDGE on its
 * longest side, stepping the quality down until it fits under MAX_BYTES.
 * Throws an Error with a message fit to show the organiser.
 */
export async function prepareCoverImage(file) {
  if (!file) throw new Error('No file was chosen.');
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG or WebP image.');
  }
  // Guard before decoding: a 60MB file would otherwise be decoded first.
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('That image is very large. Please choose one under 25MB.');
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not process that image.');

  // JPEG has no alpha; paint the paper colour behind transparent PNGs rather
  // than letting them turn black.
  ctx.fillStyle = '#FFFCF7';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of [0.82, 0.72, 0.62, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlBytes(dataUrl) <= MAX_BYTES) return { dataUrl, width, height };
  }

  throw new Error('That image is too detailed to compress. Please try a different one.');
}
