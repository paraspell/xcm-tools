import { Stack, Title } from '@mantine/core';
import AssetsTransferedPlotContainer from '../components/AssetsTransferedPlot/AssetsTransferedPlot.container';

const Scene2dAssetsChart = () => (
  <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
    <Title order={2} ta="center">
      Assets Transfered
    </Title>
    <AssetsTransferedPlotContainer />
  </Stack>
);

export default Scene2dAssetsChart;
