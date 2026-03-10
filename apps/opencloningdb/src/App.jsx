import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Link as MuiLink } from '@mui/material';
import SequencesPage from './pages/SequencesPage';
import PrimersPage from './pages/PrimersPage';

function NavLink({ to, children }) {
  return (
    <MuiLink component={RouterLink} to={to} color="inherit" sx={{ mx: 2 }}>
      {children}
    </MuiLink>
  );
}

function AppLayout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OpenCloning Database
          </Typography>
          <NavLink to="/sequences">Sequences</NavLink>
          <NavLink to="/primers">Primers</NavLink>
        </Toolbar>
      </AppBar>
      <main style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/sequences" replace />} />
          <Route path="/sequences" element={<SequencesPage />} />
          <Route path="/primers" element={<PrimersPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
