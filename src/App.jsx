import React from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { isEqual } from 'lodash-es';
import MainAppBar from './components/navigation/MainAppBar';
import OpenCloning from './components/OpenCloning';
import { cloningActions } from './store/cloning';
import useDatabase from './hooks/useDatabase';
import useUrlParameters from './hooks/useUrlParameters';
import useLoadDatabaseFile from './hooks/useLoadDatabaseFile';

const { setConfig, setKnownErrors } = cloningActions;

function App() {
  const dispatch = useDispatch();
  const database = useDatabase();
  const urlParams = useUrlParameters();
  const { loadDatabaseFile, historyFileError } = useLoadDatabaseFile({ source: { id: 1 }, sendPostRequest: null });

  React.useEffect(() => {
    async function loadSequenceFromUrlParams() {
      if (database && urlParams.database && urlParams.database === database.name) {
        const { file, databaseId } = await database.loadSequenceFromUrlParams(urlParams);
        loadDatabaseFile(file, databaseId);
      }
    }
    loadSequenceFromUrlParams();
  }, [database, urlParams]);

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
