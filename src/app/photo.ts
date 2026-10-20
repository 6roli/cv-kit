/**
 * Turns a local image file into a small square JPEG data URL, entirely in the
 * browser (canvas). The photo is centre-cropped and scaled to 360 × 360 px,
 * which is sharp at print size (~30 mm) and usually 20–40 kB.
 */
const SIZE = 360;
const QUALITY = 0.85;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export async function photoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  if (file.size > MAX_INPUT_BYTES) throw new Error('This image is larger than 25 MB. Please choose a smaller one.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be read. Try a JPG or PNG file.');
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const target = Math.min(SIZE, side);

  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot resize images.');
  // White background so transparent PNGs do not turn black in JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, target, target);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', QUALITY);
}
