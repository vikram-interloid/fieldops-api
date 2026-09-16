export interface PutObjectOptions {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
}
