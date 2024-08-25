import { useState } from 'react';
import { Box, Flex, Group, MantineProvider, Stack } from '@mantine/core';
import Scene3d from './pages/Scene3d';
import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';
import Footer from './components/Footer/Footer';
import TabNavigator from './components/TabNavigator/TabNavigator';
import ChannelAlertContainer from './components/ChannelInfo/ChannelAlert.container';
import SendXCMContainer from './components/SendXCMContainer/SendXCMContainer';
import WalletProvider from './providers/WalletProvider';
import { ApolloProvider } from '@apollo/client';
import { useSpring, animated } from '@react-spring/web';
import CollapseButton from './components/CollapseButton';
import EcosystemSelectContainer from './components/EcosystemSelect/EcosystemSelect.container';
import { PageRoute } from './PageRoute';
import { Notifications } from '@mantine/notifications';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';

const { link, useApolloNetworkStatus } = createNetworkStatusNotifier();

export const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Channel: {
        keyFields: ['id', 'message_count']
      }
    }
  }),
  link: link.concat(
    createHttpLink({
      uri: import.meta.env.VITE_API_URL as string
    })
  )
});

const App = () => {
  const [width, setWidth] = useState('40%');
  const props = useSpring({ width });

  const toggleWidth = () => {
    setWidth(width === '40%' ? '0%' : '40%');
  };

  const isCollapsed = width === '0%';

  return (
    <ApolloProvider client={client}>
      <WalletProvider>
        <SelectedParachainProvider>
          <MantineProvider>
            <Box pos="relative" h="100%">
              <LoadingScreen useApolloNetworkStatus={useApolloNetworkStatus} />
              <Notifications />
              <Flex h="100%">
                <Group flex={1} w="60%" h="100%" pos="relative">
                  <Scene3d />
                  <Footer />
                  <ChannelAlertContainer />
                  <SendXCMContainer />
                  <EcosystemSelectContainer />
                </Group>
                <animated.div style={props}>
                  <Stack h="100%" w="100%" pos="relative" bg="white">
                    <CollapseButton onClick={toggleWidth} isCollapsed={isCollapsed} />
                    <Flex flex={1} w="100%" justify="center">
                      <TabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
                    </Flex>
                    <Flex flex={1} w="100%" justify="center">
                      <TabNavigator />
                    </Flex>
                  </Stack>
                </animated.div>
              </Flex>
            </Box>
          </MantineProvider>
        </SelectedParachainProvider>
      </WalletProvider>
    </ApolloProvider>
  );
};

export default App;
