import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChannelsQuery, CountOption, TotalMessageCountsQuery } from '../../gql/graphql';
import Relaychain from '../Relaychain/Relaychain';
import Parachain from '../Parachain/Parachain';
import LineBetween from '../LineBetween';
import { Group, Vector3 } from 'three';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getNodesByEcosystem, getParachainById, getParachainId } from '../../utils/utils';
import { Ecosystem } from '../../types/types';
import { ThreeEvent, useThree } from '@react-three/fiber';

const calculateLineWidth = (messageCount: number): number => {
  const baseLineWidth = 0.035;
  const scalingFactor = 0.0000015;
  return baseLineWidth + messageCount * scalingFactor;
};

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  ecosystem: Ecosystem;
  startTime: Date | null;
  endTime: Date | null;
  updateTrigger?: number;
};

const ParachainsGraph: FC<Props> = ({
  channels,
  totalMessageCounts,
  ecosystem,
  startTime,
  endTime,
  updateTrigger
}) => {
  const {
    parachains,
    toggleParachain,
    selectedChannel,
    setSelectedChannel,
    setChannelAlertOpen,
    parachainArrangement,
    toggleActiveEditParachain
  } = useSelectedParachain();

  const groupRef = useRef<Group>(null);
  const { scene } = useThree();

  const sortedParachainNames = useMemo(() => {
    const nameToCountMap = totalMessageCounts.reduce<Record<number, number>>((acc, item) => {
      acc[item.paraId] = item.totalCount;
      return acc;
    }, {});

    return getNodesByEcosystem(ecosystem)
      .slice()
      .sort((a, b) => {
        const countA = nameToCountMap[getParachainId(a, ecosystem)] || 0;
        const countB = nameToCountMap[getParachainId(b, ecosystem)] || 0;
        return countB - countA;
      });
  }, [totalMessageCounts, ecosystem]);

  const handleParachainClick = (node: string) => {
    if (ecosystem === Ecosystem.POLKADOT) toggleParachain(node);
  };

  const onRightClick = (node: string) => {
    if (ecosystem === Ecosystem.POLKADOT) {
      toggleActiveEditParachain(`${ecosystem};${node}`);
    }
  };

  const onRelaychainClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    toggleParachain(ecosystem === Ecosystem.POLKADOT ? 'Polkadot' : 'Kusama');
  };

  const calculateParachainScale = (parachain: string): number => {
    const baseLineWidth = 1.3;
    const scalingFactor = parachainArrangement === CountOption.BOTH ? 0.000015 : 0.000024;
    return (
      baseLineWidth +
      (totalMessageCounts.find(item => getParachainId(parachain, ecosystem) === item.paraId)
        ?.totalCount ?? 0) *
        scalingFactor
    );
  };

  const onChannelClick =
    (channel: ChannelsQuery['channels'][number]) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (ecosystem === Ecosystem.POLKADOT) {
        setChannelAlertOpen(true);
        setSelectedChannel(channel);
      }
    };

  const selectedParachainChannels =
    ecosystem === Ecosystem.POLKADOT
      ? channels.filter(channel =>
          parachains.some(
            p =>
              getParachainId(p, ecosystem) === channel.sender ||
              getParachainId(p, ecosystem) === channel.recipient
          )
        )
      : [];

  const relaychainPosition = new Vector3(0, 0, 0);
  const RELAYCHAIN_ID = 0;

  const [channelElements, setChannelElements] = useState<(JSX.Element | null)[] | null>(null);

  useLayoutEffect(() => {
    const channelElements =
      ecosystem === Ecosystem.POLKADOT
        ? channels.map(channel => {
            const senderObject = scene.getObjectByName(
              `${ecosystem};${getParachainById(channel.sender, ecosystem)}`
            );

            const recipientName = scene.getObjectByName(
              `${ecosystem};${getParachainById(channel.recipient, ecosystem)}`
            );

            const senderPosition =
              channel.sender === RELAYCHAIN_ID ? relaychainPosition : senderObject?.position;

            const recipientPosition =
              channel.recipient === RELAYCHAIN_ID ? relaychainPosition : recipientName?.position;

            if (!senderPosition || !recipientPosition) {
              return null;
            }

            const lineWidth = calculateLineWidth(channel.message_count);
            const isHighlighted =
              parachains.some(p => getParachainId(p, ecosystem) === channel.sender) ||
              parachains.some(p => getParachainId(p, ecosystem) === channel.recipient);

            const isSecondary = selectedParachainChannels.some(
              ch => ch.sender === channel.sender || ch.recipient === channel.recipient
            );

            const isSelected = selectedChannel?.id === channel.id;

            return (
              <LineBetween
                key={channel.id}
                startPosition={senderPosition}
                endPosition={recipientPosition}
                lineWidth={lineWidth}
                isHighlighed={isHighlighted}
                isSelected={isSelected}
                isSecondary={isSecondary}
                onClick={onChannelClick(channel)}
              />
            );
          })
        : null;
    setChannelElements(channelElements);
  }, [updateTrigger, channels, startTime, endTime, parachains, selectedChannel]);

  return (
    <group name={ecosystem} ref={groupRef}>
      <Relaychain
        onClick={onRelaychainClick}
        ecosystem={ecosystem}
        isSelected={parachains.includes('Polkadot')}
      />
      {sortedParachainNames?.map((node, index) => (
        <Parachain
          key={node}
          name={node}
          index={index}
          onClick={handleParachainClick}
          onRightClick={onRightClick}
          isSelected={parachains.includes(node)}
          scale={calculateParachainScale(node)}
          ecosystem={ecosystem}
        />
      ))}
      {ecosystem === Ecosystem.POLKADOT && channelElements}
    </group>
  );
};

export default ParachainsGraph;
