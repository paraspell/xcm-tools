import { Checkbox, Stack, Title } from '@mantine/core';
import AmountTransferedPlotContainer from '../components/AmountTransferedPlot/AmountTransferedPlot.container';
import { useState } from 'react';

const Scene2dAmountsByDay = () => {
  const [showMedian, setShowMedian] = useState(false);
  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Title order={2} ta="center">
        Amount transfered by day
      </Title>
      <Checkbox
        label="Show median"
        onChange={() => setShowMedian(value => !value)}
        checked={showMedian}
      >
        Median
      </Checkbox>
      <AmountTransferedPlotContainer showMedian={showMedian} />
    </Stack>
  );
};

export default Scene2dAmountsByDay;
