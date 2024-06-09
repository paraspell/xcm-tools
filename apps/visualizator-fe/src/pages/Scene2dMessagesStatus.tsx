import SuccessMessagesPlotContainer from '../components/SuccessMessagesPlot/SuccessMessagesPlot.container';
import { Stack, Title } from '@mantine/core';

const Scene2dMessagesStatus = () => (
  <Stack gap="xl" pl="xl" pr="xl" flex={1}>
    <Title order={2} ta="center">
      Successful / Failed XCM Calls
    </Title>
    <SuccessMessagesPlotContainer />
  </Stack>
);

export default Scene2dMessagesStatus;
