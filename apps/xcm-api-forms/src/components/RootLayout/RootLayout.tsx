import { Box } from '@mantine/core';
import { GlowBackdrop } from '@paraspell/ui';
import { Outlet, ScrollRestoration } from 'react-router';

import { Header } from '../Header/Header';
import classes from './RootLayout.module.css';

export const RootLayout = () => (
  <div className={classes.page}>
    <GlowBackdrop />
    <Header />
    <Box component="main" className={classes.main}>
      <Outlet />
    </Box>
    <ScrollRestoration />
  </div>
);
