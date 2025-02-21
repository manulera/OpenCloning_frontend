import axios from 'axios';

const writeApiKey = import.meta.env.VITE_ELABFTW_API_WRITE_KEY || '';
const readApiKey = import.meta.env.VITE_ELABFTW_API_KEY || '';

export const baseUrl = import.meta.env.VITE_ELABFTW_BASE_URL || '';
export const readHeaders = readApiKey ? { Authorization: readApiKey } : {};
export const writeHeaders = writeApiKey ? { Authorization: writeApiKey } : {};

export const getFileFromELabFTW = async (itemId, fileInfo) => {
  const url = `${baseUrl}/api/v2/items/${itemId}/uploads/${fileInfo.id}?format=binary`;
  const resp = await axios.get(url, { headers: readHeaders, responseType: 'blob' });
  // Convert blob to file
  return new File([resp.data], fileInfo.real_name);
};
