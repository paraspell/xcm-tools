import { Badge, Group, Stack, Text } from '@mantine/core';
import type { TChain, TChainAssetsInfo } from '@paraspell/sdk';
import { IconCoins } from '@tabler/icons-react';
import type { FC } from 'react';

import { AssetsAccordion } from './AssetsList';
import { ChainIcon, DetailRow, ResultAlert } from './resultDisplay';

type Props = {
  chain: TChain;
  info: TChainAssetsInfo;
  onClose: () => void;
};

export const AssetsObjectResult: FC<Props> = ({ chain, info, onClose }) => (
  <ResultAlert
    color="blue"
    title="Chain assets info"
    icon={<IconCoins size={24} />}
    onClose={onClose}
  >
    <Group gap={6} align="center" mb="sm">
      <ChainIcon chain={chain} size={16} />
      <Text size="sm" fw={600}>
        {chain}
      </Text>
    </Group>
    <Stack gap={4} mb="md">
      <DetailRow labelW={150} label="Native symbol">
        {info.nativeAssetSymbol}
      </DetailRow>
      <DetailRow labelW={150} label="Relay chain symbol">
        {info.relaychainSymbol}
      </DetailRow>
      <DetailRow labelW={150} label="SS58 prefix">
        {info.ss58Prefix}
      </DetailRow>
      <Group gap="xs" mt={4}>
        {info.isEVM && (
          <Badge size="sm" variant="light" color="grape" tt="none">
            EVM
          </Badge>
        )}
        {info.supportsDryRunApi && (
          <Badge size="sm" variant="light" color="teal" tt="none">
            Dry-run API
          </Badge>
        )}
        {info.supportsXcmPaymentApi && (
          <Badge size="sm" variant="light" color="blue" tt="none">
            XCM payment API
          </Badge>
        )}
      </Group>
    </Stack>
    <AssetsAccordion assets={info.assets} />
  </ResultAlert>
);
