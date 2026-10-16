import { createBrowserRouter, Navigate } from 'react-router';

import { RootLayout } from './components/RootLayout/RootLayout';
import { ROUTES } from './constants';
import { GenerateApiKey } from './pages/GenerateApiKey';
import { HigherRequestLimit } from './pages/HigherRequestLimit';
import { ShowApiKey } from './pages/ShowApiKey';
import { SubmitSuccess } from './pages/SubmitSuccess';

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        { path: ROUTES.generateApiKey, element: <GenerateApiKey /> },
        { path: ROUTES.showApiKey, element: <ShowApiKey /> },
        { path: ROUTES.higherRequestLimit, element: <HigherRequestLimit /> },
        { path: ROUTES.submitSuccess, element: <SubmitSuccess /> },
        {
          path: '*',
          element: <Navigate to={ROUTES.generateApiKey} replace />,
        },
      ],
    },
  ],
  { basename: new URL(document.baseURI).pathname },
);
