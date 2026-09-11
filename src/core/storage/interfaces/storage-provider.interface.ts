import { PutObjectOptions } from './put-object-options.interface';

export interface StorageProvider {
    /** Stores the object and resolves to the URL it can be read from. */
    put(options: PutObjectOptions): Promise<string>;

    delete(key: string): Promise<void>;
}
