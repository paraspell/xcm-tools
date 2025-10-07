import { ApolloProvider } from '@apollo/client';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { Box, Flex, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';
import { BrowserRouter } from 'react-router-dom';

import LeftPanel from './components/LeftPanel';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import RightPanel from './components/RightPanel';
import LiveDataProvider from './context/LiveData/LiveDataContext';
import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';
import WalletProvider from './providers/WalletProvider';

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
      uri: `${import.meta.env.VITE_API_URL}/graphql`
    })
  )
});

const App = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <WalletProvider>
        <SelectedParachainProvider>
          <LiveDataProvider>
            <MantineProvider forceColorScheme="light">
              <Box pos="relative" h="100%">
                <LoadingScreen useApolloNetworkStatus={useApolloNetworkStatus} />
                <Notifications />
                <Flex h="100%">
                  <LeftPanel />
                  <RightPanel />
                </Flex>
              </Box>
            </MantineProvider>
          </LiveDataProvider>
        </SelectedParachainProvider>
      </WalletProvider>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
