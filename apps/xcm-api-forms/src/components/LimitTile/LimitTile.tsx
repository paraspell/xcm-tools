import { Box, Group, Text } from '@mantine/core';
import type { FC } from 'react';

import classes from './LimitTile.module.css';

type Props = {
  label: string;
  limit: number;
  withKey?: boolean;
};

export const LimitTile: FC<Props> = ({ label, limit, withKey }) => (
  <Box className={classes.tile} mod={{ 'with-key': withKey }}>
    <Text className={classes.label}>{label}</Text>
    <Group gap={4} align="baseline" mt={2}>
      <Text span className={classes.value}>
        {limit}
      </Text>
      <Text span className={classes.unit}>
        / min
      </Text>
      {withKey && <span className={classes.bolt}>⚡️</span>}
    </Group>
  </Box>
);
