import '@mantine/core/styles.layer.css';
import './global.css';

import { MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './router';
import { cssVariablesResolver } from './theme/cssVariablesResolver';
import { theme } from './theme/theme';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <MantineProvider
        theme={theme}
        defaultColorScheme="auto"
        cssVariablesResolver={cssVariablesResolver}
      >
        <RouterProvider router={router} />
      </MantineProvider>
    </StrictMode>,
  );
}
