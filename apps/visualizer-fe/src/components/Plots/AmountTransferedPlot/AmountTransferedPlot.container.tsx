import { useQuery } from '@apollo/client/react';
import { Center, Checkbox, Group, Loader, Stack, Title, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { messageCountsByDayQueryDocument } from '../../../api/messages';
import { useSelectedEcosystem } from '../../../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { MessageCountsByDayQuery } from '../../../gql/graphql';
import { convertToCsv, downloadSvg, downloadZip } from '../../../utils';
import { DownloadButtons } from '../../DownloadButtons';
import { AmountTransferredPlot } from './AmountTransferedPlot';

const now = Date.now();

export const AmountTransferedPlotContainer = () => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const [showMedian, setShowMedian] = useState(false);

  const { selectedParachains, dateRange } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();
  const [start, end] = dateRange;

  const { data, loading, error } = useQuery<MessageCountsByDayQuery>(
    messageCountsByDayQueryDocument,
    {
      variables: {
        ecosystem: selectedEcosystem.toString().toLowerCase(),
        parachains: selectedParachains,
        startTime: start && end ? Math.floor(start.getTime() / 1000) : 1,
        endTime: start && end ? Math.floor(end.getTime() / 1000) : Math.floor(now / 1000)
      }
    }
  );

  const onDownloadZipClick = () => {
    if (!data || !Array.isArray(data.messageCountsByDay))
      throw new Error(t('errors.noDownloadData'));

    const headers: (keyof Omit<
      MessageCountsByDayQuery['messageCountsByDay'][number],
      '__typename'
    >)[] = [
      'ecosystem',
      'parachain',
      'date',
      'messageCount',
      'messageCountSuccess',
      'messageCountFailed'
    ];
    const rows = data.messageCountsByDay.map(({ __typename, parachain, ecosystem, ...rest }) => ({
      ...rest,
      parachain: parachain ?? '',
      ecosystem: ecosystem ?? ''
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
          {t('charts.amounts.title')}
        </Title>
        <DownloadButtons
          onDownloadZipClick={onDownloadZipClick}
          onDownloadSvgClick={onDownloadSvgClick}
        />
      </Group>
      <Group justify="space-between">
        <Checkbox
          label={t('charts.amounts.median')}
          onChange={() => setShowMedian(value => !value)}
          checked={showMedian}
        />
        <Tooltip
          label={t('charts.common.amountsChartInfo')}
          position="right"
          withArrow
          multiline
          w={220}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconInfoCircle size={16} />
          </div>
        </Tooltip>
      </Group>
      <AmountTransferredPlot
        ref={ref}
        counts={data?.messageCountsByDay ?? []}
        showMedian={showMedian}
      />
    </Stack>
  );
};
