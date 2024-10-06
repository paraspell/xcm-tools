import { LoadingOverlay } from '@mantine/core';
import StarsBackground from '../StarsBackground/StarsBackground';
import LogoLoader from '../LogoLoader/LogoLoader';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import type {
  NetworkStatus,
  UseApolloNetworkStatusOptions
} from 'react-apollo-network-status/dist/src/useApolloNetworkStatus';

type Props = {
  useApolloNetworkStatus: (options?: UseApolloNetworkStatusOptions) => NetworkStatus;
};

const LoadingScreen: FC<Props> = ({ useApolloNetworkStatus }) => {
  const status = useApolloNetworkStatus();
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (initialLoad) {
      timeout = setTimeout(() => {
        if (status.numPendingQueries === 0) {
          setLoading(false);
          setInitialLoad(false);
        } else {
          const interval = setInterval(() => {
            if (status.numPendingQueries === 0) {
              setLoading(false);
              setInitialLoad(false);
              clearInterval(interval);
            }
          }, 500);
        }
      }, 1000);

      return () => {
        clearTimeout(timeout);
        clearInterval(timeout);
      };
    }
  }, [initialLoad, status.numPendingQueries]);

  return (
    <LoadingOverlay
      visible={loading}
      zIndex={1000}
      overlayProps={{
        backgroundOpacity: 1,
        color: '#000',
        children: <StarsBackground />
      }}
      loaderProps={{
        children: <LogoLoader />
      }}
    />
  );
};

export default LoadingScreen;
