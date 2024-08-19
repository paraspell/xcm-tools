/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, Fragment, useMemo, useRef } from 'react';
import {
  ChannelQuery,
  ChannelsQuery,
  CountOption,
  TotalMessageCountsQuery
} from '../../gql/graphql';
import Relaychain from '../Relaychain/Relaychain';
import Parachain from '../Parachain/Parachain';
import { getParachainPosition } from './utils';
import LineBetween from '../LineBetween';
import { Group, Vector3 } from 'three';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getNodesByEcosystem, getParachainId } from '../../utils/utils';
import { Ecosystem } from '../../types/types';
import { useThree } from '@react-three/fiber';

const calculateLineWidth = (messageCount: number): number => {
  const baseLineWidth = 0.02;
  const scalingFactor = 0.000008;
  return baseLineWidth + messageCount * scalingFactor;
};

type Props = {
  channels: ChannelsQuery['channels'];
  totalMessageCounts: TotalMessageCountsQuery['totalMessageCounts'];
  ecosystem: Ecosystem;
  updateTrigger?: number;
  selectedChannel?: ChannelQuery['channel'];
};

const ParachainsGraph: FC<Props> = ({
  channels,
  totalMessageCounts,
  ecosystem,
  updateTrigger,
  selectedChannel
}) => {
  const {
    parachains,
    toggleParachain,
    setChannelId,
    setChannelAlertOpen,
    parachainArrangement,
    toggleActiveEditParachain
  } = useSelectedParachain();

  const groupRef = useRef<Group>(null);
  const { scene } = useThree();

  const sortedParachainNames = useMemo(() => {
    const nameToCountMap = totalMessageCounts.reduce((acc: any, item) => {
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

  const parachainPositions = useMemo(
    () => sortedParachainNames.map((_, index) => getParachainPosition(index, ecosystem)),
    [sortedParachainNames]
  );

  const parachainObjects = sortedParachainNames.map(name =>
    scene.getObjectByName(`${ecosystem};${name}`)
  );

  const handleParachainClick = (node: string) => {
    if (ecosystem === Ecosystem.POLKADOT) toggleParachain(node);
  };

  const onRightClick = (node: string) => {
    if (ecosystem === Ecosystem.POLKADOT) {
      toggleActiveEditParachain(`${ecosystem};${node}`);
    }
  };

  const onRelaychainClick = () => {
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

  const onChannelClick = (channelId: number) => () => {
    if (ecosystem === Ecosystem.POLKADOT) {
      setChannelAlertOpen(true);
      setChannelId(channelId);
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

  const channelElements = useMemo(
    () =>
      ecosystem === Ecosystem.POLKADOT && parachainObjects.every(obj => obj !== undefined)
        ? channels.map(channel => {
            const senderObject = parachainObjects.find(
              object => getParachainId(object.name.split(';')[1], ecosystem) === channel.sender
            );
            const recipientName = parachainObjects.find(
              object => getParachainId(object.name.split(';')[1], ecosystem) === channel.recipient
            );

            const senderPosition = senderObject?.position;

            const recipientPosition = recipientName?.position;

            if (!senderPosition || !recipientPosition) {
              return null;
            }

            const lineWidth = calculateLineWidth(channel.message_count);
            const isSelectedChannel =
              parachains.some(p => getParachainId(p, ecosystem) === channel.sender) ||
              parachains.some(p => getParachainId(p, ecosystem) === channel.recipient);

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
          })
        : null,
    [parachainObjects, updateTrigger]
  );

  return (
    <>
      <group name={ecosystem} ref={groupRef}>
        <Relaychain
          onClick={onRelaychainClick}
          ecosystem={ecosystem}
          isSelected={parachains.includes('Polkadot')}
        />
        {sortedParachainNames?.map((node, index) => {
          return (
            <Fragment key={node}>
              <Parachain
                name={node}
                index={index}
                onClick={handleParachainClick}
                onRightClick={onRightClick}
                isSelected={parachains.includes(node)}
                scale={calculateParachainScale(node)}
                ecosystem={ecosystem}
              />
              <LineBetween
                startPosition={new Vector3()}
                endPosition={
                  parachainObjects.find(obj => obj?.name === `${ecosystem};${node}`)?.position ??
                  parachainPositions[index]
                }
                lineWidth={0.02}
                isHighlighed={parachains.includes('Polkadot')}
                isSelected={false}
                isSecondary={false}
                onClick={() => {}}
              />
            </Fragment>
          );
        })}
        {ecosystem === Ecosystem.POLKADOT && channelElements}
      </group>
    </>
  );
};

export default ParachainsGraph;
