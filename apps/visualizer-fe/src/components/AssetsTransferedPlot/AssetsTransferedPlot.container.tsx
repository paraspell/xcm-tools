import { useQuery } from '@apollo/client';
import { Center, Group, Loader, Stack, Title } from '@mantine/core';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { assetCountsBySymbolQueryDocument } from '../../api/messages';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { AssetCountsBySymbolQuery } from '../../gql/graphql';
import convertToCsv from '../../utils/convertToCsv';
import downloadSvg from '../../utils/downloadSvg';
import { downloadZip } from '../../utils/downloadZip';
import { getParachainId } from '../../utils/utils';
import DownloadButtons from '../DownloadButtons';
import AssetsTransferedPlot from './AssetsTransferedPlot';

const now = Date.now();

const AssetsTransferedPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const { parachains, dateRange, selectedEcosystem } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(assetCountsBySymbolQueryDocument, {
    variables: {
      ecosystem: selectedEcosystem.toString().toLowerCase(),
      paraIds: parachains.map(parachain => getParachainId(parachain, selectedEcosystem)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  const onDownloadZipClick = () => {
    if (!data) throw new Error('Could not download data.');

    const headers: (keyof Omit<
      AssetCountsBySymbolQuery['assetCountsBySymbol'][number],
      '__typename'
    >)[] = ['paraId', 'symbol', 'count'];
    const csvData = convertToCsv(data.assetCountsBySymbol, headers);
    void downloadZip(data.assetCountsBySymbol, csvData);
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
        {t('error')}
      </Center>
    );
  }

  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Group>
        <Title order={2} ta="center" flex={1}>
          {t('assetsTransfered')}
        </Title>
        <DownloadButtons
          onDownloadZipClick={onDownloadZipClick}
          onDownloadSvgClick={onDownloadSvgClick}
        />
      </Group>
      <AssetsTransferedPlot ref={ref} counts={data?.assetCountsBySymbol ?? []} />
    </Stack>
  );
};

AssetsTransferedPlotContainer.displayName = 'AssetsTransferedPlotContainer';

export default AssetsTransferedPlotContainer;
