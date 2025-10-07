import { Center, Group, Loader, Stack, Switch } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useLiveData } from '../../../context/LiveData/useLiveData';
import convertToCsv from '../../../utils/convertToCsv';
import { downloadZip } from '../../../utils/downloadZip';
import DownloadButtons from '../../DownloadButtons';
import { LiveDataPlot } from './LiveDataPlot';

const LiveDataPlotContainer = () => {
  const { t } = useTranslation();

  const { liveData, liveDataEnabled, setLiveDataEnabled } = useLiveData();

  const onDownloadZipClick = () => {
    if (!liveData) throw new Error(t('errors.noDownloadData'));

    const headers = ['ecosystem', 'timestamp', 'from', 'to', 'status', 'hash'];
    const csvData = convertToCsv(liveData, headers);
    void downloadZip(liveData, csvData);
  };

  return (
    <Stack gap="xl" w="100%" h="100%">
      <Group px="xs" pb={0} w="100%">
        <Group w="100%" justify="space-between" align="center" pr="md">
          <Switch
            checked={liveDataEnabled}
            onChange={e => setLiveDataEnabled(e.currentTarget.checked)}
            label={t('settings.animation.liveData')}
          />
          <DownloadButtons
            onDownloadZipClick={onDownloadZipClick}
            disabled={liveData.length === 0}
          />
        </Group>
      </Group>
      <Group flex={1} w="100%" h={0} mih={0} style={{ overflow: 'auto' }}>
        {liveData.length ? (
          <LiveDataPlot data={liveData} />
        ) : liveDataEnabled ? (
          <Center h="100%" w="100%">
            <Loader size="xs" />
          </Center>
        ) : (
          <Center h="100%" w="100%" p="sm" color="dimmed">
            {t('charts.liveData.notAvailable')}
          </Center>
        )}
      </Group>
    </Stack>
  );
};

export default LiveDataPlotContainer;
