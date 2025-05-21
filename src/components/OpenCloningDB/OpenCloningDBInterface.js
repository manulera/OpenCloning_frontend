import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import GetSequenceFileAndDatabaseIdComponent from './GetSequenceFileAndDatabaseIdComponent';
import { baseUrl, openCloningDBHttpClient } from './common';
import LoadHistoryComponent from './LoadHistoryComponent';
import SubmitToDatabaseComponent from './SubmitToDatabaseComponent';
import PrimersNotInDatabaseComponent from './PrimersNotInDatabaseComponent';

function isSubmissionDataValid(submissionData) {
  return Boolean(submissionData.title);
}

async function submitSequenceToDatabase({ submissionData, substate, id }) {
  // const substateCopy = cloneDeep(substate);
  // const selectedSequence = substateCopy.sequences.find((s) => s.id === id);
  // selectedSequence.name = submissionData.title;
  // substateCopy.description = '';
  // console.log(substateCopy);
  const response = await openCloningDBHttpClient.post('/sequence', substate);
  return { primerMappings: [], databaseId: response.data.id };
}

export default {
  // Name of the database interface
  name: 'OpenCloningDB',
  // Returns a link to the sequence in the database
  getSequenceLink: (databaseId) => `${baseUrl}/sequence/${databaseId}`,
  // Returns a link to the primer in the database
  getPrimerLink: (databaseId) => `${baseUrl}/primer/${databaseId}`,
  // Component for selecting and loading sequence files from the database
  GetSequenceFileAndDatabaseIdComponent,
  // Component for selecting and loading primers from the database
  GetPrimerComponent: null,
  // Component for submitting resources to the database
  SubmitToDatabaseComponent,
  // Component for handling primers not yet in database
  PrimersNotInDatabaseComponent,
  // Function to submit a primer to the database
  submitPrimerToDatabase: null,
  // Function to submit a sequence and its history to the database
  submitSequenceToDatabase,
  // Function to validate submission data
  isSubmissionDataValid,
  // Icon displayed on the node corner to submit
  SubmitIcon: SaveIcon,
  // Icon displayed on the node corner for entities in the database
  DatabaseIcon: LinkIcon,
  // OPTIONAL =======================================================================
  // Component for loading history from the database (can be hook-like does not have to render anything)
  LoadHistoryComponent,
  // Function to load sequences from url parameters
  loadSequenceFromUrlParams: null,
  // Function to get the primer ({name, database_id, sequence}) from the database
  getPrimer: null,
  // Function to get the name of a sequence from the database
  getSequenceName: null,
  // Function to get the sequencing files from the database, see docs for what the return value should be
  getSequencingFiles: null,
};
