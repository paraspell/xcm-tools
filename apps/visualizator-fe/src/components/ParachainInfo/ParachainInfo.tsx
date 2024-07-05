import { Box, Group, Text } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC } from 'react';
import { ChannelsQuery } from '../../gql/graphql';
import { useTranslation } from 'react-i18next';

type Props = {
  channelsCount?: number;
  channel?: ChannelsQuery['channels'][number];
};

const ParachainInfo: FC<Props> = ({ channelsCount, channel }) => {
  const { t } = useTranslation();
  const { channelId } = useSelectedParachain();
  return (
    <Box pl="xl" pr="xl" pb="xl">
      <Group align="center" gap="xs">
        <Text size="lg">{t('openChannels')}:</Text>
        <Text fw="bold" size="lg">
          {channelsCount ?? t('cannotBeCalculated')}
        </Text>
      </Group>
      {channelId && channel && (
        <>
          <Group align="center" gap="xs">
            <Text size="lg">{t('selectedChannelId')}:</Text>
            <Text fw="bold" size="lg">
              {channelId ?? t('cannotBeCalculated')}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="lg">{t('messageCount')}:</Text>
            <Text fw="bold" size="lg">
              {channel.message_count ?? t('cannotBeCalculated')}
            </Text>
          </Group>
        </>
      )}
    </Box>
  );
};

export default ParachainInfo;
