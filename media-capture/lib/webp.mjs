// Size of a WebP image, read from its header (lossy VP8, lossless VP8L and extended VP8X), so the
// media index needs no image library.

import fs from 'node:fs';

/** { width, height } of a WebP file buffer; throws when it is not a WebP image. */
export function webpSize(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP image');
  }
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    // Frame tag (3 bytes), start code 9d 01 2a, then 14-bit width and height
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) throw new Error('bad VP8 start code');
    return {width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff};
  }
  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2f) throw new Error('bad VP8L signature');
    const bits = buf.readUInt32LE(21);
    return {width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1};
  }
  if (chunk === 'VP8X') {
    return {width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1};
  }
  throw new Error(`unknown WebP chunk "${chunk}"`);
}

export function webpFileSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(32);
    fs.readSync(fd, buf, 0, 32, 0);
    return webpSize(buf);
  } finally {
    fs.closeSync(fd);
  }
}
