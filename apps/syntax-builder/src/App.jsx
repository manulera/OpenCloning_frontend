import React from 'react';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Box, 
  Paper, 
  Container
} from '@mui/material';
import DesignForm from './components/DesignForm';
import SubmissionInformation from './components/SubmissionInformation';
import OverhangsStep from './components/OverhangsStep';
import { FormDataProvider, useFormData } from './context/FormDataContext';

const steps = ['Submission Information', 'Overhangs', 'Design'];

function AppContent() {
  const [activeStep, setActiveStep] = React.useState(0);
  const { submission, parts, resetFormData } = useFormData();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    resetFormData();
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    // formData contains all form data: submission, overhangs, and design.parts
    console.log('Saving form data:', { submission, parts });
  };

  const renderStepContent = (step) => {
    switch (step) {
    case 0:
      return <SubmissionInformation />;
    case 1:
      return <OverhangsStep />;
    case 2:
      return <DesignForm />;
    default:
      return null;
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="xl" sx={{ py: 3, pb: 5, minHeight: 'auto' }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              onClick={handleSave}
            >
              Save
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button onClick={handleReset}>
                  Reset
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mb: 3 }}>
          {renderStepContent(activeStep)}
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
