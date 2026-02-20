import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Core/App';
import './main.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
