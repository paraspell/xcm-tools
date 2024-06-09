import { Alert, Box, Group, Stack, Text } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { ChannelsQuery } from '../../gql/graphql';
import { FC } from 'react';

type Props = {
  channel?: ChannelsQuery['channels'][number];
  onClose?: () => void;
};

const ChannelInfo: FC<Props> = ({ channel, onClose }) => {
  const { channelId } = useSelectedParachain();
  return (
    <Box pos="absolute" top={0} left={0} p="xl">
      <Alert
        title="Channel info"
        withCloseButton
        onClose={onClose}
        w="100%"
        p="md"
        pt="sm"
        pb="sm"
        radius="md"
        bg="rgba(255,255,255,0.8)"
      >
        <Stack>
          <Group align="center" gap="xs">
            <Text size="lg">Selected channelId:</Text>
            <Text fw="bold" size="lg">
              {channelId}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="lg">Message count:</Text>
            <Text fw="bold" size="lg">
              {channel?.message_count}
            </Text>
          </Group>
        </Stack>
      </Alert>
    </Box>
  );
};

export default ChannelInfo;
