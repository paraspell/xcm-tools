import { CodeHighlight } from '@mantine/code-highlight';
import type { AlertProps, MantineSpacing } from '@mantine/core';
import {
  Alert,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Image,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type {
  TAssetInfo,
  TChain,
  TDryRunResult,
  TGetXcmFeeResult,
  TTransferInfo,
  TXcmFeeDetail,
} from '@paraspell/sdk';
import { deepEqual, replaceBigInt } from '@paraspell/sdk';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { CSSProperties, FC, ReactNode } from 'react';

import { formatBalance } from '../../utils/formatBalance';
import { getParachainIcon } from '../../utils/getParachainIcon';

export const formatCompact = (value: bigint | string): string =>
  Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value));

export const sumFeesByLocation = (
  fees: { fee: bigint; asset: TAssetInfo }[],
): { asset: TAssetInfo; total: bigint }[] => {
  const totals: { asset: TAssetInfo; total: bigint }[] = [];
  for (const { fee, asset } of fees) {
    const existing = totals.find((entry) =>
      deepEqual(entry.asset.location, asset.location),
    );
    if (existing) existing.total += fee;
    else totals.push({ asset, total: fee });
  }
  return totals.filter(({ total }) => total > 0n);
};

export const getRoute = (
  originChain: TChain,
  destChain: TChain,
): { sameChain: boolean; route: string } => {
  const sameChain = originChain === destChain;
  return {
    sameChain,
    route: sameChain
      ? `on ${originChain}`
      : `from ${originChain} to ${destChain}`,
  };
};

export type TResultChains = {
  originChain: TChain;
  destChain: TChain;
};

export type TResultView =
  | ({
      variant: 'dryRun' | 'dryRunPreview';
      result: TDryRunResult;
    } & TResultChains)
  | ({ variant: 'xcmFee'; result: TGetXcmFeeResult } & TResultChains)
  | ({ variant: 'originXcmFee'; result: TXcmFeeDetail } & TResultChains)
  | ({ variant: 'transferInfo'; result: TTransferInfo } & TResultChains);

export const isResultViewFailure = (view: TResultView): boolean => {
  if (view.variant === 'transferInfo') return false;
  return view.result.dryRunError !== undefined;
};

export const rawJsonStyles = {
  code: {
    padding: 0,
    backgroundColor: 'transparent',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  } satisfies CSSProperties,
};

export const ChainIcon: FC<{ chain?: TChain; size?: number }> = ({
  chain,
  size = 20,
}) => {
  const src = getParachainIcon(chain);
  if (!src) return null;
  return (
    <Image
      src={src}
      style={{ width: size, height: size }}
      radius="xl"
      alt={chain}
    />
  );
};

export const DetailRow: FC<{
  label: string;
  children: ReactNode;
  labelW?: number;
}> = ({ label, children, labelW = 64 }) => (
  <Group gap="xs" wrap="nowrap" align="baseline">
    <Text size="xs" c="dimmed" w={labelW} style={{ flexShrink: 0 }}>
      {label}
    </Text>
    <Text size="sm" style={{ wordBreak: 'break-word' }}>
      {children}
    </Text>
  </Group>
);

export const CollapsibleJson: FC<{
  label: string;
  data: unknown;
  mt?: MantineSpacing;
}> = ({ label, data, mt }) => {
  const [opened, { toggle }] = useDisclosure(false);
  return (
    <Box mt={mt}>
      <Button
        variant="subtle"
        color="gray"
        size="compact-xs"
        w="fit-content"
        px={0}
        rightSection={
          opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
        }
        onClick={toggle}
      >
        {label}
      </Button>
      <Collapse expanded={opened}>
        <CodeHighlight
          code={JSON.stringify(data, replaceBigInt, 2)}
          language="ts"
          withCopyButton
          styles={rawJsonStyles}
        />
      </Collapse>
    </Box>
  );
};

export const FeeBadges: FC<{
  summary: { asset: TAssetInfo; total: bigint }[];
}> = ({ summary }) => (
  <>
    {summary.map(({ asset, total }, i) => (
      <Badge key={i} variant="light" color="gray" radius="sm">
        {formatBalance(total, asset.decimals)} {asset.symbol}
      </Badge>
    ))}
  </>
);

export const ResultAlert: FC<
  Pick<AlertProps, 'color' | 'title' | 'icon'> & {
    onClose: () => void;
    children: ReactNode;
  }
> = ({ color, title, icon, onClose, children }) => (
  <Alert
    color={color}
    title={title}
    icon={icon}
    withCloseButton
    onClose={onClose}
    mt="lg"
    p="xl"
    maw={900}
    w="100%"
    data-testid="output"
    styles={{
      title: { fontSize: 'var(--mantine-font-size-lg)' },
      icon: {
        marginTop: 0,
        height:
          'calc(var(--mantine-font-size-lg) * var(--mantine-line-height))',
      },
    }}
  >
    {children}
  </Alert>
);
