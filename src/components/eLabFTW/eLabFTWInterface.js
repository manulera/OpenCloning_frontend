import axios from 'axios';
import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import GetSequenceFileAndDatabaseIdComponent from './GetSequenceFileAndDatabaseIdComponent';
import SubmitToDatabaseComponent from './SubmitToDatabaseComponent';
import PrimersNotInDabaseComponent from './PrimersNotInDatabaseComponent';
import GetPrimerComponent from './GetPrimerComponent';
import { baseUrl, getFileFromELabFTW, getFileInfoFromELabFTW, writeHeaders, readHeaders } from './common';
import LoadHistoryComponent from './LoadHistoryComponent';

function error2String(error) {
  if (error.code === 'ERR_NETWORK') { return 'Network error: Cannot connect to eLabFTW'; }
  if (!error.code) {
    return 'Internal error, please contact the developers.';
  }
  const { description } = error.response.data;
  if (error.response.status === 500) return 'Internal server error';
  if (typeof description === 'string') {
    return description;
  }
  return 'Request error, please contact the developers.';
}

async function deleteResource(resourceId) {
  const url = `${baseUrl}/api/v2/items/${resourceId}`;
  // eLabFTW requires application/json for delete requests, axios seems to require a data field for it to work
  const resp = await axios.delete(url, { data: {}, headers: { ...writeHeaders, 'Content-Type': 'application/json' } });
  return resp.data;
}

const linkToParent = async (childId, parentId) => {
  await axios.post(
    `${baseUrl}/api/v2/items/${childId}/items_links/${parentId}`,
    { parent_id: parentId },
    { headers: writeHeaders },
  );
};

const createResource = async (categoryId) => {
  const createdItemResponse = await axios.post(
    `${baseUrl}/api/v2/items`,
    {
      category_id: categoryId,
      tags: [],
    },
    { headers: writeHeaders },
  );
  return Number(createdItemResponse.headers.location.split('/').pop());
};

const patchResource = async (resourceId, title, metadata = undefined) => axios.patch(
  `${baseUrl}/api/v2/items/${resourceId}`,
  { title, metadata },
  { headers: writeHeaders },
);

async function submitPrimerToDatabase({ submissionData: { title, categoryId }, primer, linkedSequenceId = null }) {
  let resourceId;
  try {
    resourceId = await createResource(categoryId);
  } catch (e) {
    console.error(e);
    throw new Error(`Error creating primer: ${error2String(e)}`);
  }
  const metadata = JSON.stringify({ extra_fields: { sequence: { type: 'text', value: primer.sequence, group_id: null } } });
  let stage;
  try {
    stage = 'naming primer';
    await patchResource(resourceId, title, metadata);
    if (linkedSequenceId) {
      await linkToParent(linkedSequenceId, resourceId);
    }
  } catch (e) {
    console.error(e);
    try {
      await deleteResource(resourceId);
    } catch (e2) {
      console.error(e2);
      throw new Error(`There was an error (${error2String(e2)}) while trying to delete primer after an error ${stage}`);
    }
    throw new Error(`Error ${stage}: ${error2String(e)}`);
  }
  return resourceId;
}

async function uploadTextFileToResource(resourceId, fileName, textContent, comment) {
  const blob = new Blob([textContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('comment', comment);
  const response = await axios.post(`${baseUrl}/api/v2/items/${resourceId}/uploads`, formData, { headers: writeHeaders });
  return Number(response.headers.location.split('/').pop());
}

async function submitSequenceToDatabase({ submissionData: { title, sequenceCategoryId, primerCategoryId }, substate, id }) {
  /**
   * Submit a sequence to eLabFTW database
   * @param {Object} params - The parameters object
   * @param {Object} params.submissionData - Data needed for submission
   * @param {string} params.submissionData.title - Title of the sequence
   * @param {number} params.submissionData.sequenceCategoryId - Category ID in eLabFTW
   * @param {Object} params.substate - The substate containing sequence data
   * @param {Array} params.substate.sources - Array of source objects
   * @param {Array} params.substate.primers - Array of primer objects
   * @param {Array} params.substate.entities - Array of entity objects
   * @param {string} params.id - ID of the sequence to submit
   * @returns {Promise<Object>}
   */

  const { sources, primers, entities } = substate;

  const entity2export = entities.find((e) => e.id === id);
  // Get ancestor sources that are database sources to link to the sequence
  const parentDatabaseSources = sources.filter((source) => source.database_id);
  const parentResourceIds = parentDatabaseSources.map((source) => source.database_id);
  const primerIds = primers.map((p) => p.id);

  // Link and/or add used primers
  const newPrimersToSave = [];
  const existingPrimersToLink = primers.filter((p) => primerIds.includes(p.id) && p.database_id).map((p) => p.database_id);
  if (primerCategoryId) {
    newPrimersToSave.push(...primers.filter((p) => primerIds.includes(p.id) && !p.database_id));
  }

  // Create and name the resource
  let resourceId;
  let newPrimerDatabaseIds;
  try {
    resourceId = await createResource(sequenceCategoryId);
  } catch (e) {
    console.error(e);
    throw new Error(`Error creating resource: ${error2String(e)}`);
  }
  let stage;
  try {
    // Patch the resource with the title
    stage = 'setting resource title';
    await patchResource(resourceId, title);

    // Add the links to parent Resources
    stage = 'linking to parent resources';
    await Promise.all(parentResourceIds.map((parentId) => linkToParent(resourceId, parentId)));

    // Add the links to the existing primers
    stage = 'linking to existing primers';
    await Promise.all(existingPrimersToLink.map((primerId) => linkToParent(resourceId, primerId)));

    // Add the new primers to the database and link them to the resource
    stage = 'submitting new primers';
    newPrimerDatabaseIds = await Promise.all(newPrimersToSave.map((primer) => submitPrimerToDatabase({ submissionData: { title: primer.name, categoryId: primerCategoryId }, primer, linkedSequenceId: resourceId })));
    const primerMappings = newPrimerDatabaseIds.map((databaseId, index) => ({ databaseId, localId: newPrimersToSave[index].id }));

    // Deep-copy primers and update the primers with the database IDs before storing the history
    const primersCopy = primers.map((p) => ({ ...p }));
    primerMappings.forEach(({ databaseId: dbId, localId }) => {
      primersCopy.find((p) => p.id === localId).database_id = dbId;
    });

    // Add the sequence and history files to the resource
    stage = 'uploading sequence file';
    await uploadTextFileToResource(resourceId, `${title}.gb`, entity2export.file_content, 'resource sequence - generated by OpenCloning');
    stage = 'uploading history file';
    await uploadTextFileToResource(resourceId, `${title}_history.json`, JSON.stringify({ sources, primers: primersCopy, sequences: entities }), 'history file - generated by OpenCloning');
    // Format output values
    const databaseId = resourceId;
    return { primerMappings, databaseId };
  } catch (e) {
    console.error(e);
    try {
      await deleteResource(resourceId);
      await Promise.all(newPrimerDatabaseIds.map(deleteResource));
    } catch (e2) {
      console.error(e2);
      throw new Error(`There was an error (${error2String(e2)}) while trying to delete the sequence after an error ${stage}`);
    }
    throw new Error(`Error ${stage}: ${error2String(e)}`);
  }
}

function isSubmissionDataValid(submissionData) {
  // This function is necessary because you might be setting submissionData from multiple components
  return submissionData.title && submissionData.sequenceCategoryId;
}

async function loadSequenceFromUrlParams(urlParams) {
  const { item_id: itemId, file_id: fileId } = urlParams;

  if (itemId && fileId) {
    const fileInfo = await getFileInfoFromELabFTW(itemId, fileId);
    const file = await getFileFromELabFTW(itemId, fileInfo);
    return { file, databaseId: itemId };
  }
  return null;
}

async function getPrimerName(databaseId) {
  const url = `${baseUrl}/api/v2/items/${databaseId}`;
  const resp = await axios.get(url, { headers: readHeaders });
  return resp.data.title;
}

export default function eLabFTWInterface() {
  return {
    // Name of the database interface
    name: 'eLabFTW',
    // Returns a link to the sequence in the database
    getSequenceLink: (databaseId) => `${baseUrl}/database.php?mode=view&id=${databaseId}`,
    // Returns a link to the primer in the database
    getPrimerLink: (databaseId) => `${baseUrl}/database.php?mode=view&id=${databaseId}`,
    // Component for selecting and loading sequence files from the database
    GetSequenceFileAndDatabaseIdComponent,
    // Component for selecting and loading primers from the database
    GetPrimerComponent,
    // Component for submitting resources to the database
    SubmitToDatabaseComponent,
    // Component for handling primers not yet in database
    PrimersNotInDabaseComponent,
    // Function to submit a primer to the database
    submitPrimerToDatabase,
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
    loadSequenceFromUrlParams,
    // Function to get the name of a primer from the database
    getPrimerName,
  };
}
