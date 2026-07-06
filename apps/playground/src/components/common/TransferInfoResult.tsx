import { Badge, Group, Stack, Text, Timeline } from '@mantine/core';
import type { TAssetInfo, TChain, TTransferInfo } from '@paraspell/sdk';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowRight,
  IconArrowsExchange,
  IconArrowUpRight,
  IconCheck,
  IconRoute,
} from '@tabler/icons-react';
import type { FC, ReactNode } from 'react';

import { formatAmount } from '../../utils/formatBalance';
import {
  ChainIcon,
  CollapsibleJson,
  FeeBadges,
  getRoute,
  ResultAlert,
  sumFeesByLocation,
  type TResultChains,
} from './resultDisplay';

type Props = TResultChains & {
  result: TTransferInfo;
  onClose: () => void;
};

const InfoRow: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <Group gap="xs" wrap="nowrap" align="center">
    <Text size="xs" c="dimmed" w={72} style={{ flexShrink: 0 }}>
      {label}
    </Text>
    <Group gap={6} align="center" style={{ minWidth: 0 }}>
      {children}
    </Group>
  </Group>
);

const SufficientBadge: FC<{ sufficient: unknown }> = ({ sufficient }) => {
  if (typeof sufficient !== 'boolean') return null;
  return (
    <Badge
      size="xs"
      variant="light"
      color={sufficient ? 'green' : 'red'}
      tt="none"
      leftSection={
        sufficient ? <IconCheck size={11} /> : <IconAlertTriangle size={11} />
      }
    >
      {sufficient ? 'Sufficient' : 'Insufficient'}
    </Badge>
  );
};

const FeeRow: FC<{
  xcmFee: { fee: bigint; asset: TAssetInfo; sufficient?: boolean };
}> = ({ xcmFee }) => (
  <InfoRow label="Fee">
    <Text size="sm">{formatAmount(xcmFee.fee, xcmFee.asset)}</Text>
    <SufficientBadge sufficient={xcmFee.sufficient} />
  </InfoRow>
);

const BalanceFlow: FC<{
  before: unknown;
  after: unknown;
  asset: TAssetInfo;
}> = ({ before, after, asset }) => (
  <Group gap={6} align="center" wrap="wrap">
    <Text size="sm" c="dimmed">
      {formatAmount(before, asset)}
    </Text>
    <IconArrowRight size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
    <Text size="sm" fw={500}>
      {formatAmount(after, asset)}
    </Text>
  </Group>
);

const StopTitle: FC<{ chain?: TChain; role: string; isExchange?: boolean }> = ({
  chain,
  role,
  isExchange,
}) => (
  <Group gap={6} align="center">
    <ChainIcon chain={chain} />
    <Text fw={600} size="sm">
      {chain ?? role}
    </Text>
    <Text size="xs" c="dimmed">
      ·
    </Text>
    {isExchange ? (
      <Badge
        size="xs"
        variant="light"
        color="grape"
        tt="none"
        leftSection={<IconArrowsExchange size={11} />}
      >
        Exchange
      </Badge>
    ) : (
      <Text size="xs" c="dimmed">
        {role}
      </Text>
    )}
  </Group>
);

export const TransferInfoResult: FC<Props> = ({
  result,
  originChain,
  destChain,
  onClose,
}) => {
  const { chain, origin, hops, destination } = result;

  const sentCurrencies = [origin.selectedCurrency].flat();
  const receivedCurrencies = [destination.receivedCurrency].flat();

  const hasInsufficient = [
    ...sentCurrencies.map((c) => c.sufficient),
    origin.xcmFee.sufficient,
    ...receivedCurrencies.map((c) => c.sufficient),
  ].some((flag) => flag === false);

  const feeSummary = sumFeesByLocation(
    [
      origin.xcmFee,
      ...hops.map((hop) => hop.result.xcmFee),
      destination.xcmFee,
    ].map((xcmFee) => ({ fee: BigInt(xcmFee.fee), asset: xcmFee.asset })),
  );

  const { route } = getRoute(originChain, destChain);

  return (
    <ResultAlert
      color={hasInsufficient ? 'yellow' : 'blue'}
      title="Transfer info"
      icon={
        hasInsufficient ? (
          <IconAlertTriangle size={24} />
        ) : (
          <IconRoute size={24} />
        )
      }
      onClose={onClose}
    >
      <Group gap="xs" mb="md" align="center">
        <Text size="sm" fw={500}>
          Transfer {route}
        </Text>
        <Badge variant="light" color="gray" radius="sm" tt="none">
          {chain.ecosystem}
        </Badge>
      </Group>

      <Group
        gap="xl"
        mb="lg"
        p="md"
        wrap="wrap"
        style={{
          borderRadius: 'var(--mantine-radius-md)',
          background: 'var(--mantine-color-default-hover)',
        }}
      >
        <Stack gap={2}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Recipient receives
          </Text>
          <Group gap="xs">
            {receivedCurrencies.map((c, i) => (
              <Text key={i} size="lg" fw={700}>
                {formatAmount(c.receivedAmount, c.asset)}
              </Text>
            ))}
          </Group>
        </Stack>
        {feeSummary.length > 0 && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Total fees
            </Text>
            <Group gap="xs">
              <FeeBadges summary={feeSummary} />
            </Group>
          </Stack>
        )}
      </Group>

      {hasInsufficient && (
        <Group gap={6} mb="lg" align="center" wrap="nowrap">
          <IconAlertTriangle
            size={14}
            color="var(--mantine-color-yellow-6)"
            style={{ flexShrink: 0 }}
          />
          <Text size="xs" c="dimmed">
            A balance is insufficient to cover this transfer.
          </Text>
        </Group>
      )}

      <Timeline
        active={hops.length + 2}
        bulletSize={26}
        lineWidth={2}
        color="blue"
      >
        <Timeline.Item
          bullet={<IconArrowUpRight size={14} />}
          title={
            <StopTitle
              chain={originChain}
              role="Origin"
              isExchange={origin.isExchange}
            />
          }
        >
          <Stack gap={4} mt={4}>
            {sentCurrencies.map((c, i) => (
              <InfoRow key={i} label="Sending">
                <BalanceFlow
                  before={c.balance}
                  after={c.balanceAfter}
                  asset={c.asset}
                />
                <SufficientBadge sufficient={c.sufficient} />
              </InfoRow>
            ))}
            <FeeRow xcmFee={origin.xcmFee} />
            {sentCurrencies.map((c, i) => (
              <CollapsibleJson key={i} label="Asset info" data={c.asset} />
            ))}
          </Stack>
        </Timeline.Item>

        {hops.map((hop, i) => (
          <Timeline.Item
            key={`hop-${i}`}
            bullet={<IconArrowRight size={14} />}
            title={
              <StopTitle
                chain={hop.chain}
                role="Hop"
                isExchange={hop.result.isExchange}
              />
            }
          >
            <Stack gap={4} mt={4}>
              <FeeRow xcmFee={hop.result.xcmFee} />
              <CollapsibleJson label="Asset info" data={hop.result.asset} />
            </Stack>
          </Timeline.Item>
        ))}

        <Timeline.Item
          bullet={<IconArrowDownRight size={14} />}
          title={
            <StopTitle
              chain={destChain}
              role="Destination"
              isExchange={destination.isExchange}
            />
          }
        >
          <Stack gap={4} mt={4}>
            {receivedCurrencies.map((c, i) => (
              <Stack key={i} gap={4}>
                <InfoRow label="Received">
                  <Text size="sm" fw={500}>
                    {formatAmount(c.receivedAmount, c.asset)}
                  </Text>
                  <SufficientBadge sufficient={c.sufficient} />
                </InfoRow>
                <InfoRow label="Balance">
                  <BalanceFlow
                    before={c.balance}
                    after={c.balanceAfter}
                    asset={c.asset}
                  />
                </InfoRow>
              </Stack>
            ))}
            <FeeRow xcmFee={destination.xcmFee} />
            {receivedCurrencies.map((c, i) => (
              <CollapsibleJson key={i} label="Asset info" data={c.asset} />
            ))}
          </Stack>
        </Timeline.Item>
      </Timeline>

      <CollapsibleJson label="Raw JSON" data={result} mt="xl" />
    </ResultAlert>
  );
};
