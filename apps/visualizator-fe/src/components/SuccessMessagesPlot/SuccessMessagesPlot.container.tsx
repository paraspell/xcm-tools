import { messageCountsQueryDocument } from '../../api/messages';
import SuccessMessagesPlot from './SuccessMessagesPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';
import { Center, Group, Loader, Stack, Title } from '@mantine/core';
import DownloadButtons from '../DownloadButtons';
import type { MessageCountsQuery } from '../../gql/graphql';
import convertToCsv from '../../utils/convertToCsv';
import { downloadZip } from '../../utils/downloadZip';
import { useRef } from 'react';
import downloadSvg from '../../utils/downloadSvg';

const now = Date.now();

const SuccessMessagesPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(messageCountsQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

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
  const onDownloadZipClick = () => {
    if (!data) throw new Error('Could not download data.');

    const headers: (keyof Omit<MessageCountsQuery['messageCounts'][number], '__typename'>)[] = [
      'paraId',
      'success',
      'failed'
    ];
    const csvData = convertToCsv(data.messageCounts, headers);
    void downloadZip(data.messageCounts, csvData);
  };

  const onDownloadSvgClick = () => {
    if (!ref.current) return;
    downloadSvg(ref.current);
  };

  return (
    <Stack gap="xl" pl="xl" pr="xl" flex={1}>
      <Group>
        <Title order={2} ta="center" flex={1}>
          {t('successfulFailedXcmCalls')}
        </Title>
        <DownloadButtons
          onDownloadZipClick={onDownloadZipClick}
          onDownloadSvgClick={onDownloadSvgClick}
        />
      </Group>
      <SuccessMessagesPlot ref={ref} counts={data?.messageCounts ?? []} />
    </Stack>
  );
};

export default SuccessMessagesPlotContainer;
