import { CodeHighlight } from '@mantine/code-highlight';
import { Badge, Button, Collapse, Group, Text, Timeline } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type {
  TDryRunResult,
  TGetXcmFeeResult,
  TXcmFeeDetail,
} from '@paraspell/sdk';
import { replaceBigInt } from '@paraspell/sdk';
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
} from '@tabler/icons-react';
import type { FC } from 'react';

import {
  buildDryRunStops,
  buildFeeStops,
  buildOriginFeeStops,
  type TStop,
} from './dryRunStops';
import {
  ChainIcon,
  FeeBadges,
  getRoute,
  rawJsonStyles,
  ResultAlert,
  sumFeesByLocation,
  type TResultChains,
} from './resultDisplay';
import { StopDetails } from './StopDetails';

type TCommonProps = TResultChains & {
  onClose: () => void;
};

type Props = TCommonProps &
  (
    | { variant: 'dryRun' | 'dryRunPreview'; result: TDryRunResult }
    | { variant: 'xcmFee'; result: TGetXcmFeeResult }
    | { variant: 'originXcmFee'; result: TXcmFeeDetail }
  );

const getResultTitle = (variant: Props['variant']): string => {
  if (variant === 'xcmFee') return 'XCM fee';
  if (variant === 'originXcmFee') return 'Origin XCM fee';
  if (variant === 'dryRunPreview') return 'Dry run preview';
  return 'Dry run';
};

const buildStops = (props: Props): TStop[] => {
  const { originChain, destChain } = props;
  if (props.variant === 'xcmFee')
    return buildFeeStops(props.result, originChain, destChain);
  if (props.variant === 'originXcmFee')
    return buildOriginFeeStops(props.result, originChain);
  return buildDryRunStops(props.result, originChain, destChain);
};

export const DryRunResult: FC<Props> = (props) => {
  const { variant, originChain, destChain, onClose } = props;

  const [rawOpened, { toggle: toggleRaw }] = useDisclosure(false);

  const stops = buildStops(props);

  const failedStop = stops.find((stop) => !stop.success);
  const hasFailure =
    failedStop !== undefined ||
    (props.variant !== 'originXcmFee' &&
      props.result.failureReason !== undefined);
  const hasPaymentInfo = stops.some((stop) => stop.feeType === 'paymentInfo');

  const title = getResultTitle(variant);

  const isSwap = stops.some((stop) => stop.isExchange);
  const verb = isSwap ? 'Swap' : 'Transfer';
  const { sameChain, route } = getRoute(originChain, destChain);
  const failOn =
    failedStop?.chain && !(sameChain && failedStop.chain === originChain)
      ? ` on ${failedStop.chain}`
      : '';

  const failReason = failedStop?.failureReason
    ? ` due to ${failedStop.failureReason}`
    : '';

  const getSubtitle = (): string => {
    if (variant === 'originXcmFee') {
      return hasFailure
        ? `Origin fee on ${originChain} could not be computed${failReason}`
        : `Origin fee on ${originChain}`;
    }
    if (hasFailure) return `${verb} ${route} would fail${failOn}${failReason}`;
    const plural = stops.length > 1 ? 's' : '';
    return `${verb} ${route} would succeed across ${stops.length} chain${plural}`;
  };

  const subtitle = getSubtitle();

  const feeSummary = sumFeesByLocation(
    stops.flatMap((stop) =>
      stop.fee !== undefined && stop.asset
        ? [{ fee: BigInt(stop.fee), asset: stop.asset }]
        : [],
    ),
  );

  return (
    <ResultAlert
      color={hasFailure ? 'red' : 'green'}
      title={title}
      icon={hasFailure ? <IconX size={24} /> : <IconCheck size={24} />}
      onClose={onClose}
    >
      <Text size="sm" fw={500} mb={feeSummary.length > 0 ? 'lg' : 'xl'}>
        {subtitle}
      </Text>

      {feeSummary.length > 0 && (
        <Group gap="xs" mb="lg" align="center">
          <Text size="xs" c="dimmed" fw={600}>
            Fees
          </Text>
          <FeeBadges summary={feeSummary} />
        </Group>
      )}

      {hasPaymentInfo && (
        <Group gap={6} mb="lg" align="center" wrap="nowrap">
          <IconAlertTriangle
            size={14}
            color="var(--mantine-color-yellow-6)"
            style={{ flexShrink: 0 }}
          />
          <Text size="xs" c="dimmed">
            Some fees are estimated via payment info and may be inaccurate.
          </Text>
        </Group>
      )}

      <Timeline
        active={stops.length}
        bulletSize={26}
        lineWidth={2}
        color="green"
      >
        {stops.map((stop) => {
          const ok = stop.success;
          return (
            <Timeline.Item
              key={stop.key}
              color={ok ? 'green' : 'red'}
              bullet={ok ? <IconCheck size={14} /> : <IconX size={14} />}
              title={
                <Group gap={6} align="center">
                  <ChainIcon chain={stop.chain} />
                  <Text fw={600} size="sm">
                    {stop.chain ?? stop.role}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ·
                  </Text>
                  {stop.isExchange ? (
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
                      {stop.role}
                    </Text>
                  )}
                </Group>
              }
            >
              <StopDetails stop={stop} />
            </Timeline.Item>
          );
        })}
      </Timeline>

      <Button
        variant="subtle"
        color="gray"
        size="compact-xs"
        mt="xl"
        rightSection={
          rawOpened ? (
            <IconChevronUp size={14} />
          ) : (
            <IconChevronDown size={14} />
          )
        }
        onClick={toggleRaw}
      >
        Raw JSON
      </Button>
      <Collapse expanded={rawOpened}>
        <CodeHighlight
          code={JSON.stringify(props.result, replaceBigInt, 2)}
          language="ts"
          withCopyButton
          styles={rawJsonStyles}
        />
      </Collapse>
    </ResultAlert>
  );
};
