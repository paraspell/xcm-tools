import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TPapiTransaction } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks/useWallet';
import { getTxFromApi } from '../../utils';
import { submitTransaction, submitTransactionPapi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import type { FormValues } from './IdentityForm';
import IdentityForm from './IdentityForm';

const Identity = () => {
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
    const { useApi, from, xcmFee, regIndex, maxRegistrarFee, identity } =
      formValues;

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

    const signer = await getSigner();

    const api = await Sdk.createApiInstanceForNode(from);
    try {
      let tx: Extrinsic | TPapiTransaction;
      if (useApi) {
        tx = await getTxFromApi(
          formValues,
          api,
          '/identity',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        tx = await Sdk.createXcmIdentityCall({
          from,
          xcmFee: xcmFee ? BigInt(xcmFee) : undefined,
          identity,
          regIndex,
          maxRegistrarFee: BigInt(maxRegistrarFee),
        });
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
      if (api) {
        if ('disconnect' in api) await api.disconnect();
        else api.destroy();
      }
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
            <Title order={2}>Create Identity call 🪪</Title>
          </Center>

          <Text
            size="xs"
            c={theme.colorScheme === 'light' ? 'gray.7' : 'dark.1'}
            fw={700}
            ta="center"
          >
            Create a new identity call to set or request identity information
          </Text>
        </Box>
        <IdentityForm onSubmit={onSubmit} loading={loading} />
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

export default Identity;
