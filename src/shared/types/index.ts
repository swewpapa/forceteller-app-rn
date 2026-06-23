/** Common utility types shared across the app. */
export type Nullable<T> = T | null;

export interface ApiError {
  code: string;
  message: string;
}
