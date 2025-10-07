import { Box, Group, Text } from '@mantine/core';
import type { FC } from 'react';

import type { LiveXcmMsg } from '../../../../types';

export const formatTime = (ts: number) => {
  if (ts === 0) return '...';
  const ms = ts < 1e12 ? ts * 1000 : ts;
  return new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date(ms));
};

type LabelProps = {
  text: string;
};

const Label: FC<LabelProps> = ({ text }) => (
  <Text fw={600} size="xs" c="dimmed" lh={1} ta="center">
    {text}
  </Text>
);

type Props = {
  message: LiveXcmMsg;
};

export const MessageFlowHeader: FC<Props> = ({ message }) => (
  <Group gap="sm" justify="center" align="center" wrap="nowrap">
    <Box flex={1}>
      <Label text={formatTime(message.originTimestamp)} />
    </Box>

    <Box flex={3} ta="center">
      <Label text={message.ecosystem} />
    </Box>

    <Box flex={1}>
      <Label text={formatTime(message.confirmTimestamp)} />
    </Box>
  </Group>
);
