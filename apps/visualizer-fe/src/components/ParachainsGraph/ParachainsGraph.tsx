import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import type { ThreeEvent } from '@react-three/fiber';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Object3D } from 'three';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelsQuery, TotalMessageCountsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
import {
  getChainsByEcosystem,
  getParachainById,
  getParachainEcosystem,
  getParachainId
} from '../../utils/utils';
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

  const paraIdToCountMap = useMemo(() => {
    return totalMessageCounts.reduce<Record<number, number>>((acc, item) => {
      acc[item.paraId] = item.totalCount;
      return acc;
    }, {});
  }, [totalMessageCounts]);

  const sortedParachainNames = useMemo(() => {
    return getChainsByEcosystem(ecosystem)
      .slice()
      .sort((a, b) => {
        const countA = paraIdToCountMap[getParachainId(a)] || 0;
        const countB = paraIdToCountMap[getParachainId(b)] || 0;
        return countB - countA;
      });
  }, [ecosystem, paraIdToCountMap]);

  const parachainScales = useMemo(() => {
    const baseLineWidth = 1.5;
    const scalingFactor = parachainArrangement === CountOption.BOTH ? 0.000004 : 0.000009;
    const scales: Record<string, number> = {};

    sortedParachainNames.forEach(chain => {
      const paraId = getParachainId(chain);
      const count = paraIdToCountMap[paraId] ?? 0;
      scales[chain] = baseLineWidth + count * scalingFactor;
    });

    return scales;
  }, [sortedParachainNames, paraIdToCountMap, parachainArrangement]);

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

  const onChannelClick =
    (channel: ChannelsQuery['channels'][number]) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();

      setChannelAlertOpen(true);
      setSelectedChannel(channel);
    };
  const RELAYCHAIN_ID = 0;

  const selectedParachainIds = useMemo(() => {
    const ids = new Set<number>();
    selectedParachains.forEach(p => {
      if (p === ecosystem) {
        ids.add(RELAYCHAIN_ID);
      } else {
        const chainEcosystem = getParachainEcosystem(p);
        if (chainEcosystem === ecosystem) {
          ids.add(getParachainId(p));
        }
      }
    });
    return ids;
  }, [selectedParachains, ecosystem]);

  const selectedChannelParaIds = useMemo(() => {
    const paraIds = new Set<number>();

    channels.forEach(channel => {
      if (selectedParachainIds.has(channel.sender) || selectedParachainIds.has(channel.recipient)) {
        paraIds.add(channel.sender);
        paraIds.add(channel.recipient);
      }
    });

    return paraIds;
  }, [channels, selectedParachainIds]);

  const parachainLookupCache = useMemo(() => {
    const cache = new Map<number, TSubstrateChain | null>();
    channels.forEach(channel => {
      if (channel.sender !== RELAYCHAIN_ID && !cache.has(channel.sender)) {
        cache.set(channel.sender, getParachainById(channel.sender, ecosystem));
      }
      if (channel.recipient !== RELAYCHAIN_ID && !cache.has(channel.recipient)) {
        cache.set(channel.recipient, getParachainById(channel.recipient, ecosystem));
      }
    });
    return cache;
  }, [channels, ecosystem]);

  const selectedParachainsSet = useMemo(() => {
    const filtered = selectedParachains.filter(p => {
      if (p === ecosystem) return true;
      return getParachainEcosystem(p) === ecosystem;
    });
    return new Set(filtered);
  }, [selectedParachains, ecosystem]);

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
        isSelected={selectedParachainsSet.has(ecosystem)}
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
            isSelected={selectedParachainsSet.has(chain)}
            scale={parachainScales[chain]}
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
          const senderChainName =
            channel.sender === RELAYCHAIN_ID
              ? 'Relaychain'
              : parachainLookupCache.has(channel.sender)
                ? parachainLookupCache.get(channel.sender)
                : getParachainById(channel.sender, ecosystem);
          const senderKey = `${ecosystem};${senderChainName}`;

          const recipientChainName =
            channel.recipient === RELAYCHAIN_ID
              ? 'Relaychain'
              : parachainLookupCache.has(channel.recipient)
                ? parachainLookupCache.get(channel.recipient)
                : getParachainById(channel.recipient, ecosystem);
          const recipientKey = `${ecosystem};${recipientChainName}`;

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
          const isHighlighted =
            selectedParachainIds.has(channel.sender) || selectedParachainIds.has(channel.recipient);

          const isSecondary =
            selectedChannelParaIds.has(channel.sender) ||
            selectedChannelParaIds.has(channel.recipient);

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
