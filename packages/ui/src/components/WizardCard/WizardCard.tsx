import type { ElementProps, PaperProps } from '@mantine/core';
import { Box, extractStyleProps, Paper } from '@mantine/core';
import type { FC } from 'react';

import { Wizard } from '../Wizard/Wizard';
import classes from './WizardCard.module.css';

type Props = PaperProps &
  ElementProps<'div'> & {
    animated?: boolean;
  };

export const WizardCard: FC<Props> = ({ animated, ...props }) => {
  const { styleProps, rest } = extractStyleProps(props);
  return (
    <Box {...styleProps} className={classes.root}>
      <Wizard aria-hidden animated={animated} className={classes.wizard} />
      <Paper shadow="card" {...rest} classNames={{ root: classes.card }} />
    </Box>
  );
};
