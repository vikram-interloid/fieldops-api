/** Largest decoded image we accept, in bytes. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Upper bound on the raw request string. Base64 inflates by 4/3, and we add
 * slack for the `data:image/jpeg;base64,` prefix. Enforced by the DTO so an
 * oversized payload is rejected before we allocate a Buffer for it.
 */
export const MAX_IMAGE_CONTENT_LENGTH =
    Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 128;

/**
 * Key prefixes callers may write to. A closed list keeps one caller from
 * scribbling into another feature's prefix or escaping via `../`.
 */
export const UPLOAD_FOLDERS = [
    'assets',
    'avatars',
    'work-orders',
    'service-cases',
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const DEFAULT_UPLOAD_FOLDER: UploadFolder = 'assets';

export const UPLOAD_MESSAGES = {
    INVALID_BASE64: 'Image content is not valid base64',
    UNSUPPORTED_TYPE:
        'Unsupported image format. Use JPEG, PNG, WebP, or GIF.',
    TOO_LARGE: `Image exceeds the ${MAX_IMAGE_BYTES / (1024 * 1024)}MB limit`,
    UPLOAD_FAILED: 'Could not store the image. Please try again.',
    ORGANIZATION_NOT_FOUND: 'User organization not found',
};
