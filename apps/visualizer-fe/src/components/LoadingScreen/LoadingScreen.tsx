import { LoadingOverlay } from '@mantine/core';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import type {
  NetworkStatus,
  UseApolloNetworkStatusOptions
} from 'react-apollo-network-status/dist/src/useApolloNetworkStatus';

import { LogoLoader } from '../LogoLoader/LogoLoader';
import { StarsBackground } from '../StarsBackground/StarsBackground';

type Props = {
  useApolloNetworkStatus: (options?: UseApolloNetworkStatusOptions) => NetworkStatus;
};

export const LoadingScreen: FC<Props> = ({ useApolloNetworkStatus }) => {
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
      }, 0);

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
