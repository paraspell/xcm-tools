import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TPallet } from '@paraspell/sdk';
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
} from '@paraspell/sdk';
import { useEffect, useState } from 'react';

import PalletQueryStateProvider from '../../providers/PalletQueryState/PalletQueryStateProvider';
import { fetchFromApi } from '../../utils';
import { showErrorNotification } from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type { FormValues } from './PalletsQueriesForm';
import PalletsQueriesForm from './PalletsQueriesForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const PalletsQueries = () => {
  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);
  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

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

  const submitUsingSdk = ({ func, chain, pallet }: FormValues) => {
    switch (func) {
      case 'ALL_PALLETS':
        return getSupportedPallets(chain);
      case 'DEFAULT_PALLET':
        return getDefaultPallet(chain);
      case 'PALLET_INDEX':
        return getPalletIndex(chain, pallet as TPallet);
      case 'NATIVE_ASSETS_PALLET':
        return getNativeAssetsPallet(chain);
      case 'OTHER_ASSETS_PALLETS':
        return getOtherAssetsPallets(chain);
    }
  };

  const getEndpoint = ({ func, chain }: FormValues) => {
    switch (func) {
      case 'ALL_PALLETS':
        return `${chain}`;
      case 'DEFAULT_PALLET':
        return `${chain}/default`;
      case 'PALLET_INDEX':
        return `${chain}/index`;
      case 'NATIVE_ASSETS_PALLET':
        return `${chain}/native-assets`;
      case 'OTHER_ASSETS_PALLETS':
        return `${chain}/other-assets`;
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi } = formValues;
    if (useApi) {
      return fetchFromApi(formValues, `/pallets/${getEndpoint(formValues)}`);
    } else {
      return submitUsingSdk(formValues);
    }
  };

  const submit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output ?? null, null, 2));
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

  const onErrorAlertCloseClick = () => {
    closeErrorAlert();
  };

  const onOutputAlertCloseClick = () => {
    closeOutputAlert();
  };

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>Pallets 📦</Title>
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
            Query the supported pallets and the default pallet for transfers for
            a given chain.
          </Text>
        </Box>
        <PalletQueryStateProvider>
          <PalletsQueriesForm onSubmit={onSubmit} loading={loading} />
        </PalletQueryStateProvider>
      </Stack>
      <Center ref={targetRef}>
        {errorAlertOpened && (
          <ErrorAlert onAlertCloseClick={onErrorAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
      </Center>
      <Center>
        {outputAlertOpened && output && (
          <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
        )}
      </Center>
    </Stack>
  );
};

export default PalletsQueries;
