import { Stack, Text, Title } from '@mantine/core';
import { WizardCard } from '@paraspell/ui';
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
    <Stack align="center" gap={0} ta="center" mb={24}>
      <Text span variant="tagline" className={classes.tagline}>
        {tagline}
      </Text>
      <Title order={1}>{title}</Title>
      <Text className={classes.description}>{description}</Text>
    </Stack>
    <WizardCard animated={false} className={classes.card}>
      {children}
    </WizardCard>
    {note}
  </>
);
