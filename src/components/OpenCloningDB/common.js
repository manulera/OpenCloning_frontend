import axios from 'axios';

export const baseUrl = 'http://localhost:8001';

export const openCloningDBHttpClient = axios.create({
  baseURL: baseUrl,
});
