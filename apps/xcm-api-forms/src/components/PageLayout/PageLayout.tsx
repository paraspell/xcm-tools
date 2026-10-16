import { Paper, Stack, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import classes from './PageLayout.module.css';

type Props = {
  documentTitle: string;
  tagline: string;
  title: string;
  description: string;
  children: ReactNode;
  note?: ReactNode;
};

export const PageLayout: FC<Props> = ({
  documentTitle,
  tagline,
  title,
  description,
  children,
  note,
}) => (
  <>
    <title>{`${documentTitle} | XCM API ⚡️`}</title>
    <Stack align="center" gap={0} ta="center">
      <Text span variant="script" className={classes.tagline}>
        {tagline}
      </Text>
      <Title order={1}>{title}</Title>
      <Text className={classes.description}>{description}</Text>
    </Stack>
    <div className={classes.cardWrap}>
      <span aria-hidden className={classes.wizard}>
        🧙‍♂️
      </span>
      <Paper p="xl" className={classes.card}>
        {children}
      </Paper>
    </div>
    {note}
  </>
);
