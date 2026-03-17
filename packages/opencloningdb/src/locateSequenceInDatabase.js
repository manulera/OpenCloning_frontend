import { openCloningDBHttpClient } from './common';
import endpoints from './endpoints';

export default async function locateSequenceInDatabase(sequence) {

  const response = await openCloningDBHttpClient.post(endpoints.sequenceSearch, sequence)

  return response.data;
}
