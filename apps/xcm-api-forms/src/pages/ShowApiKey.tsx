import { Badge, Button, CopyButton, Divider, Group, Text } from '@mantine/core';
import { IconBolt, IconCheck, IconCopy } from '@tabler/icons-react';
import { Navigate } from 'react-router';

import { HigherLimitNote } from '../components/HigherLimitNote/HigherLimitNote';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { ROUTES } from '../constants';
import { useLocationApiKey } from '../hooks/useLocationApiKey';
import classes from './ShowApiKey.module.css';

export const ShowApiKey = () => {
  const apiKey = useLocationApiKey();

  if (!apiKey) return <Navigate to={ROUTES.generateApiKey} replace />;

  return (
    <PageLayout
      documentTitle="Your API Key"
      tagline="freshly conjured"
      title="Your API key is ready"
      description="Copy it now and keep it somewhere safe — once you close this tab, it can't be shown again."
      note={<HigherLimitNote apiKey={apiKey} />}
    >
      <Group justify="space-between" gap="sm">
        <Text variant="eyebrow">Your API key</Text>
        <Badge variant="ok" leftSection={<IconBolt size={14} />}>
          100 requests / min
        </Badge>
      </Group>
      <Text mt={10} className={classes.key}>
        {apiKey}
      </Text>
      <CopyButton value={apiKey} timeout={1800}>
        {({ copied, copy }) => (
          <Button
            fullWidth
            size="lg"
            fz="md"
            fw={700}
            mt="md"
            onClick={copy}
            leftSection={
              copied ? <IconCheck size={18} /> : <IconCopy size={18} />
            }
          >
            {copied ? 'Copied to clipboard' : 'Copy API key'}
          </Button>
        )}
      </CopyButton>
      <Divider my={24} color="var(--ps-line)" />
      <Text fz="sm" fw={600}>
        Using your key
      </Text>
      <Text fz={13} lh={1.55} c="dimmed" mt={2}>
        Send it as a header with every request.
      </Text>
      <Group gap={10} wrap="nowrap" mt="sm" className={classes.header}>
        <Badge variant="get">Header</Badge>
        <Text span truncate className={classes.headerValue}>
          <span className={classes.headerName}>X-API-KEY:</span> {apiKey}
        </Text>
      </Group>
    </PageLayout>
  );
};
