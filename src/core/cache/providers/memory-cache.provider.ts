import { Injectable } from '@nestjs/common';
import { CacheProvider } from '../interfaces/cache-provider.interface';
interface CacheEntry {
  value: any;
  expiresAt: number | null;
}
@Injectable()
export class MemoryCacheProvider implements CacheProvider {
  private readonly store = new Map<string, CacheEntry>();
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
  async reset(): Promise<void> {
    this.store.clear();
  }
}
