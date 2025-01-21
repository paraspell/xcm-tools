import type { FC } from 'react';
import { Badge } from '@mantine/core';

type Props = {
  version: string;
};

export const VersionBadge: FC<Props> = ({ version }) => (
  <Badge variant="light" radius="xl" mb="md" style={{ textTransform: 'unset' }}>
    v{version}
  </Badge>
);
