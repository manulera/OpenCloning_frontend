import React from 'react';
import { createRoot } from 'react-dom/client';
// Import UI package styles (includes all component styles)
import '@opencloning/ui';
import App from './App';

// Ensure body and html can scroll
document.documentElement.style.overflowY = 'auto';
document.body.style.overflowY = 'auto';
document.body.style.height = 'auto';

const container = document.getElementById('root');
const root = createRoot(container);


root.render(

  <App />
);
