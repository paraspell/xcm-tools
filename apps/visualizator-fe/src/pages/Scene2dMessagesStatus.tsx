import { useTranslation } from 'react-i18next';
import SuccessMessagesPlotContainer from '../components/SuccessMessagesPlot/SuccessMessagesPlot.container';
import { Stack, Title } from '@mantine/core';

const Scene2dMessagesStatus = () => {
  const { t } = useTranslation();
  return (
    <Stack gap="xl" pl="xl" pr="xl" flex={1}>
      <Title order={2} ta="center">
        {t('successfulFailedXcmCalls')}
      </Title>
      <SuccessMessagesPlotContainer />
    </Stack>
  );
};

export default Scene2dMessagesStatus;
