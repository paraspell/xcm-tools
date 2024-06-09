import { channelQueryDocument } from '../../api/channels';
import { useGraphQL } from '../../hooks/useGraphQL';
import ChannelInfo from './ChannelInfo';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useEffect } from 'react';

const ChannelInfoContainer = () => {
  const { channelId, channelAlertOpen, setChannelAlertOpen } = useSelectedParachain();

  const { data, error } = useGraphQL(channelQueryDocument, {
    id: channelId ?? 1
  });

  const onClose = () => {
    setChannelAlertOpen(false);
  };

  useEffect(() => {
    setChannelAlertOpen(true);
  }, [channelId]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return channelId && channelAlertOpen ? (
    <ChannelInfo channel={data?.channel} onClose={onClose} />
  ) : null;
};

export default ChannelInfoContainer;
