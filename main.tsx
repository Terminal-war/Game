import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Core/App';
import { ErrorBoundary } from './Core/components/ErrorBoundary';
import './main.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
