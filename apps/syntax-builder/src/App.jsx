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

  const renderContent = () => {
    if (overhangsStep) {
      return <OverhangsStep setOverhangsStep={setOverhangsStep}/>;
    }
    else if (parts.length === 0) {
      return <StartingPage setOverhangsStep={setOverhangsStep}/>;
    }
    return <DesignForm />;
  };

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="xl" sx={{ py: 3, pb: 5, minHeight: 'auto' }}>
        <Box sx={{ mb: 3 }}>
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
