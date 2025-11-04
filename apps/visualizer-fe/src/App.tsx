import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { ApolloProvider } from '@apollo/client/react';
import { Box, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';
import { BrowserRouter } from 'react-router-dom';

import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import MainContentPanel from './components/MainContentPanel';
import DeviceTypeProvider from './context/DeviceType/DeviceTypeContext';
import LiveDataProvider from './context/LiveData/LiveDataContext';
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
        <SelectedParachainProvider>
          <LiveDataProvider>
            <MantineProvider forceColorScheme="light">
              <Box pos="relative" h="100%">
                <LoadingScreen useApolloNetworkStatus={useApolloNetworkStatus} />
                <Notifications />
                <MainContentPanel />
              </Box>
            </MantineProvider>
          </LiveDataProvider>
        </SelectedParachainProvider>
      </DeviceTypeProvider>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
