/** Largest decoded image we accept, in bytes (10MB). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Largest general attachment we accept, in bytes (25MB). */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Upper bound on the raw request string for base64 image uploads.
 * Base64 inflates by 4/3, plus slack for data URI header.
 */
export const MAX_IMAGE_CONTENT_LENGTH =
  Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 128;

/**
 * Key prefixes callers may write to.
 */
export const UPLOAD_FOLDERS = [
  'assets',
  'avatars',
  'work-orders',
  'service-cases',
  'attachments',
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const DEFAULT_UPLOAD_FOLDER: UploadFolder = 'assets';

export const UPLOAD_MESSAGES = {
  INVALID_BASE64: 'Image content is not valid base64',
  UNSUPPORTED_TYPE: 'Unsupported file format.',
  TOO_LARGE: `File exceeds the allowed size limit`,
  UPLOAD_FAILED: 'Could not store the file. Please try again.',
  ORGANIZATION_NOT_FOUND: 'User organization not found',
  FILE_REQUIRED: 'File is required',
};
