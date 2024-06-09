import { Flex, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import AccountsAmountPlotContainer from '../components/AccountsAmountPlot/AccountsAmountPlot.container';
import SliderInput from '../components/SliderInput';

const Scene2dBubblePlot = () => {
  const [threshold, setThreshold] = useState(500);

  return (
    <Stack gap="xl" w="100%" h="100%">
      <Group align="flex-start" pr="xl" pl="xl" pb={0}>
        <Flex w="100%">
          <SliderInput
            value={threshold}
            onCustomChange={setThreshold}
            min={200}
            max={2000}
            flex={1}
          />
        </Flex>
      </Group>
      <Group flex={1} w="100%">
        <AccountsAmountPlotContainer threshold={threshold} />
      </Group>
    </Stack>
  );
};

export default Scene2dBubblePlot;
