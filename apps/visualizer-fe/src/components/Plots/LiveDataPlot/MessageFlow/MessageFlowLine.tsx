import { Box, Center, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight, IconCheck, IconCircleFilled, IconClock, IconX } from '@tabler/icons-react';
import type { FC } from 'react';

import type { LiveXcmMsg } from '../../../../types';
import { getChainDisplayName } from '../../../../utils';
import { getParachainById } from '../../../../utils/utils';

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return { color: 'green.6', CenterIcon: IconCheck };
    case 'relayed':
      return { color: 'blue.6', CenterIcon: IconClock };
    case 'pending':
    case 'processing':
      return { color: 'yellow.6', CenterIcon: IconClock };
    case 'error':
    case 'failed':
      return { color: 'red.6', CenterIcon: IconX };
    default:
      return { color: 'gray.6', CenterIcon: IconCircleFilled };
  }
};

type Props = {
  message: LiveXcmMsg;
};

export const MessageFlowLine: FC<Props> = ({ message }) => {
  const getParachainName = (id: number) =>
    getChainDisplayName(getParachainById(id, message.ecosystem)!);

  const { color, CenterIcon } = getStatusStyle(message.status);

  return (
    <Group w="100%" gap="lg" justify="center" align="center" wrap="nowrap" maw="100%">
      <Box flex={1}>
        <Text fw={600} c="dark" size="sm" lh={1} ta="center">
          {getParachainName(message.from)}
        </Text>
      </Box>

      <Box flex={3} pos="relative">
        <Box
          pos="absolute"
          top="50%"
          left={0}
          right={0}
          h={2}
          bg={color}
          style={{
            transform: 'translateY(-50%)'
          }}
        />
        <Center
          pos="absolute"
          top="50%"
          left="50%"
          bdrs="50%"
          style={{
            transform: 'translate(-50%, -50%)'
          }}
        >
          <ThemeIcon
            variant="outline"
            radius="xl"
            size="sm"
            bg="white"
            color={color}
            style={{ borderWidth: 2 }}
          >
            <CenterIcon style={{ width: '70%', height: '70%' }} />
          </ThemeIcon>
        </Center>
        <ThemeIcon
          variant="transparent"
          size="xs"
          color={color}
          pos="absolute"
          top="50%"
          right={-5}
          style={{
            transform: 'translateY(-50%)'
          }}
        >
          <IconArrowRight />
        </ThemeIcon>
      </Box>

      <Box flex={1}>
        <Text fw={600} c="dark" size="sm" lh={1} ta="center">
          {getParachainName(message.to)}
        </Text>
      </Box>
    </Group>
  );
};
