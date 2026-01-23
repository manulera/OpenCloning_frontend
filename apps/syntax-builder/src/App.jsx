import React from 'react';
import { 
  Box,
  Container
} from '@mui/material';
import DesignForm from './components/DesignForm';
import { FormDataProvider, useFormData } from './context/FormDataContext';
import StartingPage from './components/StartingPage';
import OverhangsStep from './components/OverhangsStep';


function AppContent() {
  const { parts } = useFormData();
  const [overhangsStep, setOverhangsStep] = React.useState(false);

  const renderContent = React.useCallback(() => {
    if (overhangsStep) {
      return <OverhangsStep setOverhangsStep={setOverhangsStep}/>;
    }
    else if (parts.length === 0) {
      return <StartingPage setOverhangsStep={setOverhangsStep}/>;
    }
    return <DesignForm />;
  }, [overhangsStep, parts]);

  const isDesignForm = parts.length > 0 && !overhangsStep;
  
  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      ...(isDesignForm && {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      })
    }} className="app-content">
      <Container maxWidth="xl" sx={{ 
        py: 3, 
        pb: 5, 
        ...(isDesignForm && {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        })
      }}>
        <Box sx={{ 
          ...(isDesignForm && {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          })
        }}>
          {renderContent()}
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <FormDataProvider>
      <AppContent />
    </FormDataProvider>
  );
}

export default App;
