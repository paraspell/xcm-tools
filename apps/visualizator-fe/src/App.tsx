import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Flex, Group, MantineProvider, Stack } from '@mantine/core';
import Scene3d from './pages/Scene3d';

import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';
import Footer from './components/Footer/Footer';
import TabNavigator from './components/TabNavigator/TabNavigator';
import ChannelInfoContainer from './components/ChannelInfo/ChannelInfo.container';
import SendXCMContainer from './components/SendXCMContainer/SendXCMContainer';
import WalletProvider from './providers/WalletProvider';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <SelectedParachainProvider>
          <MantineProvider>
            <Flex h="100%">
              <Group flex={0.6} h="100%" pos="relative">
                <Scene3d />
                <Footer />
                <ChannelInfoContainer />
                <SendXCMContainer />
              </Group>
              <Group flex={0.4} bg="white" gap={0} align="flex-start">
                <Stack h="100%" w="100%" style={{ overflow: 'hidden' }}>
                  <Flex flex={1} w="100%" justify="center">
                    <TabNavigator />
                  </Flex>
                  <Flex flex={1} w="100%" justify="center">
                    <TabNavigator />
                  </Flex>
                </Stack>
              </Group>
            </Flex>
          </MantineProvider>
        </SelectedParachainProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
};

export default App;
