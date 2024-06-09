import { useGraphQL } from '../../hooks/useGraphQL';
import { allChannelsQueryDocument } from '../../api/channels';
import ParachainInfo from './ParachainInfo';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';

const ParachainInfoContainer = () => {
  const { data, error, isLoading } = useGraphQL(allChannelsQueryDocument);
  const { channelId } = useSelectedParachain();

  if (isLoading) {
    return null;
  }

  if (error) {
    return null;
  }

  // const channelsCount = data?.channels.filter(
  //   channel =>
  //     channel.sender === getParachainId(parachains) ||
  //     channel.recipient === getParachainId(parachains)
  // ).length;
  const channel = data?.channels.find(channel => channel.id === channelId);
  return <ParachainInfo channelsCount={0} channel={channel} />;
};

export default ParachainInfoContainer;
