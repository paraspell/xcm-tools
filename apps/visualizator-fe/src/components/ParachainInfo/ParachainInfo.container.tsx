import { allChannelsQueryDocument } from '../../api/channels';
import ParachainInfo from './ParachainInfo';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';

const ParachainInfoContainer = () => {
  const { data, error, loading } = useQuery(allChannelsQueryDocument);
  const { channelId } = useSelectedParachain();

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  const channel = data?.channels.find(channel => channel.id === channelId);
  return <ParachainInfo channelsCount={0} channel={channel} />;
};

export default ParachainInfoContainer;
