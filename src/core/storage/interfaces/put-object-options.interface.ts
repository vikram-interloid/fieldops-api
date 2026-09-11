export interface PutObjectOptions {
    /** Full object key, e.g. `assets/<orgId>/<uuid>.jpg`. */
    key: string;

    body: Buffer;

    contentType: string;

    /**
     * Defaults to a long-lived immutable policy. Safe because every key
     * carries a random UUID, so an object is never overwritten in place.
     */
    cacheControl?: string;
}
