import React from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { isEqual } from 'lodash-es';
import MainAppBar from './components/navigation/MainAppBar';
import OpenCloning from './components/OpenCloning';
import { cloningActions } from './store/cloning';
import useDatabase from './hooks/useDatabase';
import { getUrlParameters } from './utils/other';
import useLoadDatabaseFile from './hooks/useLoadDatabaseFile';
import useAlerts from './hooks/useAlerts';

const { setConfig, setKnownErrors } = cloningActions;

function App() {
  const dispatch = useDispatch();
  const database = useDatabase();
  const { addAlert } = useAlerts();
  const setHistoryFileError = (e) => addAlert({ message: e, severity: 'error' });
  const { loadDatabaseFile } = useLoadDatabaseFile({ source: { id: 1 }, sendPostRequest: null, setHistoryFileError });

  React.useEffect(() => {
    async function loadSequenceFromUrlParams() {
      if (!database) {
        return;
      }
      const urlParams = getUrlParameters();
      if (urlParams.source === 'database') {
        try {
          const { file, databaseId } = await database.loadSequenceFromUrlParams(urlParams);
          loadDatabaseFile(file, databaseId);
          // Clear URL parameters after successful loading
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          addAlert({
            message: 'Error loading sequence from URL parameters',
            severity: 'error',
          });
          console.error(error);
        }
      }
    }
    loadSequenceFromUrlParams();
  }, [database]);

  React.useEffect(() => {
    // Load application configuration
    axios.get(`${import.meta.env.BASE_URL}config.json`).then(({ data }) => {
      dispatch(setConfig(data));
    });
    // Load known errors from google sheet
    axios.get(`${import.meta.env.BASE_URL}known_errors.json`)
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
