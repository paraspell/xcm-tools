import {
  Stack,
  Box,
  useMantineColorScheme,
  Center,
  Title,
  Text,
  Badge,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { TPapiTransaction } from '@paraspell/sdk';
import { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import ErrorAlert from '../ErrorAlert';
import type { FormValues } from './AssetClaimForm';
import AssetClaimForm from './AssetClaimForm';
import { getTxFromApi } from '../../utils';
import type { ApiPromise } from '@polkadot/api';
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api';
import { submitTransaction, submitTransactionPapi } from '../../utils';
import type { Signer } from '@polkadot/api/types';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const AssetClaim = () => {
  const { selectedAccount, apiType, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const submit = async (formValues: FormValues) => {
    const { useApi, from, amount, address } = formValues;

    if (!selectedAccount) {
      alert('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);

    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const api = await Sdk.createApiInstanceForNode(from);

    const signer = await getSigner();

    try {
      let tx: Extrinsic | TPapiTransaction;
      if (useApi) {
        tx = await getTxFromApi(
          {
            from,
            address: formValues.address,
            fungible: [
              {
                id: {
                  Concrete: {
                    parents: from === 'Polkadot' || from === 'Kusama' ? 0 : 1,
                    interior: 'Here',
                  },
                },
                fun: { Fungible: amount },
              },
            ],
          },
          api,
          apiType === 'PJS' ? '/asset-claim' : '/asset-claim-papi',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        tx = await Sdk.Builder(api as ApiPromise & PolkadotClient)
          .claimFrom(from)
          .fungible([
            {
              id: {
                Concrete: {
                  parents: from === 'Polkadot' || from === 'Kusama' ? 0 : 1,
                  interior: {
                    Here: null,
                  },
                },
              },
              fun: { Fungible: amount },
            },
          ])
          .account(address)
          .build();
      }

      if (apiType === 'PAPI') {
        await submitTransactionPapi(
          tx as TPapiTransaction,
          signer as PolkadotSigner,
        );
      } else {
        await submitTransaction(
          api as ApiPromise,
          tx as Extrinsic,
          signer as Signer,
          selectedAccount.address,
        );
      }

      alert('Transaction was successful!');
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>Asset Claim 🪙</Title>
          </Center>

          <Center>
            <Badge
              variant="light"
              radius="xl"
              mb="md"
              style={{ textTransform: 'unset' }}
            >
              v{VERSION}
            </Badge>
          </Center>

          <Text
            size="xs"
            c={theme.colorScheme === 'light' ? 'gray.7' : 'dark.1'}
            fw={700}
            ta="center"
          >
            Recover assets that have been trapped in the cross-chain transfers.
          </Text>
        </Box>
        <AssetClaimForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
      </Box>
    </Stack>
  );
};

export default AssetClaim;
