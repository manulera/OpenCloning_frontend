import React from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import { isEqual } from 'lodash-es';
import MainAppBar from './components/navigation/MainAppBar';
import OpenCloning from './components/OpenCloning';
import { cloningActions } from './store/cloning';
import useDatabase from './hooks/useDatabase';
import { getUrlParameters } from './utils/other';
import useLoadDatabaseFile from './hooks/useLoadDatabaseFile';
import useAlerts from './hooks/useAlerts';
import useHttpClient from './hooks/useHttpClient';
import useValidateState from './hooks/useValidateState';
import { formatTemplate } from './utils/readNwrite';

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
            const { data } = await httpClient.get(`${import.meta.env.BASE_URL}examples/${urlParams.example}`);
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

          const source = {
            id: 1,
            type: 'KnownGenomeCoordinatesSource',
            assembly_accession,
            sequence_accession,
            start,
            end,
            strand,
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
