import {
  Badge,
  Button,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconArrowUpRight, IconCheck } from '@tabler/icons-react';

import { PageLayout } from '../components/PageLayout/PageLayout';
import { DOCS_URL } from '../constants';
import classes from './SubmitSuccess.module.css';

const STEPS = [
  {
    title: 'We review your use case',
    description:
      'Each request is checked by hand to keep the API fair and fast for everyone.',
  },
  {
    title: "You'll get an email",
    description:
      "We'll write to the address you provided once the review is complete.",
  },
  {
    title: 'Same key, new limit',
    description:
      'If approved, the higher limit applies to your existing API key — no need to generate a new one.',
  },
];

export const SubmitSuccess = () => (
  <PageLayout
    documentTitle="Request Submitted"
    tagline="sit tight"
    title="Request submitted"
    description="Thanks for telling us about your project. We'll review your request and get back to you by email."
  >
    <Group justify="space-between" gap="sm">
      <Text variant="eyebrow">What happens next</Text>
      <Badge variant="ok" leftSection={<IconCheck size={14} />}>
        Received
      </Badge>
    </Group>
    <List
      type="ordered"
      listStyleType="none"
      spacing={18}
      mt={20}
      classNames={{ itemWrapper: classes.step }}
    >
      {STEPS.map(({ title, description }, index) => (
        <List.Item
          key={title}
          icon={
            <ThemeIcon variant="light" size={26} radius="xl" fz={13} fw={800}>
              {index + 1}
            </ThemeIcon>
          }
        >
          <Stack gap={2} pt={2}>
            <Text fz={15} fw={700}>
              {title}
            </Text>
            <Text fz="sm" lh={1.55} c="dimmed">
              {description}
            </Text>
          </Stack>
        </List.Item>
      ))}
    </List>
    <Button
      component="a"
      href={DOCS_URL}
      target="_blank"
      rel="noopener"
      variant="default"
      fullWidth
      h={46}
      mt={28}
      fz={15}
      fw={700}
      rightSection={<IconArrowUpRight size={16} />}
    >
      Back to XCM API docs
    </Button>
  </PageLayout>
);
