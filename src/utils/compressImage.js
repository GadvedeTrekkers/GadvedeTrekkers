/**
 * Re-encode an image file in the browser as a JPEG data URL (max side 1600 px, ≤ maxBytes).
 * Drawing to a canvas drops ALL metadata (EXIF, GPS, camera info); the server strips again as a second guard.
 * Orientation is applied first so phone photos are not sideways.
 */
export const MAX_PICK_BYTES = 10 * 1024 * 1024;

async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function dataUrlBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((b64.length * 3) / 4);
}

export async function compressImageToJpeg(file, { maxSide = 1600, maxBytes = 1.8 * 1024 * 1024 } = {}) {
  if (!file || !/^image\//.test(file.type || "")) throw new Error("Please choose an image (photo or screenshot).");
  if (file.size > MAX_PICK_BYTES) throw new Error("Image is larger than 10 MB. Please send a smaller screenshot.");
  let source;
  try { source = await decode(file); } catch { throw new Error("This image format could not be opened. Please upload a JPG or PNG screenshot."); }
  let width = source.width; let height = source.height;
  let scale = Math.min(1, maxSide / Math.max(width, height));
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // transparent PNG screenshots → white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const quality = [0.85, 0.75, 0.65, 0.6, 0.55, 0.5][attempt];
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrlBytes(dataUrl) <= maxBytes) {
      source.close?.();
      return { dataUrl, bytes: dataUrlBytes(dataUrl), width: canvas.width, height: canvas.height };
    }
    scale *= 0.8;
  }
  source.close?.();
  throw new Error("Could not make this image small enough. Please crop the screenshot and try again.");
}
