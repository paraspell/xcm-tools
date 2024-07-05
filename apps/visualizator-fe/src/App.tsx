import { Flex, Group, MantineProvider, Stack } from '@mantine/core';
import Scene3d from './pages/Scene3d';

import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';
import Footer from './components/Footer/Footer';
import TabNavigator from './components/TabNavigator/TabNavigator';
import ChannelInfoContainer from './components/ChannelInfo/ChannelInfo.container';
import SendXCMContainer from './components/SendXCMContainer/SendXCMContainer';
import WalletProvider from './providers/WalletProvider';
import { ApolloProvider } from '@apollo/client';
import { client } from './apolloClient';

const App = () => {
  return (
    <ApolloProvider client={client}>
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
    </ApolloProvider>
  );
};

export default App;
