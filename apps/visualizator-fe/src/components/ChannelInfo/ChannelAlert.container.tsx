import { channelQueryDocument } from '../../api/channels';
import ChannelAlert from './ChannelAlert';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ChannelsQuery } from '../../gql/graphql';

type Props = {
  selectedChannel: ChannelsQuery['channels'][number];
};

const ChannelAlertContainer: FC<Props> = ({ selectedChannel }) => {
  const { t } = useTranslation();
  const { setSelectedChannel, channelAlertOpen, setChannelAlertOpen } = useSelectedParachain();

  const channelFromQuery = useQuery(channelQueryDocument, {
    variables: {
      sender: selectedChannel.sender,
      recipient: selectedChannel.recipient
    }
  });

  const channelToQuery = useQuery(channelQueryDocument, {
    variables: {
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
