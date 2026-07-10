import { CodeHighlight } from '@mantine/code-highlight';
import {
  Badge,
  Button,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { replaceBigInt } from '@paraspell/sdk';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { FC } from 'react';

import { formatBalance } from '../../utils/formatBalance';
import type { TStop } from './dryRunStops';
import {
  CollapsibleJson,
  DetailRow,
  formatCompact,
  rawJsonStyles,
} from './resultDisplay';

const hasForwardedXcms = (forwardedXcms: unknown): boolean =>
  Array.isArray(forwardedXcms) &&
  forwardedXcms.length > 0 &&
  Array.isArray(forwardedXcms[1]) &&
  forwardedXcms[1].length > 0;

const PaymentInfoBadge: FC = () => (
  <Tooltip
    label="Estimated via the payment info API because a dry run was unavailable — this fee may be inaccurate"
    multiline
    w={240}
    withArrow
  >
    <Badge
      size="xs"
      variant="light"
      color="yellow"
      tt="none"
      leftSection={<IconAlertTriangle size={11} />}
    >
      Payment info
    </Badge>
  </Tooltip>
);

export const StopDetails: FC<{ stop: TStop }> = ({ stop }) => {
  const [instructionOpened, { toggle: toggleInstruction }] =
    useDisclosure(false);

  const feeRow =
    stop.fee !== undefined && stop.asset ? (
      <Group gap="xs" wrap="nowrap" align="center">
        <Text size="xs" c="dimmed" w={64} style={{ flexShrink: 0 }}>
          {stop.success ? 'Fee' : 'Est. fee'}
        </Text>
        <Text size="sm">
          {formatBalance(BigInt(stop.fee), stop.asset.decimals)}{' '}
          {stop.asset.symbol}
        </Text>
        {stop.feeType === 'paymentInfo' && <PaymentInfoBadge />}
      </Group>
    ) : null;

  const footer = (
    <>
      {hasForwardedXcms(stop.forwardedXcms) && (
        <CollapsibleJson label="Forwarded XCMs" data={stop.forwardedXcms} />
      )}
      {stop.asset && <CollapsibleJson label="Asset info" data={stop.asset} />}
    </>
  );

  if (stop.success) {
    return (
      <Stack gap={4} mt={4}>
        {feeRow}
        {stop.weight && (
          <DetailRow label="Weight">
            ref {formatCompact(stop.weight.refTime)} · proof{' '}
            {formatCompact(stop.weight.proofSize)}
          </DetailRow>
        )}
        {stop.sufficient !== undefined && (
          <DetailRow label="Sufficient">
            {stop.sufficient ? 'Yes' : 'No'}
          </DetailRow>
        )}
        {stop.destParaId !== undefined && (
          <DetailRow label="Dest para">{stop.destParaId}</DetailRow>
        )}
        {footer}
      </Stack>
    );
  }

  const failureDetail = [
    stop.dryRunError?.subReason,
    stop.dryRunError?.instructionIndex !== undefined
      ? `at instruction #${stop.dryRunError.instructionIndex}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Stack gap={6} mt={4}>
      <Badge color="red" variant="light" radius="sm" tt="none" w="fit-content">
        {stop.dryRunError?.reason}
      </Badge>
      {failureDetail && (
        <Text size="xs" c="dimmed">
          {failureDetail}
        </Text>
      )}
      {feeRow}
      {stop.dryRunError?.instruction !== undefined && (
        <>
          <Button
            variant="subtle"
            color="red"
            size="compact-xs"
            w="fit-content"
            px={0}
            onClick={toggleInstruction}
          >
            {instructionOpened ? 'Hide' : 'Show'} failing instruction
          </Button>
          <Collapse expanded={instructionOpened}>
            <CodeHighlight
              code={JSON.stringify(
                stop.dryRunError?.instruction,
                replaceBigInt,
                2,
              )}
              language="ts"
              styles={rawJsonStyles}
            />
          </Collapse>
        </>
      )}
      {footer}
    </Stack>
  );
};
