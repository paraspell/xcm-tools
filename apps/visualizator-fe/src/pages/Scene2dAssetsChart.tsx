import { Stack, Title } from '@mantine/core';
import AssetsTransferedPlotContainer from '../components/AssetsTransferedPlot/AssetsTransferedPlot.container';
import { useTranslation } from 'react-i18next';

const Scene2dAssetsChart = () => {
  const { t } = useTranslation();
  return (
    <Stack gap="xl" w="100%" h="100%" pl="xl" pr="xl">
      <Title order={2} ta="center">
        {t('assetsTransfered')}
      </Title>
      <AssetsTransferedPlotContainer />
    </Stack>
  );
};

export default Scene2dAssetsChart;
