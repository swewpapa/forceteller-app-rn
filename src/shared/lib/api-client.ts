import axios from 'axios';
import { env } from '../config';

/** Shared axios instance. Feature APIs build on top of this. */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10 * 1000,
});
