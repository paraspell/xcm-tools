/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, Fragment, useMemo } from 'react';
import { ChannelQuery, ChannelsQuery, TotalMessageCountsQuery } from '../../gql/graphql';
import Relaychain from '../Relaychain';
import Parachain from '../Parachain/Parachain';
import { getParachainPosition } from './utils';
import LineBetween from '../LineBetween';
import { Vector3 } from 'three';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getParachainId } from '../../utils/utils';
import { POLKADOT_NODE_NAMES } from '../../consts';

const relayChainPosition = new Vector3(0, 0, 0);

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  selectedChannel?: ChannelQuery['channel'];
};

const ParachainsGraph: FC<Props> = ({ channels, totalMessageCounts, selectedChannel }) => {
  const { parachains, toggleParachain, setChannelId, setChannelAlertOpen } = useSelectedParachain();

  const sortedParachainNames = useMemo(() => {
    const nameToCountMap = totalMessageCounts.reduce((acc: any, item) => {
      acc[item.paraId] = item.totalCount;
      return acc;
    }, {});

    return POLKADOT_NODE_NAMES?.slice().sort((a, b) => {
      const countA = nameToCountMap[getParachainId(a)] || 0;
      const countB = nameToCountMap[getParachainId(b)] || 0;
      return countB - countA;
    });
  }, [totalMessageCounts]);

  const parachainPositions = useMemo(
    () => sortedParachainNames!.map((_, index) => getParachainPosition(index)),
    [sortedParachainNames]
  );

  const handleParachainClick = (node: string) => {
    toggleParachain(node);
  };

  const onRelaychainClick = () => {
    toggleParachain('Polkadot');
  };

  const calculateLineWidth = (messageCount: number): number => {
    const baseLineWidth = 0.02;
    const scalingFactor = 0.00001;
    return baseLineWidth + messageCount * scalingFactor;
  };

  const calculateParachainScale = (parachain: string): number => {
    const baseLineWidth = 1;
    const scalingFactor = 0.00003;
    return (
      baseLineWidth +
      (totalMessageCounts.find(item => getParachainId(parachain) === item.paraId)?.totalCount ??
        0) *
        scalingFactor
    );
  };

  const onChannelClick = (channelId: number) => () => {
    setChannelAlertOpen(true);
    setChannelId(channelId);
  };

  const selectedParachainChannels = channels.filter(channel =>
    parachains.some(
      p => getParachainId(p) === channel.sender || getParachainId(p) === channel.recipient
    )
  );

  const channelElements = channels.map(channel => {
    const senderIndex = sortedParachainNames!.findIndex(
      name => getParachainId(name) === channel.sender
    );
    const recipientIndex = sortedParachainNames!.findIndex(
      name => getParachainId(name) === channel.recipient
    );
    const senderPosition = parachainPositions[senderIndex];
    const recipientPosition = parachainPositions[recipientIndex];
    const lineWidth = calculateLineWidth(channel.message_count);
    const isSelectedChannel =
      parachains.some(p => getParachainId(p) === channel.sender) ||
      parachains.some(p => getParachainId(p) === channel.recipient);

    const isSecondary = selectedParachainChannels.some(
      ch => ch.sender === channel.sender || ch.recipient === channel.recipient
    );

    const channelSelected2 =
      selectedChannel &&
      selectedChannel.sender === channel.sender &&
      selectedChannel.recipient === channel.recipient;

    return (
      <LineBetween
        key={channel.id}
        startPosition={senderPosition}
        endPosition={recipientPosition}
        lineWidth={lineWidth}
        isHighlighed={isSelectedChannel}
        isSelected={channelSelected2 ?? false}
        isSecondary={isSecondary}
        onClick={onChannelClick(channel.id)}
      />
    );
  });

  return (
    <>
      <Relaychain onClick={onRelaychainClick} isSelected={parachains.includes('Polkadot')} />
      {sortedParachainNames?.map((node, index) => (
        <Fragment key={node}>
          <Parachain
            name={node}
            index={index}
            onClick={handleParachainClick}
            isSelected={parachains.includes(node)}
            scale={calculateParachainScale(node)}
          />
          <LineBetween
            startPosition={relayChainPosition}
            endPosition={parachainPositions[index]}
            lineWidth={0.05}
            isHighlighed={parachains.includes('Polkadot')}
            isSelected={false}
            isSecondary={false}
            onClick={() => {}}
          />
        </Fragment>
      ))}
      {channelElements}
    </>
  );
};

export default ParachainsGraph;
