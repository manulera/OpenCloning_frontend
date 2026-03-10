import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import SequencesPage from './pages/SequencesPage';
import PrimersPage from './pages/PrimersPage';
import SequenceDetailPage from './pages/SequenceDetailPage';
import PrimerDetailPage from './pages/PrimerDetailPage';

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = ['/sequences', '/primers'].includes(location.pathname)
    ? location.pathname
    : location.pathname.startsWith('/sequences')
      ? '/sequences'
      : location.pathname.startsWith('/primers')
        ? '/primers'
        : '/sequences';

  return (
    <>
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
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/sequences" replace />} />
          <Route path="/sequences" element={<SequencesPage />} />
          <Route path="/sequences/:id" element={<SequenceDetailPage />} />
          <Route path="/primers" element={<PrimersPage />} />
          <Route path="/primers/:id" element={<PrimerDetailPage />} />
        </Routes>
      </Box>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
