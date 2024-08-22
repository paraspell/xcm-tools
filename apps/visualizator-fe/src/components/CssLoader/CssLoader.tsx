import { Box } from '@mantine/core';
import classes from './CssLoader.module.css';

export const CssLoader = () => <Box className={classes.loader} component="span" />;
