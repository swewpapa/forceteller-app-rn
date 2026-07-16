/** Common utility types shared across the app. */
export type Nullable<T> = T | null;

export type { KVStorage } from './kv-storage-types';

export interface ApiError {
  code: string;
  message: string;
}
