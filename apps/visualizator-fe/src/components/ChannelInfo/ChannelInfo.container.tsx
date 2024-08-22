import { channelQueryDocument } from '../../api/channels';
import ChannelInfo from './ChannelInfo';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const ChannelInfoContainer = () => {
  const { t } = useTranslation();
  const { channelId, channelAlertOpen, setChannelAlertOpen } = useSelectedParachain();

  const { data, loading, error } = useQuery(channelQueryDocument, {
    variables: {
      id: channelId ?? 1
    }
  });

  const onClose = () => {
    setChannelAlertOpen(false);
  };

  useEffect(() => {
    setChannelAlertOpen(true);
  }, [channelId]);

  if (error) {
    return (
      <div>
        {t('error')}: {error.message}
      </div>
    );
  }

  return channelId && channelAlertOpen ? (
    <ChannelInfo loading={loading} channel={data?.channel} onClose={onClose} />
  ) : null;
};

export default ChannelInfoContainer;
