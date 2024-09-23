import { useState } from 'react';
import { Checkbox, Group, Stack, Title, Tooltip } from '@mantine/core';
import AmountTransferedPlotContainer from '../components/AmountTransferedPlot/AmountTransferedPlot.container';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle } from '@tabler/icons-react';

const Scene2dAmountsByDay = () => {
  const { t } = useTranslation();
  const [showMedian, setShowMedian] = useState(false);
  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Title order={2} ta="center">
        {t('amountByDay')}
      </Title>
      <Group justify="space-between">
        <Checkbox
          label="Show median"
          onChange={() => setShowMedian(value => !value)}
          checked={showMedian}
        >
          {t('median')}
        </Checkbox>
        <Tooltip label={t('amountsChartInfo')} position="right" withArrow multiline w={220}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconInfoCircle size={16} />
          </div>
        </Tooltip>
      </Group>
      <AmountTransferedPlotContainer showMedian={showMedian} />
    </Stack>
  );
};

export default Scene2dAmountsByDay;
