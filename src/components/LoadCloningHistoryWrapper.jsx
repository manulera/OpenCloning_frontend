import React from 'react';
import { batch, useDispatch, useStore } from 'react-redux';
import useAlerts from '../hooks/useAlerts';
import useBackendRoute from '../hooks/useBackendRoute';
import useValidateState from '../hooks/useValidateState';
import { cloningActions } from '../store/cloning';
import { mergeStates } from '../utils/network';
import { loadFilesToSessionStorage, loadHistoryFile } from '../utils/readNwrite';
import HistoryLoadedDialog from './HistoryLoadedDialog';
import useHttpClient from '../hooks/useHttpClient';

const { setState: setCloningState, deleteSourceAndItsChildren, addSourceAndItsOutputEntity } = cloningActions;

async function processSequenceFiles(files, backendRoute, httpClient) {
  const allSources = [];
  const allEntities = [];
  const allWarnings = [];

  const processFile = async (file) => {
    const fileName = file.name;
    const fileContent = await file.arrayBuffer();
    const newFile = new File([fileContent], fileName);

    const formData = new FormData();
    formData.append('file', newFile);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    const url = backendRoute('read_from_file');
    try {
      const { data: { sources, sequences }, headers } = await httpClient.post(url, formData, config);
      // If there are warnings, add them to the list of warnings
      const warnings = headers['x-warning'] ? [`${fileName}: ${headers['x-warning']}`] : [];
      return { sources, sequences, warnings };
    } catch (e) {
      if (e.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to backend server');
      } else {
        console.error(e);
        throw new Error(`Could not read the file ${fileName}`);
      }
    }
  };

  const results = await Promise.all(Array.from(files).map((file) => processFile(file)));

  results.forEach(({ sources, sequences, warnings }) => {
    allSources.push(...sources);
    allEntities.push(...sequences);
    allWarnings.push(...warnings);
  });

  return { sources: allSources, entities: allEntities, warnings: allWarnings };
}

function LoadCloningHistoryWrapper({ fileList, clearFiles, children }) {
  const { addAlert } = useAlerts();
  const dispatch = useDispatch();
  const backendRoute = useBackendRoute();
  const store = useStore();
  const validateState = useValidateState();
  const httpClient = useHttpClient();

  const [fileLoaderFunctions, setFileLoaderFunctions] = React.useState(null);

  React.useEffect(() => {
    if (fileList.length === 0) {
      return;
    }
    setFileLoaderFunctions(null);
    const files = Array.from(fileList);
    clearFiles();
    const processFileSubmission = async () => {
      const cloningState = store.getState().cloning;
      const isZipFile = files.length === 1 && files[0].name.endsWith('.zip');
      const isJsonFile = files.length === 1 && files[0].name.endsWith('.json');
      // If the file is a zip or json file, load the history file
      if (isZipFile || isJsonFile) {
        let cloningStrategy;
        let verificationFiles;
        try {
          ({ cloningStrategy, verificationFiles } = await loadHistoryFile(files[0]));
        } catch (e) {
          console.error(e);
          addAlert({ message: e.message, severity: 'error' });
          return;
        }

        const updateState = async (newState, networkShift) => {
          dispatch(setCloningState(newState));
          await loadFilesToSessionStorage(verificationFiles, networkShift);
          validateState(newState);
        };

        const replaceState = async () => {
          await updateState(cloningStrategy, 0);
        };

        const addState = async () => {
          const { mergedState, networkShift } = mergeStates(cloningStrategy, cloningState);
          await updateState(mergedState, networkShift);
        };

        const errorWrapper = (fn) => async () => {
          try {
            await fn();
          } catch (e) {
            console.error(e);
            addAlert({ message: e.message, severity: 'error' });
          }
        };
          // If there are no sequences in the cloning state, load the history file
        if (cloningState.entities.length === 0) {
          errorWrapper(replaceState)();
        } else {
          setFileLoaderFunctions({ addState: errorWrapper(addState), replaceState: errorWrapper(replaceState), clear: () => setFileLoaderFunctions(null) });
        }
        // If there are sequences in the cloning state, give the option to merge or replace

        // You cannot drop a zip or json file and a sequence file at the same time
      } else if (files.some((file) => file.name.endsWith('.json') || file.name.endsWith('.zip'))) {
        addAlert({
          message: 'Drop either a single JSON/zip file or multiple sequence files. Not both.',
          severity: 'error',
        });
        // Process a bunch of sequence files
      } else {
        try {
          const { sources, entities, warnings } = await processSequenceFiles(files, backendRoute, httpClient);
          batch(() => {
            // If there is only one source and it is empty, delete it
            if (cloningState.sources.length === 1 && cloningState.sources[0].type === null) {
              dispatch(deleteSourceAndItsChildren(cloningState.sources[0].id));
            }
            for (let i = 0; i < sources.length; i += 1) {
              dispatch(addSourceAndItsOutputEntity({ source: sources[i], entity: entities[i] }));
            }
            warnings.forEach((warning) => addAlert({ message: warning, severity: 'warning' }));
          });
        } catch (e) {
          console.error(e);
          addAlert({
            message: e.message,
            severity: 'error',
          });
        }
      }
    };
    processFileSubmission();
  }, [fileList]);
  return (
    <>
      {fileLoaderFunctions && <HistoryLoadedDialog fileLoaderFunctions={fileLoaderFunctions} />}
      {children}
    </>
  );
}

export default LoadCloningHistoryWrapper;
