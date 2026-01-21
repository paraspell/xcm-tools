import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { ApolloProvider } from '@apollo/client/react';
import { Box, Flex, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';
import { BrowserRouter } from 'react-router';

import LeftPanel from './components/LeftPanel';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import RightPanel from './components/RightPanel';
import DeviceTypeProvider from './context/DeviceType/DeviceTypeContext';
import LiveDataProvider from './context/LiveData/LiveDataContext';
import SelectedEcosystemProvider from './context/SelectedEcosystem/SelectedEcosystemContext';
import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';

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
    new HttpLink({
      uri: `${import.meta.env.VITE_GRAPHQL_URL}`
    })
  )
});

const App = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <DeviceTypeProvider>
        <SelectedEcosystemProvider>
          <SelectedParachainProvider>
            <LiveDataProvider>
              <MantineProvider forceColorScheme="light">
                <Box pos="relative" h="100%">
                  <LoadingScreen useApolloNetworkStatus={useApolloNetworkStatus} />
                  <Notifications />
                  <Flex h="100%" w="100%" pos="relative" style={{ overflow: 'hidden' }}>
                    <LeftPanel />
                    <RightPanel />
                  </Flex>
                </Box>
              </MantineProvider>
            </LiveDataProvider>
          </SelectedParachainProvider>
        </SelectedEcosystemProvider>
      </DeviceTypeProvider>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
