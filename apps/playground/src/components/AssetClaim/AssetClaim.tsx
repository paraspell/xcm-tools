import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import {
  type GeneralBuilder,
  Parents,
  type TPapiApiOrUrl,
  type TPapiTransaction,
} from '@paraspell/sdk';
import type {
  Extrinsic,
  TBuilderOptions,
  TPjsApiOrUrl,
} from '@paraspell/sdk-pjs';
import type { GeneralBuilder as GeneralBuilderPjs } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks';
import { getTxFromApi } from '../../utils';
import { submitTransaction, submitTransactionPapi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { VersionBadge } from '../common/VersionBadge';
import type { FormValues } from './AssetClaimForm';
import AssetClaimForm from './AssetClaimForm';

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
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);
    let notifId = showLoadingNotification(
      'Processing',
      'Waiting to sign transaction',
    );

    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const Builder = Sdk.Builder as ((
      api?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((api?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    const signer = await getSigner();

    let api;
    try {
      let tx: Extrinsic | TPapiTransaction;
      if (useApi) {
        api = await Sdk.createChainClient(from);
        tx = await getTxFromApi(
          {
            from,
            address: formValues.address,
            currency: {
              location: { parents: Parents.ONE, interior: { Here: null } },
              amount,
            },
          },
          api,
          '/asset-claim',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        const builder = Builder({
          abstractDecimals: true,
        });
        tx = await builder
          .claimFrom(from)
          .currency([
            {
              location: { parents: Parents.ONE, interior: { Here: null } },
              amount,
            },
          ])
          .address(address)
          .build();
        api = builder.getApi();
      }

      if (apiType === 'PAPI') {
        await submitTransactionPapi(
          tx as TPapiTransaction,
          signer as PolkadotSigner,
          () => {
            notifId = showLoadingNotification(
              'Processing',
              'Transaction is being processed',
              notifId,
            );
          },
        );
      } else {
        await submitTransaction(
          api as ApiPromise,
          tx as Extrinsic,
          signer as Signer,
          selectedAccount.address,
          () => {
            notifId = showLoadingNotification(
              'Processing',
              'Transaction is being processed',
              notifId,
            );
          },
        );
      }

      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful',
      );
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
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
            <VersionBadge version={VERSION} />
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
      <Center ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
      </Center>
    </Stack>
  );
};

export default AssetClaim;
