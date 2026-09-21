export class UploadedImageResponse {
  /** Public URL — assign straight to fields such as `Asset.photoUrl`. */
  url: string;

  /** Object key, for a later delete. */
  key: string;

  contentType: string;

  /** Decoded size in bytes. */
  size: number;
}
