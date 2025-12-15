import React from 'react';
import { useDispatch } from 'react-redux';
import { OpenCloning } from '@opencloning/ui/components';
import { cloningActions } from '@opencloning/store/cloning';

const { setConfig } = cloningActions;

function App() {
  const dispatch = useDispatch();
  const [configLoaded, setConfigLoaded] = React.useState(false);

  React.useEffect(() => {
    // Set minimal config
    dispatch(setConfig({
      backendUrl: 'http://localhost:8000',
      showAppBar: false,
      loaded: true,
    }));
    setConfigLoaded(true);
  }, [dispatch]);

  if (!configLoaded) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <OpenCloning />
    </div>
  );
}

export default App;
