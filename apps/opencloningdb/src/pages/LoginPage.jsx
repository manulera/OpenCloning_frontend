import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { setUser, setWorkspaceId } from '../store/authSlice';
import { openCloningDBHttpClient, endpoints, setWorkspaceHeader } from '@opencloning/opencloningdb';

async function loginAndGetUser(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const { data: { access_token } } = await openCloningDBHttpClient.post(endpoints.authToken, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  localStorage.setItem('token', access_token);
  const { data: user } = await openCloningDBHttpClient.get(endpoints.authMe);
  const { data: workspaces } = await openCloningDBHttpClient.get(endpoints.workspaces);
  return { user, workspaceId: workspaces[0].id };
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/sequences';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => loginAndGetUser(email, password),
    onSuccess: ({ user, workspaceId }) => {
      setWorkspaceHeader(workspaceId);
      dispatch(setUser(user));
      dispatch(setWorkspaceId(workspaceId));
      navigate(from, { replace: true });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutate();
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 4 }}>
      <Typography sx={{color: 'primary.main'}} variant="h1" textAlign="center" >
        OpenCloningDB
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h5" textAlign="center">
          Sign in
        </Typography>
        {error && <Alert severity="error">{error.response?.data?.detail ?? 'Login failed'}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? <CircularProgress size={24} /> : 'Sign in'}
        </Button>
        <Typography textAlign="center" variant="body2">
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to="/signup">
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
