/* global Buffer */
/**
 * Remove metadata from a PNG without re-encoding: keeps only the chunks needed to draw the image
 * (IHDR, PLTE, tRNS, IDAT, IEND + colour chunks gAMA/cHRM/sRGB/iCCP/sBIT/pHYs). Drops tEXt/zTXt/iTXt/eXIf/tIME
 * and every unknown/private chunk (EXIF, GPS, XMP, software, comments). CRCs are checked.
 * Returns null when the buffer is not a well-formed PNG (caller should reject the upload).
 */
const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const KEEP = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "pHYs"]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export const isPng = (buf) => Buffer.isBuffer(buf) && buf.length > 8 && buf.subarray(0, 8).equals(SIG);

export function pngChunkTypes(buf) {
  if (!isPng(buf)) return [];
  const types = [];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    types.push(buf.subarray(i + 4, i + 8).toString("latin1"));
    i += 12 + len;
  }
  return types;
}

export function stripPngMetadata(buf) {
  if (!isPng(buf)) return null;
  const out = [SIG];
  let i = 8; let sawIhdr = false;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    if (i + 12 + len > buf.length) return null;
    const type = buf.subarray(i + 4, i + 8).toString("latin1");
    if (!/^[A-Za-z]{4}$/.test(type)) return null;
    const body = buf.subarray(i + 4, i + 8 + len);
    if (crc32(body) !== buf.readUInt32BE(i + 8 + len)) return null;
    if (!sawIhdr && type !== "IHDR") return null;
    sawIhdr = true;
    if (KEEP.has(type)) out.push(buf.subarray(i, i + 12 + len));
    if (type === "IEND") return Buffer.concat(out);
    i += 12 + len;
  }
  return null;
}
