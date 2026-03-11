import './i18n';
import './style.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const el = document.getElementById('root');
if (!el) throw new Error('Root element missing in index.html');

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
