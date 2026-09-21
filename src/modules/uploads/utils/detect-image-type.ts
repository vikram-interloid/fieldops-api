export interface DetectedImageType {
  mime: string;
  extension: string;
}

/**
 * Identifies an image by its magic bytes rather than by the `data:` prefix or
 * a client-supplied filename, both of which the caller controls.
 *
 * SVG is deliberately absent: it can carry script, and anything served from
 * the bucket runs on the origin it is served from.
 */
export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG — FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', extension: 'png' };
  }

  // WebP — "RIFF" .... "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', extension: 'webp' };
  }

  // GIF — "GIF87a" / "GIF89a"
  const gifHeader = buffer.toString('ascii', 0, 6);
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return { mime: 'image/gif', extension: 'gif' };
  }

  return null;
}
