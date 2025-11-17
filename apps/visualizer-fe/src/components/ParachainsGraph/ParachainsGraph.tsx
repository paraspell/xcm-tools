import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import type { ThreeEvent } from '@react-three/fiber';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Object3D } from 'three';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelsQuery, TotalMessageCountsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
import { getChainsByEcosystem, getParachainById, getParachainId } from '../../utils/utils';
import LineBetween from '../LineBetween/LineBetween';
import ParachainNode from '../Parachain/Parachain';
import Relaychain from '../Relaychain/Relaychain';

const calculateLineWidth = (messageCount: number): number => {
  const baseLineWidth = 0.035;
  const scalingFactor = 0.0000015;
  return baseLineWidth + messageCount * scalingFactor;
};

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  ecosystem: TRelaychain;
};

const ParachainsGraph: FC<Props> = ({ channels, totalMessageCounts, ecosystem }) => {
  const {
    selectedParachains,
    toggleParachain,
    selectedChannel,
    setSelectedChannel,
    setChannelAlertOpen,
    parachainArrangement,
    toggleActiveEditParachain
  } = useSelectedParachain();

  const [refsInitialized, setRefsInitialized] = useState(false);

  const groupRef = useRef<Group>(null);

  const sortedParachainNames = useMemo(() => {
    const nameToCountMap = totalMessageCounts.reduce<Record<number, number>>((acc, item) => {
      acc[item.paraId] = item.totalCount;
      return acc;
    }, {});

    return getChainsByEcosystem(ecosystem)
      .slice()
      .sort((a, b) => {
        const countA = nameToCountMap[getParachainId(a)] || 0;
        const countB = nameToCountMap[getParachainId(b)] || 0;
        return countB - countA;
      });
  }, [totalMessageCounts, ecosystem]);

  const handleParachainClick = (chain: TSubstrateChain) => {
    toggleParachain(chain);
  };

  const onRightClick = (chain: TSubstrateChain) => {
    if (ecosystem) {
      toggleActiveEditParachain(chain);
    }
  };

  const onRelaychainClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    toggleParachain(ecosystem);
  };

  const calculateParachainScale = (parachain: TSubstrateChain): number => {
    const baseLineWidth = 1.5;
    const scalingFactor = parachainArrangement === CountOption.BOTH ? 0.000004 : 0.000009;
    return (
      baseLineWidth +
      (totalMessageCounts.find(item => getParachainId(parachain) === item.paraId)?.totalCount ??
        0) *
        scalingFactor
    );
  };

  const onChannelClick =
    (channel: ChannelsQuery['channels'][number]) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();

      setChannelAlertOpen(true);
      setSelectedChannel(channel);
    };

  const selectedParachainChannels = channels.filter(channel => {
    return selectedParachains.some(
      p =>
        p === getParachainById(channel.sender, ecosystem) ||
        p === getParachainById(channel.recipient, ecosystem)
    );
  });
  const RELAYCHAIN_ID = 0;

  const parachainRefs = useRef<{ [key: string]: Object3D | null }>({});

  const relaychainRef = useRef<Group | null>(null);

  useEffect(() => {
    const relaychainReady = relaychainRef.current !== null;

    const allParachainsReady = Object.values(parachainRefs.current).every(ref => ref !== null);

    if (relaychainReady && allParachainsReady) {
      setRefsInitialized(true);
    }
  }, [parachainRefs, relaychainRef]);

  return (
    <group name={ecosystem} ref={groupRef}>
      <Relaychain
        onClick={onRelaychainClick}
        ecosystem={ecosystem}
        isSelected={selectedParachains.includes(ecosystem)}
        ref={relaychainRef}
      />
      {sortedParachainNames?.map((chain, index) => {
        return (
          <ParachainNode
            key={chain}
            name={chain}
            index={index}
            onClick={handleParachainClick}
            onRightClick={onRightClick}
            isSelected={selectedParachains.includes(chain)}
            scale={calculateParachainScale(chain)}
            ecosystem={ecosystem}
            ref={el => {
              parachainRefs.current[`${ecosystem};${chain}`] = el;
            }}
          />
        );
      })}

      {/* Channels */}
      {ecosystem &&
        refsInitialized &&
        channels.map(channel => {
          const senderKey =
            channel.sender === RELAYCHAIN_ID
              ? `${ecosystem};Relaychain`
              : `${ecosystem};${getParachainById(channel.sender, ecosystem)}`;
          const recipientKey =
            channel.recipient === RELAYCHAIN_ID
              ? `${ecosystem};Relaychain`
              : `${ecosystem};${getParachainById(channel.recipient, ecosystem)}`;

          const senderObject =
            channel.sender === RELAYCHAIN_ID
              ? relaychainRef.current
              : parachainRefs.current[senderKey];

          const recipientObject =
            channel.recipient === RELAYCHAIN_ID
              ? relaychainRef.current
              : parachainRefs.current[recipientKey];

          if (!senderObject || !recipientObject) {
            return null;
          }

          const lineWidth = calculateLineWidth(channel.message_count);
          const isHighlighted = selectedParachains.some(
            p =>
              p === getParachainById(channel.sender, ecosystem) ||
              p === getParachainById(channel.recipient, ecosystem)
          );

          const isSecondary = selectedParachainChannels.some(
            ch => ch.sender === channel.sender || ch.recipient === channel.recipient
          );

          const isSelected = selectedChannel?.id === channel.id;

          return (
            <LineBetween
              key={channel.id}
              startObject={senderObject}
              endObject={recipientObject}
              lineWidth={lineWidth}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              isSecondary={isSecondary}
              onClick={onChannelClick(channel)}
              ecosystem={ecosystem}
              fromParaId={channel.sender}
              toParaId={channel.recipient}
            />
          );
        })}
    </group>
  );
};

export default ParachainsGraph;
