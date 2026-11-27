/**
 * Remove metadata from a JPEG without re-encoding it: drops APP1 (EXIF incl. GPS, XMP), APP2-APP15 except
 * APP2 ICC colour profiles, and COM segments. Keeps APP0 (JFIF), quantisation/huffman tables and image data.
 * Returns null when the buffer is not a well-formed JPEG (caller should reject the upload).
 */
export function isJpeg(buf) {
  return Buffer.isBuffer(buf) && buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

export function stripJpegMetadata(buf) {
  if (!isJpeg(buf)) return null;
  const out = [buf.subarray(0, 2)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    let marker = buf[i + 1];
    while (marker === 0xff) { i += 1; marker = buf[i + 1]; } // fill bytes
    if (marker === undefined) return null;
    if (marker === 0xd9) { out.push(buf.subarray(i, i + 2)); return Buffer.concat(out); }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { out.push(buf.subarray(i, i + 2)); i += 2; continue; }
    if (i + 4 > buf.length) return null;
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) return null;
    const seg = buf.subarray(i, i + 2 + len);
    if (marker === 0xda) { out.push(buf.subarray(i)); return Buffer.concat(out); } // start of scan: rest is image data
    const isApp = marker >= 0xe1 && marker <= 0xef;
    const isIcc = marker === 0xe2 && seg.subarray(4, 15).toString("latin1") === "ICC_PROFILE";
    const drop = marker === 0xfe || (isApp && !isIcc);
    if (!drop) out.push(seg);
    i += 2 + len;
  }
  return null;
}

/** True when the JPEG still carries an EXIF/XMP block (used by tests). */
export function hasExif(buf) {
  if (!isJpeg(buf)) return false;
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker === 0xda || marker === 0xd9) return false;
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1) return true;
    i += 2 + len;
  }
  return false;
}
