import axios from 'axios';
import { readApiKey, writeApiKey, baseUrl as envBaseUrl } from './envValues';

export const baseUrl = envBaseUrl;
export const readHeaders = readApiKey ? { Authorization: readApiKey } : {};
export const writeHeaders = writeApiKey ? { Authorization: writeApiKey } : {};

export const getFileFromELabFTW = async (itemId, fileInfo) => {
  const url = `${baseUrl}/api/v2/items/${itemId}/uploads/${fileInfo.id}?format=binary`;
  const resp = await axios.get(url, { headers: readHeaders, responseType: 'blob' });
  // Convert blob to file
  return new File([resp.data], fileInfo.real_name);
};

export const getFileInfoFromELabFTW = async (itemId, fileId) => {
  const url = `${baseUrl}/api/v2/items/${itemId}/uploads/${fileId}`;
  const resp = await axios.get(url, { headers: readHeaders });
  return resp.data;
};
