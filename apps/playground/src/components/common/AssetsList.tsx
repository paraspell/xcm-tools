import { Accordion, Badge, Group, Stack, Text, TextInput } from '@mantine/core';
import type { TAssetInfo } from '@paraspell/sdk';
import { formatUnits } from '@paraspell/sdk';
import { IconCoins, IconSearch } from '@tabler/icons-react';
import Fuse from 'fuse.js';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { CollapsibleJson, DetailRow, ResultAlert } from './resultDisplay';

export const AssetsAccordion: FC<{ assets: TAssetInfo[] }> = ({ assets }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery('');
  }, [assets]);

  const fuse = useMemo(
    () =>
      new Fuse(assets, {
        keys: ['symbol', 'assetId'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [assets],
  );

  const trimmed = query.trim();
  const matched =
    trimmed === '' ? assets : fuse.search(trimmed).map(({ item }) => item);
  const filtered = matched.map((asset, i) => ({
    asset,
    id: `${asset.symbol}-${asset.assetId ?? ''}-${i}`,
  }));

  return (
    <>
      <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
        <Text size="sm" c="dimmed">
          {trimmed === ''
            ? `${assets.length} asset${assets.length === 1 ? '' : 's'}`
            : `${filtered.length} of ${assets.length}`}
        </Text>
        {assets.length > 1 && (
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filter by symbol or ID"
            size="xs"
            leftSection={<IconSearch size={14} />}
            w={220}
          />
        )}
      </Group>

      {filtered.length === 0 ? (
        <Text size="sm" c="dimmed">
          No matching assets.
        </Text>
      ) : (
        <Accordion variant="separated" radius="md" chevronPosition="right">
          {filtered.map(({ asset, id }) => (
            <Accordion.Item key={id} value={id}>
              <Accordion.Control>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={600} size="sm">
                    {asset.symbol}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {asset.decimals} dec
                  </Text>
                  {asset.isNative && (
                    <Badge size="xs" variant="light" color="grape" tt="none">
                      Native
                    </Badge>
                  )}
                  {asset.isFeeAsset && (
                    <Badge size="xs" variant="light" color="teal" tt="none">
                      Fee
                    </Badge>
                  )}
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={4}>
                  <DetailRow labelW={120} label="Symbol">
                    {asset.symbol}
                  </DetailRow>
                  <DetailRow labelW={120} label="Decimals">
                    {asset.decimals}
                  </DetailRow>
                  {asset.assetId !== undefined && (
                    <DetailRow labelW={120} label="Asset ID">
                      {asset.assetId}
                    </DetailRow>
                  )}
                  {asset.existentialDeposit !== undefined && (
                    <DetailRow labelW={120} label="Existential dep.">
                      {formatUnits(
                        BigInt(asset.existentialDeposit),
                        asset.decimals,
                      )}{' '}
                      {asset.symbol}
                    </DetailRow>
                  )}
                  {asset.alias !== undefined && (
                    <DetailRow labelW={120} label="Alias">
                      {asset.alias}
                    </DetailRow>
                  )}
                  <CollapsibleJson label="Location" data={asset.location} />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </>
  );
};

type Props = {
  title: string;
  assets: TAssetInfo[];
  onClose: () => void;
};

export const AssetsList: FC<Props> = ({ title, assets, onClose }) => (
  <ResultAlert
    color="blue"
    title={title}
    icon={<IconCoins size={24} />}
    onClose={onClose}
  >
    <AssetsAccordion assets={assets} />
  </ResultAlert>
);
