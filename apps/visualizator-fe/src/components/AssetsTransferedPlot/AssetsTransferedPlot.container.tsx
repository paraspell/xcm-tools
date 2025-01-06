import { useRef } from 'react';
import { assetCountsBySymbolQueryDocument } from '../../api/messages';
import AssetsTransferedPlot from './AssetsTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';
import { Center, Group, Loader, Stack, Title } from '@mantine/core';
import downloadSvg from '../../utils/downloadSvg';
import DownloadButtons from '../DownloadButtons';
import type { AssetCountsBySymbolQuery } from '../../gql/graphql';
import convertToCsv from '../../utils/convertToCsv';
import { downloadZip } from '../../utils/downloadZip';

const now = Date.now();

const AssetsTransferedPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(assetCountsBySymbolQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
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
