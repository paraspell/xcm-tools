import type { GroupProps } from '@mantine/core';
import { Group, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import classes from './RequestBar.module.css';

type Props = GroupProps & {
  badge: ReactNode;
  rightSection?: ReactNode;
  truncate?: boolean;
};

export const RequestBar: FC<Props> = ({
  badge,
  rightSection,
  truncate,
  children,
  ...props
}) => (
  <Group gap="xs" wrap="nowrap" {...props} classNames={{ root: classes.root }}>
    {badge}
    <Text span truncate={truncate} className={classes.value}>
      {children}
    </Text>
    {rightSection}
  </Group>
);

export const RequestBarHighlight: FC<{ children: ReactNode }> = ({
  children,
}) => <span className={classes.highlight}>{children}</span>;
