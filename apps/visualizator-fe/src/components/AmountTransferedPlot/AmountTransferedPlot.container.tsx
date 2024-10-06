import { useRef, useState } from 'react';
import { messageCountsByDayQueryDocument } from '../../api/messages';
import AmountTransferedPlot from './AmountTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';
import { Center, Checkbox, Group, Loader, Stack, Title, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import DownloadButtons from '../DownloadButtons';
import downloadSvg from '../../utils/downloadSvg';
import { type MessageCountsByDayQuery } from '../../gql/graphql';
import convertToCsv from '../../utils/convertToCsv';
import { downloadZip } from '../../utils/downloadZip';

const now = Date.now();

const AmountTransferedPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const [showMedian, setShowMedian] = useState(false);

  const { parachains, dateRange } = useSelectedParachain();
  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(messageCountsByDayQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  const onDownloadZipClick = () => {
    if (!data) throw new Error('Could not download data.');

    const headers: (keyof Omit<
      MessageCountsByDayQuery['messageCountsByDay'][number],
      '__typename'
    >)[] = ['paraId', 'date', 'messageCount', 'messageCountSuccess', 'messageCountFailed'];
    const csvData = convertToCsv(data.messageCountsByDay, headers);
    void downloadZip(data.messageCountsByDay, csvData);
  };

  const onDownloadSvgClick = () => {
    if (!ref.current) return;
    downloadSvg(ref.current);
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="xs" />
      </Center>
    );
  }

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Group>
        <Title order={2} ta="center" flex={1}>
          {t('amountByDay')}
        </Title>
        <DownloadButtons
          onDownloadZipClick={onDownloadZipClick}
          onDownloadSvgClick={onDownloadSvgClick}
        />
      </Group>
      <Group justify="space-between">
        <Checkbox
          label={t('median')}
          onChange={() => setShowMedian(value => !value)}
          checked={showMedian}
        />
        <Tooltip label={t('amountsChartInfo')} position="right" withArrow multiline w={220}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconInfoCircle size={16} />
          </div>
        </Tooltip>
      </Group>
      <AmountTransferedPlot
        ref={ref}
        counts={data?.messageCountsByDay ?? []}
        showMedian={showMedian}
      />
    </Stack>
  );
};

export default AmountTransferedPlotContainer;
