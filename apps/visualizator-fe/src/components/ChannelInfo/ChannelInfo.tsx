import { Alert, Box, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { ChannelsQuery } from '../../gql/graphql';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  loading?: boolean;
  channel?: ChannelsQuery['channels'][number];
  onClose?: () => void;
};

const ChannelInfo: FC<Props> = ({ loading, channel, onClose }) => {
  const { t } = useTranslation();
  const { channelId } = useSelectedParachain();
  return (
    <Box pos="absolute" top={0} left={0} p="xl">
      <Alert
        title={t('channelInfo')}
        withCloseButton
        onClose={onClose}
        w="100%"
        p="md"
        pt="sm"
        pb="sm"
        radius="md"
        bg="rgba(255,255,255,0.8)"
      >
        {loading && (
          <Center h="100%">
            <Loader size="xs" />
          </Center>
        )}
        <Stack>
          <Group align="center" gap="xs">
            <Text size="lg">{t('selectedChannelId')}:</Text>
            <Text fw="bold" size="lg">
              {channelId}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="lg">{t('messageCount')}:</Text>
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
