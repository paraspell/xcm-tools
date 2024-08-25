import { channelQueryDocument } from '../../api/channels';
import ChannelAlert from './ChannelAlert';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const ChannelAlertContainer = () => {
  const { t } = useTranslation();
  const { selectedChannel, setSelectedChannel, channelAlertOpen, setChannelAlertOpen } =
    useSelectedParachain();

  const channelFromQuery = useQuery(channelQueryDocument, {
    variables: {
      sender: selectedChannel?.sender ?? 0,
      recipient: selectedChannel?.recipient ?? 0
    }
  });

  const channelToQuery = useQuery(channelQueryDocument, {
    variables: {
      sender: selectedChannel?.recipient ?? 0,
      recipient: selectedChannel?.sender ?? 0
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

  return selectedChannel && channelAlertOpen ? (
    <ChannelAlert
      loading={loading}
      channelFrom={channelFromQuery.data?.channel}
      channelTo={channelToQuery.data?.channel}
      onClose={onClose}
    />
  ) : null;
};

export default ChannelAlertContainer;
