import { useQuery } from '@apollo/client/react';
import { Center, Checkbox, Group, Loader, Stack, Title } from '@mantine/core';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { assetCountsBySymbolQueryDocument } from '../../../api/messages';
import { useSelectedEcosystem } from '../../../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { AssetCountsBySymbolQuery } from '../../../gql/graphql';
import { convertToCsv, downloadSvg, downloadZip } from '../../../utils';
import { DownloadButtons } from '../../DownloadButtons';
import { AssetsTransferredPlot } from './AssetsTransferedPlot';

const now = Date.now();

export const AssetsTransferedPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const { selectedParachains, dateRange } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();

  const [showAmounts, setShowAmounts] = useState(false);

  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(assetCountsBySymbolQueryDocument, {
    variables: {
      ecosystem: selectedEcosystem.toString().toLowerCase(),
      parachains: selectedParachains,
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  const onDownloadZipClick = () => {
    if (!data) throw new Error(t('errors.noDownloadData'));

    const headers: (keyof Omit<
      AssetCountsBySymbolQuery['assetCountsBySymbol'][number],
      '__typename'
    >)[] = ['parachain', 'symbol', 'count', 'amount'];
    const rows = data.assetCountsBySymbol.map(({ __typename, parachain, ...rest }) => ({
      ...rest,
      parachain: parachain ?? ''
    }));
    const csvData = convertToCsv(rows, headers);
    void downloadZip(rows, csvData);
  };

  const onDownloadSvgClick = () => {
    if (!ref.current) return;
    downloadSvg(ref.current);
  };

  if (loading) {
    return (
      <Center h="100%" w="100%">
        <Loader size="xs" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100%" w="100%">
        {t('status.error')}
      </Center>
    );
  }

  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Group>
        <Title order={2} ta="center" flex={1}>
          {t('charts.assets.title')}
        </Title>
        <DownloadButtons
          onDownloadZipClick={onDownloadZipClick}
          onDownloadSvgClick={onDownloadSvgClick}
        />
      </Group>
      <Group justify="space-between">
        <Checkbox
          label={t('charts.assets.amounts')}
          onChange={() => setShowAmounts(value => !value)}
          checked={showAmounts}
        />
      </Group>
      <AssetsTransferredPlot
        ref={ref}
        counts={data?.assetCountsBySymbol ?? []}
        showAmounts={showAmounts}
      />
    </Stack>
  );
};

AssetsTransferedPlotContainer.displayName = 'AssetsTransferedPlotContainer';
