import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TCurrencyCore, TMultiLocation } from '@paraspell/sdk';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks/useWallet';
import type { TAssetsQuery } from '../../types';
import { fetchFromApi, replaceBigInt } from '../../utils';
import { getApiEndpoint } from '../../utils/assets/apiMappings';
import { callSdkFunc } from '../../utils/assets/sdkMappings';
import { showErrorNotification } from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type { FormValues } from './AssetsQueriesForm';
import { AssetsQueriesForm } from './AssetsQueriesForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

export const AssetsQueries = () => {
  const theme = useMantineColorScheme();

  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);
  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const { apiType } = useWallet();

  const [error, setError] = useState<Error>();
  const [output, setOutput] = useState<string>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const resolveCurrency = (formValues: FormValues): TCurrencyCore => {
    if (formValues.currencyType === 'multilocation') {
      return {
        multilocation: JSON.parse(formValues.currency) as TMultiLocation,
      };
    } else if (formValues.currencyType === 'id') {
      return { id: formValues.currency };
    } else {
      return { symbol: formValues.currency };
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi, func, address } = formValues;

    const postCalls = new Set<TAssetsQuery>([
      'ASSET_BALANCE',
      'ASSET_MULTILOCATION',
      'EXISTENTIAL_DEPOSIT',
      'ORIGIN_FEE_DETAILS',
    ]);

    const resolvedCurrency = resolveCurrency(formValues);
    if (useApi) {
      const endpoint = getApiEndpoint(func, formValues.node);
      const shouldUsePost = postCalls.has(func);

      return fetchFromApi(
        shouldUsePost && func !== 'ORIGIN_FEE_DETAILS'
          ? {
              address,
              ...('symbol' in resolvedCurrency &&
              typeof resolvedCurrency.symbol === 'string' &&
              resolvedCurrency.symbol.length === 0
                ? {}
                : { currency: resolvedCurrency }),
            }
          : {
              ...formValues,
              ...(func === 'ORIGIN_FEE_DETAILS'
                ? {
                    account: address,
                    origin: formValues.node,
                    destination: formValues.nodeDestination,
                    ahAddress: formValues.ahAddress,
                    currency: {
                      ...resolvedCurrency,
                      amount: formValues.amount,
                    },
                  }
                : {}),
            },
        endpoint,
        shouldUsePost ? 'POST' : 'GET',
        shouldUsePost,
      );
    } else {
      return await callSdkFunc(formValues, apiType, resolvedCurrency);
    }
  };

  const submit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output, replaceBigInt, 2));
      openOutputAlert();
      closeErrorAlert();
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openErrorAlert();
        closeOutputAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>Assets 💰</Title>
          </Center>

          <Center>
            <VersionBadge version={VERSION} />
          </Center>

          <Text
            size="xs"
            c={theme.colorScheme === 'light' ? 'gray.7' : 'dark.1'}
            fw={700}
            ta="center"
          >
            Retrieve asset data from compatible parachains, including details
            like asset decimals and registered assets.
          </Text>
        </Box>
        <AssetsQueriesForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Center ref={targetRef}>
        {errorAlertOpened && (
          <ErrorAlert onAlertCloseClick={closeErrorAlert}>
            {error?.message}
          </ErrorAlert>
        )}
      </Center>
      <Center>
        {outputAlertOpened && output && (
          <OutputAlert output={output} onClose={closeOutputAlert} />
        )}
      </Center>
    </Stack>
  );
};
