import { useState } from 'react';
import { Checkbox, Stack, Title } from '@mantine/core';
import AmountTransferedPlotContainer from '../components/AmountTransferedPlot/AmountTransferedPlot.container';
import { useTranslation } from 'react-i18next';

const Scene2dAmountsByDay = () => {
  const { t } = useTranslation();
  const [showMedian, setShowMedian] = useState(false);
  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Title order={2} ta="center">
        {t('amountByDay')}
      </Title>
      <Checkbox
        label="Show median"
        onChange={() => setShowMedian(value => !value)}
        checked={showMedian}
      >
        {t('median')}
      </Checkbox>
      <AmountTransferedPlotContainer showMedian={showMedian} />
    </Stack>
  );
};

export default Scene2dAmountsByDay;
