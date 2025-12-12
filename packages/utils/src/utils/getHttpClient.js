import axios from 'axios';
import urlWhitelist from '../config/urlWhitelist';

export default function getHttpClient(extraUrls = []) {
  const whitelist = [...urlWhitelist, import.meta.env.BASE_URL, window.location.origin, ...extraUrls];

  const client = axios.create();

  client.interceptors.request.use((config) => {
    const url = new URL(config.url, config.baseURL || window.location.origin);

    if (!whitelist.some((whitelistedUrl) => url.href.match(new RegExp(`^${whitelistedUrl}`)))) {
      return Promise.reject(new Error(`Request blocked: URL not in whitelist ${url.href}`));
    }

    return config;
  }, (error) => Promise.reject(error));

  return client;
}
