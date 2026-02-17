import { getParaId, type TRelaychain, type TSubstrateChain } from '@paraspell/sdk';
import type { ThreeEvent } from '@react-three/fiber';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Object3D } from 'three';

import { BASE_CHAIN_SCALE, RELAYCHAIN_ID } from '../../consts/consts';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelsQuery, TotalMessageCountsQuery } from '../../gql/graphql';
import {
  calculateChainScale,
  calculateChannelWidth,
  getChainKey,
  getChainsByEcosystem,
  getParachainById,
  getParachainEcosystem
} from '../../utils/utils';
import { LineBetween } from '../LineBetween/LineBetween';
import { pickLineColor } from '../LineBetween/LineBetween.utils';
import { Parachain } from '../Parachain/Parachain';
import { Relaychain } from '../Relaychain/Relaychain';

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  ecosystem: TRelaychain;
};

export const ParachainsGraph: FC<Props> = ({ channels, totalMessageCounts, ecosystem }) => {
  const {
    selectedParachains,
    toggleParachain,
    selectedChannel,
    setSelectedChannel,
    setChannelAlertOpen,
    parachainArrangement,
    toggleActiveEditParachain,
    primaryChannelColor,
    highlightedChannelColor,
    secondaryChannelColor,
    selectedChannelColor,
    activeEditParachain,
    animationEnabled
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
        const countA = paraIdToCountMap[getParaId(a)] || RELAYCHAIN_ID;
        const countB = paraIdToCountMap[getParaId(b)] || RELAYCHAIN_ID;
        return countB - countA;
      });
  }, [ecosystem, paraIdToCountMap]);

  const parachainScales = useMemo(() => {
    const scales: Partial<Record<TSubstrateChain, number>> = {};
    sortedParachainNames.forEach(chain => {
      const count = paraIdToCountMap[getParaId(chain)] ?? 0;
      scales[chain] = calculateChainScale(count, parachainArrangement);
    });

    return scales;
  }, [sortedParachainNames, paraIdToCountMap, parachainArrangement]);

  const handleParachainClick = useCallback(
    (chain: TSubstrateChain) => toggleParachain(chain),
    [toggleParachain]
  );

  const onRightClick = useCallback(
    (chain: TSubstrateChain) => {
      if (ecosystem) toggleActiveEditParachain(chain);
    },
    [ecosystem, toggleActiveEditParachain]
  );

  const onRelaychainClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      toggleParachain(ecosystem);
    },
    [ecosystem, toggleParachain]
  );

  const channelClickCache = useRef(new Map<number, (event: ThreeEvent<MouseEvent>) => void>());
  const getChannelClickHandler = useCallback(
    (channel: ChannelsQuery['channels'][number]) => {
      const cached = channelClickCache.current.get(channel.id);
      if (cached) return cached;
      const handler = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setChannelAlertOpen(true);
        setSelectedChannel(channel);
      };
      channelClickCache.current.set(channel.id, handler);
      return handler;
    },
    [setChannelAlertOpen, setSelectedChannel]
  );

  const refCallbackCache = useRef(new Map<string, (el: Object3D | null) => void>());
  const getRefCallback = useCallback((key: string) => {
    const cached = refCallbackCache.current.get(key);
    if (cached) return cached;
    const cb = (el: Object3D | null) => {
      parachainRefs.current[key] = el;
    };
    refCallbackCache.current.set(key, cb);
    return cb;
  }, []);

  const selectedParachainIds = useMemo(() => {
    const ids = new Set<number>();
    selectedParachains.forEach(p => {
      if (p === ecosystem) {
        ids.add(RELAYCHAIN_ID);
      } else {
        const chainEcosystem = getParachainEcosystem(p);
        if (chainEcosystem === ecosystem) {
          ids.add(getParaId(p));
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
          <Parachain
            key={chain}
            name={chain}
            index={index}
            onClick={handleParachainClick}
            onRightClick={onRightClick}
            isSelected={selectedParachainsSet.has(chain)}
            scale={parachainScales[chain] ?? BASE_CHAIN_SCALE}
            ecosystem={ecosystem}
            activeEditParachain={activeEditParachain}
            animationEnabled={animationEnabled}
            ref={getRefCallback(`${ecosystem};${chain}`)}
          />
        );
      })}

      {/* Channels */}
      {ecosystem &&
        refsInitialized &&
        channels.map(channel => {
          const senderKey = getChainKey(channel.sender, ecosystem, parachainLookupCache);
          const recipientKey = getChainKey(channel.recipient, ecosystem, parachainLookupCache);

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

          const lineWidth = calculateChannelWidth(channel.message_count);
          const isHighlighted =
            selectedParachainIds.has(channel.sender) || selectedParachainIds.has(channel.recipient);

          const isSecondary =
            selectedChannelParaIds.has(channel.sender) ||
            selectedChannelParaIds.has(channel.recipient);

          const isSelected = selectedChannel?.id === channel.id;

          const color = pickLineColor(isHighlighted, isSelected, isSecondary, {
            primary: primaryChannelColor,
            highlighted: highlightedChannelColor,
            secondary: secondaryChannelColor,
            selected: selectedChannelColor
          });

          return (
            <LineBetween
              key={channel.id}
              startObject={senderObject}
              endObject={recipientObject}
              lineWidth={lineWidth}
              color={color}
              onClick={getChannelClickHandler(channel)}
              ecosystem={ecosystem}
              fromParaId={channel.sender}
              toParaId={channel.recipient}
            />
          );
        })}
    </group>
  );
};
