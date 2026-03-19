import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import AppAlerts from './components/AppAlerts';
import { OpenCloningDBInterface } from '@opencloning/opencloningdb';
import SequencesPage from './pages/SequencesPage';
import PrimersPage from './pages/PrimersPage';
import DesignPage from './pages/DesignPage';
import SequenceDetailPage from './pages/SequenceDetailPage';
import PrimerDetailPage from './pages/PrimerDetailPage';
import LinesPage from './pages/LinesPage';
import LineDetailPage from './pages/LineDetailPage';

const queryClient = new QueryClient();

const config = {
  backendUrl: 'http://localhost:8000',
  showAppBar: false,
  enableAssembler: false,
  enablePlannotate: false,
};

const TABS = ['/sequences', '/primers', '/lines', '/design'];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = TABS.find((tab) => location.pathname === tab || location.pathname.startsWith(`${tab}/`)) ?? TABS[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4, color: 'white' }}>
            OpenCloning
          </Typography>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => navigate(newValue)}
            textColor="inherit"
            TabIndicatorProps={{
              sx: {
                backgroundColor: 'white',
              },
            }}
          >
            <Tab label="Sequences" value="/sequences" />
            <Tab label="Primers" value="/primers" />
            <Tab label="Lines" value="/lines" />
            <Tab label="Design" value="/design" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box sx={{zIndex: 9000}}>
        <AppAlerts />
      </Box>
      <Routes>
        <Route path="/" element={<Navigate to="/sequences" replace />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/sequences" element={<SequencesPage />} />
        <Route path="/sequences/:id" element={<SequenceDetailPage />} />
        <Route path="/primers" element={<PrimersPage />} />
        <Route path="/primers/:id" element={<PrimerDetailPage />} />
        <Route path="/lines" element={<LinesPage />} />
        <Route path="/lines/:id" element={<LineDetailPage />} />
      </Routes>
    </Box>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider config={config}>
          <DatabaseProvider value={OpenCloningDBInterface}>
            <AppLayout />
          </DatabaseProvider>
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
