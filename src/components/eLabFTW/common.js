const writeApiKey = import.meta.env.VITE_ELABFTW_API_WRITE_KEY || '';
const readApiKey = import.meta.env.VITE_ELABFTW_API_KEY || '';

export const baseUrl = import.meta.env.VITE_ELABFTW_BASE_URL || '';
export const readHeaders = readApiKey ? { Authorization: readApiKey } : {};
export const writeHeaders = writeApiKey ? { Authorization: writeApiKey } : {};
