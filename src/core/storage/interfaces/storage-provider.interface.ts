import { PutObjectOptions } from './put-object-options.interface';

export interface StorageProvider {
  put(options: PutObjectOptions): Promise<string>;
  delete(key: string): Promise<void>;
}
