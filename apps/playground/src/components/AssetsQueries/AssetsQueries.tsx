import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TAssetInfo, TChain, TChainAssetsInfo } from '@paraspell/sdk';
import { getAssetsObject, replaceBigInt } from '@paraspell/sdk';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks';
import type { TAssetsQuery } from '../../types';
import { determineCurrency, fetchFromApi } from '../../utils';
import { getApiEndpoint } from '../../utils/assets/apiMappings';
import { callSdkFunc } from '../../utils/assets/sdkMappings';
import { showErrorNotification } from '../../utils/notifications';
import { AssetsList } from '../common/AssetsList';
import { AssetsObjectResult } from '../common/AssetsObjectResult';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type { FormValuesResolved } from './AssetsQueriesForm';
import { AssetsQueriesForm } from './AssetsQueriesForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const ASSET_LIST_TITLES: Partial<Record<TAssetsQuery, string>> = {
  NATIVE_ASSETS: 'Native assets',
  OTHER_ASSETS: 'Other assets',
  FEE_ASSETS: 'Fee assets',
  SUPPORTED_ASSETS: 'Supported assets',
};

const getAssetsObjectResult = (
  formValues: FormValuesResolved,
): Promise<TChainAssetsInfo> => {
  const { useApi, chain, destination } = formValues;
  const payload = { origin: chain, destination };
  return useApi
    ? fetchFromApi<typeof payload, TChainAssetsInfo>(
        payload,
        getApiEndpoint('ASSETS_OBJECT', chain),
      )
    : Promise.resolve(getAssetsObject(chain));
};

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
  const [assetsView, setAssetsView] = useState<{
    title: string;
    assets: TAssetInfo[];
  }>();
  const [assetsObjectView, setAssetsObjectView] = useState<{
    chain: TChain;
    info: TChainAssetsInfo;
  }>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const getQueryResult = async (
    formValues: FormValuesResolved,
  ): Promise<unknown> => {
    const { useApi, chain, destination, func, address, currency } = formValues;

    const postCalls = new Set<TAssetsQuery>([
      'ASSET_BALANCE',
      'ASSET_LOCATION',
      'ASSET_INFO',
      'ASSET_RESERVE_CHAIN',
      'EXISTENTIAL_DEPOSIT',
      'SUPPORTED_DESTINATIONS',
    ]);

    const hasCurrency = currency.isCustomCurrency
      ? currency.customCurrency.length > 0
      : !!currency.currencyOptionId;

    const resolvedCurrency = hasCurrency
      ? determineCurrency(currency)
      : undefined;

    if (useApi) {
      const endpoint = getApiEndpoint(func, formValues.chain);

      if (func === 'CONVERT_SS58') {
        return fetchFromApi({ address, chain }, endpoint, 'GET', false);
      }

      const shouldUsePost = postCalls.has(func);

      return fetchFromApi(
        shouldUsePost
          ? {
              chain,
              destination,
              address,
              ...(resolvedCurrency ? { currency: resolvedCurrency } : {}),
            }
          : {
              origin: chain,
              destination,
            },
        endpoint,
        shouldUsePost ? 'POST' : 'GET',
        shouldUsePost,
      );
    } else {
      return await callSdkFunc(formValues, apiType, resolvedCurrency);
    }
  };

  const submit = async (formValues: FormValuesResolved) => {
    setLoading(true);

    try {
      if (formValues.func === 'ASSETS_OBJECT') {
        setAssetsObjectView({
          chain: formValues.chain,
          info: await getAssetsObjectResult(formValues),
        });
        setAssetsView(undefined);
        setOutput(undefined);
      } else {
        const result = await getQueryResult(formValues);
        const listTitle = ASSET_LIST_TITLES[formValues.func];

        if (listTitle && Array.isArray(result)) {
          setAssetsView({ title: listTitle, assets: result as TAssetInfo[] });
          setAssetsObjectView(undefined);
          setOutput(undefined);
        } else {
          setAssetsView(undefined);
          setAssetsObjectView(undefined);
          setOutput(JSON.stringify(result, replaceBigInt, 2));
        }
      }
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
        setAssetsView(undefined);
        setAssetsObjectView(undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValuesResolved) => void submit(formValues);

  const handleCloseOutput = () => {
    closeOutputAlert();
    setAssetsView(undefined);
    setAssetsObjectView(undefined);
  };

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
        {outputAlertOpened && assetsObjectView && (
          <AssetsObjectResult
            chain={assetsObjectView.chain}
            info={assetsObjectView.info}
            onClose={handleCloseOutput}
          />
        )}
        {outputAlertOpened && assetsView && (
          <AssetsList
            title={assetsView.title}
            assets={assetsView.assets}
            onClose={handleCloseOutput}
          />
        )}
        {outputAlertOpened && !assetsView && !assetsObjectView && output && (
          <OutputAlert output={output} onClose={handleCloseOutput} />
        )}
      </Center>
    </Stack>
  );
};
