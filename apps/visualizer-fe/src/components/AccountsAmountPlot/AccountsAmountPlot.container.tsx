import { useQuery } from '@apollo/client';
import { Center, Flex, Group, Loader, Stack } from '@mantine/core';
import type { HighchartsReactRefObject } from 'highcharts-react-official';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { accountXcmCountsQueryDocument } from '../../api/messages';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { AccountCountsQuery } from '../../gql/graphql';
import convertToCsv from '../../utils/convertToCsv';
import downloadSvg from '../../utils/downloadSvg';
import { downloadZip } from '../../utils/downloadZip';
import { getParachainId } from '../../utils/utils';
import DownloadButtons from '../DownloadButtons';
import SliderInput from '../SliderInput';
import AccountsAmountPlot from './AccountsAmountPlot';

const now = Date.now();

const AccountsAmountPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HighchartsReactRefObject>(null);

  const [threshold, setThreshold] = useState(500);

  const { parachains, dateRange, selectedEcosystem } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(accountXcmCountsQueryDocument, {
    variables: {
      ecosystem: selectedEcosystem.toString().toLowerCase(),
      threshold,
      paraIds: parachains.map(parachain => getParachainId(parachain, selectedEcosystem)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  const onDownloadZipClick = () => {
    if (!data) throw new Error('Could not download data.');

    const headers: (keyof Omit<AccountCountsQuery['accountCounts'][number], '__typename'>)[] = [
      'id',
      'count'
    ];
    const csvData = convertToCsv(data.accountCounts, headers);
    void downloadZip(data.accountCounts, csvData);
  };

  const onDownloadSvgClick = () => {
    if (!ref.current) return;
    downloadSvg(ref.current.chart.container as HTMLDivElement);
  };

  if (error) {
    return (
      <Center h="100%" w="100%">
        {t('error')}
      </Center>
    );
  }

  return (
    <Stack gap="xl" w="100%" h="100%">
      <Group align="flex-start" px="xs" pb={0}>
        <Flex w="100%" gap="xl" align="end">
          <SliderInput
            value={threshold}
            onCustomChange={setThreshold}
            min={200}
            max={2000}
            flex={1}
          />
          <DownloadButtons
            onDownloadZipClick={onDownloadZipClick}
            onDownloadSvgClick={onDownloadSvgClick}
          />
        </Flex>
      </Group>
      {loading ? (
        <Center h="100%" w="100%">
          <Loader size="xs" />
        </Center>
      ) : (
        <Group flex={1} w="100%" h="100%" justify="center">
          <AccountsAmountPlot ref={ref} counts={data?.accountCounts ?? []} />
        </Group>
      )}
    </Stack>
  );
};

export default AccountsAmountPlotContainer;
