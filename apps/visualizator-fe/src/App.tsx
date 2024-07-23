import { useState } from 'react';
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
import { useSpring, animated } from '@react-spring/web';
import CollapseButton from './components/CollapseButton';
import EcosystemSelectContainer from './components/EcosystemSelect/EcosystemSelect.container';

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
            <Flex h="100%">
              <Group flex={1} w="60%" h="100%" pos="relative">
                <Scene3d />
                <Footer />
                <ChannelInfoContainer />
                <SendXCMContainer />
                <EcosystemSelectContainer />
              </Group>
              <animated.div style={props}>
                <Stack h="100%" w="100%" pos="relative" bg="white">
                  <CollapseButton onClick={toggleWidth} isCollapsed={isCollapsed} />
                  <Flex flex={1} w="100%" justify="center">
                    <TabNavigator />
                  </Flex>
                  <Flex flex={1} w="100%" justify="center">
                    <TabNavigator />
                  </Flex>
                </Stack>
              </animated.div>
            </Flex>
          </MantineProvider>
        </SelectedParachainProvider>
      </WalletProvider>
    </ApolloProvider>
  );
};

export default App;
