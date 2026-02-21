import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Core/App';
import { RootErrorBoundary } from './Core/components/RootErrorBoundary';
import './main.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
