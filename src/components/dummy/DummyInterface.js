import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import GetSequenceFileAndDatabaseIdComponent from './GetSequenceFileAndDatabaseIdComponent';

export default {
  // Name of the database interface
  name: 'Dummy',
  // Returns a link to the sequence in the database
  getSequenceLink: (databaseId) => `your/url/${databaseId}`,
  // Returns a link to the primer in the database
  getPrimerLink: (databaseId) => `your/url/${databaseId}`,
  // Component for selecting and loading sequence files from the database
  GetSequenceFileAndDatabaseIdComponent,
  // Component for selecting and loading primers from the database
  GetPrimerComponent: null,
  // Component for submitting resources to the database
  SubmitToDatabaseComponent: null,
  // Component for handling primers not yet in database
  PrimersNotInDatabaseComponent: null,
  // Function to submit a primer to the database
  submitPrimerToDatabase: null,
  // Function to submit a sequence and its history to the database
  submitSequenceToDatabase: null,
  // Function to validate submission data
  isSubmissionDataValid: null,
  // Icon displayed on the node corner to submit
  SubmitIcon: SaveIcon,
  // Icon displayed on the node corner for entities in the database
  DatabaseIcon: LinkIcon,
  // OPTIONAL =======================================================================
  // Component for loading history from the database (can be hook-like does not have to render anything)
  LoadHistoryComponent: null,
  // Function to load sequences from url parameters
  loadSequenceFromUrlParams: null,
  // Function to get the primer ({name, database_id, sequence}) from the database
  getPrimer: null,
  // Function to get the name of a sequence from the database
  getSequenceName: null,
  // Function to get the sequencing files from the database, see docs for what the return value should be
  getSequencingFiles: null,
};
