import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Core/App';
import { RootErrorBoundary } from './Core/components/RootErrorBoundary';
import { logBoot } from './Core/runtime/diagnostics';
import './main.css';

const mountNode = document.getElementById('root');

if (!mountNode) {
  logBoot('mount', 'Root mount node #root was not found in index.html.', 'error');
  throw new Error('Unable to mount app: missing #root');
}

logBoot('mount', 'Mounting RootAccess UI.');


const redirectedPath = sessionStorage.getItem('rootaccess:redirect-path');
if (redirectedPath) {
  sessionStorage.removeItem('rootaccess:redirect-path');
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (redirectedPath !== current) {
    window.history.replaceState(null, '', redirectedPath);
    logBoot('routing', 'Recovered SPA path from 404 redirect.', 'info', { redirectedPath });
  }
}


createRoot(mountNode).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
