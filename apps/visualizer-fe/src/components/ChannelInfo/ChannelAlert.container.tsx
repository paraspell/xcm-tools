import { useQuery } from '@apollo/client';
import type { FC } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { channelQueryDocument } from '../../api/channels';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelsQuery } from '../../gql/graphql';
import ChannelAlert from './ChannelAlert';

type Props = {
  selectedChannel: ChannelsQuery['channels'][number];
};

const ChannelAlertContainer: FC<Props> = ({ selectedChannel }) => {
  const { t } = useTranslation();
  const { setSelectedChannel, channelAlertOpen, setChannelAlertOpen } = useSelectedParachain();

  const channelFromQuery = useQuery(channelQueryDocument, {
    variables: {
      ecosystem: selectedChannel.ecosystem.toLowerCase(),
      sender: selectedChannel.sender,
      recipient: selectedChannel.recipient
    }
  });

  const channelToQuery = useQuery(channelQueryDocument, {
    variables: {
      ecosystem: selectedChannel.ecosystem.toLowerCase(),
      sender: selectedChannel.recipient,
      recipient: selectedChannel.sender
    }
  });

  const onClose = () => {
    setSelectedChannel(undefined);
    setChannelAlertOpen(false);
  };

  useEffect(() => {
    setChannelAlertOpen(true);
  }, [selectedChannel]);

  if (channelFromQuery.error || channelToQuery.error) {
    return (
      <div>
        {t('error')}: {channelFromQuery.error?.message ?? channelToQuery.error?.message}
      </div>
    );
  }

  const loading = channelFromQuery.loading || channelToQuery.loading;

  return channelAlertOpen ? (
    <ChannelAlert
      loading={loading}
      channelFrom={channelFromQuery.data?.channel}
      channelTo={channelToQuery.data?.channel}
      onClose={onClose}
    />
  ) : null;
};

export default ChannelAlertContainer;
