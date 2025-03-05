import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './style.css';
import { Box, Flex, MantineProvider } from '@mantine/core';
import SelectedParachainProvider from './context/SelectedParachain/SelectedParachainContext';
import WalletProvider from './providers/WalletProvider';
import { ApolloProvider } from '@apollo/client';
import { Notifications } from '@mantine/notifications';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

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

const App = () => (
  <ApolloProvider client={client}>
    <WalletProvider>
      <SelectedParachainProvider>
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
      </SelectedParachainProvider>
    </WalletProvider>
  </ApolloProvider>
);

export default App;
