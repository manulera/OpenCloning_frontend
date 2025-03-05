import axios from 'axios';
import { readApiKey, writeApiKey, baseUrl as envBaseUrl } from './envValues';

export const baseUrl = envBaseUrl;
export const readHeaders = readApiKey ? { Authorization: readApiKey } : {};
export const writeHeaders = writeApiKey ? { Authorization: writeApiKey } : {};

export const eLabFTWHttpClient = axios.create({
  baseURL: baseUrl,
});

export const makeSequenceMetadata = (sequence) => JSON.stringify({
  extra_fields: {
    sequence: {
      type: 'text',
      value: sequence,
      group_id: null,
    },
  },
});
