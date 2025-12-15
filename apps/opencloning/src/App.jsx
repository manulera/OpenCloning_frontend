import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { isEqual } from 'lodash-es';
import MainAppBar from '@opencloning/ui/components/navigation/MainAppBar';
import OpenCloning from '@opencloning/ui/components/OpenCloning';
import { cloningActions } from '@opencloning/store/cloning';
import useDatabase from '@opencloning/ui/hooks/useDatabase';
import { formatSequenceLocationString, getUrlParameters } from '@opencloning/utils/other';
import useLoadDatabaseFile from '@opencloning/ui/hooks/useLoadDatabaseFile';
import useAlerts from '@opencloning/ui/hooks/useAlerts';
import useHttpClient from '@opencloning/ui/hooks/useHttpClient';
import useValidateState from '@opencloning/ui/hooks/useValidateState';
import { formatTemplate, loadHistoryFile, loadFilesToSessionStorage } from '@opencloning/utils/readNwrite';

const { setConfig, setKnownErrors, setState: setCloningState, updateSource } = cloningActions;

function App() {
  const dispatch = useDispatch();
  const database = useDatabase();
  const { addAlert } = useAlerts();
  const setHistoryFileError = (e) => addAlert({ message: e, severity: 'error' });
  const { loadDatabaseFile } = useLoadDatabaseFile({ source: { id: 1 }, sendPostRequest: null, setHistoryFileError });
  const [urlLoaded, setUrlLoaded] = React.useState(false);
  const configLoaded = useSelector((state) => state.cloning.config.loaded);
  const validateState = useValidateState();

  const httpClient = useHttpClient();

  React.useEffect(() => {
    async function loadSequenceFromUrlParams() {
      if (!configLoaded) {
        return;
      }
      const urlParams = getUrlParameters();
      if (!urlLoaded) {
        setUrlLoaded(true);
        if (urlParams.source === 'database') {
          try {
            if (!database) {
              return;
            }
            const { file, databaseId } = await database.loadSequenceFromUrlParams(urlParams);
            loadDatabaseFile(file, databaseId);
          } catch (error) {
            addAlert({
              message: 'Error loading sequence from URL parameters',
              severity: 'error',
            });
            console.error(error);
          }
        } else if (urlParams.source === 'example' && urlParams.example) {
          try {
            const url = `${import.meta.env.BASE_URL}examples/${urlParams.example}`;
            let data;
            if (urlParams.example.endsWith('.zip')) {
              // For zip files, get as blob and process with loadHistoryFile
              const { data: blob } = await httpClient.get(url, { responseType: 'blob' });
              const fileName = urlParams.example;
              // eslint-disable-next-line no-undef
              const file = new File([blob], fileName);
              const { cloningStrategy, verificationFiles } = await loadHistoryFile(file);
              data = await validateState(cloningStrategy);
              await loadFilesToSessionStorage(verificationFiles, 0);
            } else {
              // For JSON files, get as JSON
              const { data: jsonData } = await httpClient.get(url);
              data = await validateState(jsonData);
            }
            dispatch(setCloningState(data));
          } catch (error) {
            addAlert({
              message: 'Error loading example',
              severity: 'error',
            });
            console.error(error);
          }
        } else if (urlParams.source === 'template' && urlParams.template && urlParams.key) {
          try {
            const baseUrl = 'https://assets.opencloning.org/OpenCloning-submission';
            const url = `${baseUrl}/processed/${urlParams.key}/templates/${urlParams.template}`;
            const { data } = await httpClient.get(url);
            const validatedData = await validateState(data);
            const newState = formatTemplate(validatedData, url);

            dispatch(setCloningState(newState));
          } catch (error) {
            addAlert({
              message: 'Error loading template',
              severity: 'error',
            });
            console.error(error);
          }
        } else if (urlParams.source === 'genome_coordinates') {
          const { sequence_accession, start, end, strand, assembly_accession } = urlParams;
          if (!sequence_accession || !start || !end || !strand) {
            addAlert({
              message: 'Error loading genome sequence from URL parameters',
              severity: 'error',
            });
            return;
          }
          const startNum = Number(start);
          const endNum = Number(end);
          const strandNum = Number(strand);
          let error = '';
          if (isNaN(startNum) || isNaN(endNum)) {
            error = 'Start and end must be numbers';
          }
          else if (![1, -1].includes(strandNum)) {
            error = 'Strand must be 1 or -1';
          }
          else if (startNum < 1) {
            error = 'Start must be greater than zero';
          }
          else if (startNum >= endNum) {
            error = 'End must be greater than start';
          }
          if (error) {
            addAlert({ message: `Error loading genome coordinates from URL parameters: ${error}`, severity: 'error' });
            return;
          }

          const source = {
            id: 1,
            type: 'KnownGenomeCoordinatesSource',
            assembly_accession,
            repository_id: sequence_accession,
            coordinates: formatSequenceLocationString(start, end, strand),
          }
          dispatch(updateSource(source));
        } else if (urlParams.source === 'locus_tag') {
          const { locus_tag, assembly_accession, padding } = urlParams;
          if (!locus_tag || !assembly_accession) {
            addAlert({
              message: 'Error loading locus tag from URL parameters',
              severity: 'error',
            });
            return;
          }

          const source = {
            id: 1,
            type: 'KnownGenomeCoordinatesSource',
            assembly_accession,
            locus_tag,
            padding: padding ? Number(padding) : 1000,
          }
          dispatch(updateSource(source));
        }
      }
    }
    loadSequenceFromUrlParams();
  }, [configLoaded]);

  React.useEffect(() => {
    // Load application configuration
    httpClient.get(`${import.meta.env.BASE_URL}config.json`)
      .then(({ data }) => {
        // Validate that data is an object, not HTML
        if (typeof data === 'object' && data !== null && !data.hasOwnProperty('length')) {
          dispatch(setConfig(data));
        } else {
          console.error('Invalid config data received:', data);
          // Use default config
          dispatch(setConfig({
            backendUrl: 'http://localhost:8000',
            showAppBar: true,
            loaded: true,
          }));
        }
      })
      .catch((error) => {
        console.error('Failed to load config:', error);
        // Use default config on error
        dispatch(setConfig({
          backendUrl: 'http://localhost:8000',
          showAppBar: true,
          loaded: true,
        }));
      });
    // Load known errors from google sheet
    httpClient.get(`${import.meta.env.BASE_URL}known_errors.json`)
      .then(({ data }) => { dispatch(setKnownErrors(data || {})); })
      .catch(() => {
        dispatch(setKnownErrors({}));
      });
    // Clear session storage
    sessionStorage.clear();
  }, []);

  const [stateLoaded, showAppBar] = useSelector((state) => [state.cloning.config.loaded, state.cloning.config.showAppBar], isEqual);

  if (!stateLoaded) {
    return <div className="loading-state-message">Loading...</div>;
  }
  return (
    <div className="App">
      {showAppBar && (
        <header className="App-header">
          <div className="app-title">
            <MainAppBar />
          </div>
        </header>
      )}
      <OpenCloning />
    </div>
  );
}

export default App;
