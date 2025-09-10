import type { ThreeEvent } from '@react-three/fiber';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Object3D } from 'three';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelsQuery, TotalMessageCountsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
import { Ecosystem } from '../../types/types';
import { getChainsByEcosystem, getParachainById, getParachainId } from '../../utils/utils';
import LineBetween from '../LineBetween';
import Parachain from '../Parachain/Parachain';
import Relaychain from '../Relaychain/Relaychain';

const calculateLineWidth = (messageCount: number): number => {
  const baseLineWidth = 0.035;
  const scalingFactor = 0.0000015;
  return baseLineWidth + messageCount * scalingFactor;
};

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  ecosystem: Ecosystem;
};

const ParachainsGraph: FC<Props> = ({ channels, totalMessageCounts, ecosystem }) => {
  const {
    parachains,
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
        const countA = nameToCountMap[getParachainId(a, ecosystem)] || 0;
        const countB = nameToCountMap[getParachainId(b, ecosystem)] || 0;
        return countB - countA;
      });
  }, [totalMessageCounts, ecosystem]);

  const handleParachainClick = (chain: string) => {
    if (ecosystem) toggleParachain(chain);
  };

  const onRightClick = (chain: string) => {
    if (ecosystem) {
      toggleActiveEditParachain(`${ecosystem};${chain}`);
    }
  };

  const onRelaychainClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (ecosystem == Ecosystem.POLKADOT) toggleParachain(ecosystem.toString()); // TODO: fix parachain selection
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
      if (ecosystem) {
        setChannelAlertOpen(true);
        setSelectedChannel(channel);
      }
    };

  const selectedParachainChannels = ecosystem
    ? channels.filter(channel =>
        parachains.some(
          p =>
            getParachainId(p, ecosystem) === channel.sender ||
            getParachainId(p, ecosystem) === channel.recipient
        )
      )
    : [];

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
        isSelected={parachains.includes('Polkadot')}
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
            isSelected={parachains.includes(chain)}
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
              startObject={senderObject}
              endObject={recipientObject}
              lineWidth={lineWidth}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              isSecondary={isSecondary}
              onClick={onChannelClick(channel)}
            />
          );
        })}
    </group>
  );
};

export default ParachainsGraph;
