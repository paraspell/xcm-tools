import { Box, Group, Text } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC } from 'react';
import { ChannelsQuery } from '../../gql/graphql';

type Props = {
  channelsCount?: number;
  channel?: ChannelsQuery['channels'][number];
};

const ParachainInfo: FC<Props> = ({ channelsCount, channel }) => {
  const { channelId } = useSelectedParachain();
  return (
    <Box pl="xl" pr="xl" pb="xl">
      <Group align="center" gap="xs">
        <Text size="lg">Open channels:</Text>
        <Text fw="bold" size="lg">
          {channelsCount ?? 'Cannot be calculated'}
        </Text>
      </Group>
      {channelId && channel && (
        <>
          <Group align="center" gap="xs">
            <Text size="lg">Selected channelId:</Text>
            <Text fw="bold" size="lg">
              {channelId ?? 'Cannot be calculated'}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="lg">Message count:</Text>
            <Text fw="bold" size="lg">
              {channel.message_count ?? 'Cannot be calculated'}
            </Text>
          </Group>
        </>
      )}
    </Box>
  );
};

export default ParachainInfo;
