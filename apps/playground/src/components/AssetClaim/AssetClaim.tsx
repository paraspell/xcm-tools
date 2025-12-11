import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TBuilderOptions, TLocation } from '@paraspell/sdk';
import {
  type GeneralBuilder,
  Parents,
  type TPapiApiOrUrl,
  type TPapiTransaction,
} from '@paraspell/sdk';
import type { Extrinsic, TPjsApiOrUrl } from '@paraspell/sdk-pjs';
import type { GeneralBuilder as GeneralBuilderPjs } from '@paraspell/sdk-pjs';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks';
import {
  createBuilderOptions,
  getTxFromApi,
  resolveSenderAddress,
  submitTx,
} from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type { TAssetClaimFormValues } from './AssetClaimForm';
import AssetClaimForm from './AssetClaimForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const AssetClaim = () => {
  const { selectedAccount, apiType, getSigner } = useWallet();

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

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

  const submit = async (formValues: TAssetClaimFormValues) => {
    const {
      useApi,
      from,
      amount,
      address,
      xcmVersion,
      pallet,
      method,
      localAccount,
    } = formValues;

    const senderAddress = resolveSenderAddress(localAccount, selectedAccount);

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

    const builderOptions = createBuilderOptions(formValues);

    const location: TLocation = {
      parents: Parents.ONE,
      interior: { Here: null },
    };

    let api;
    try {
      let tx: Extrinsic | TPapiTransaction | undefined;
      let hash: string | undefined;

      if (useApi) {
        api = await Sdk.createChainClient(from);
        tx = await getTxFromApi(
          {
            from,
            address: formValues.address,
            senderAddress,
            currency: {
              location,
              amount,
            },
            options: builderOptions,
          },
          api,
          '/asset-claim',
          senderAddress,
          apiType,
          'POST',
          true,
        );
      } else {
        let builder = Builder(builderOptions);

        if (xcmVersion) {
          builder = builder.xcmVersion(xcmVersion);
        }

        if (pallet && method) {
          builder = builder.customPallet(pallet, method);
        }

        const assetClaimBuilder = builder
          .claimFrom(from)
          .currency([
            {
              location,
              amount,
            },
          ])
          .address(address)
          .senderAddress(senderAddress);

        if (localAccount) hash = await assetClaimBuilder.signAndSubmit();
        else tx = await assetClaimBuilder.build();

        api = assetClaimBuilder.getApi();
      }

      if (tx) {
        await submitTx(apiType, api, tx, signer, senderAddress, () => {
          notifId = showLoadingNotification(
            'Processing',
            'Transaction is being processed',
            notifId,
          );
        });
        showSuccessNotification(
          notifId ?? '',
          'Success',
          'Transaction was successful',
        );
      } else if (hash) {
        setOutput(`'Transaction was submitted. Hash: ${hash}'`);
        openOutputAlert();
        showSuccessNotification(
          notifId ?? '',
          'Success',
          `Transaction was submitted`,
        );
      } else {
        throw Error('No transaction or hash to submit');
      }
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

  const onSubmit = (formValues: TAssetClaimFormValues) =>
    void submit(formValues);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onOutputAlertCloseClick = () => closeOutputAlert();

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
      <Center>
        {outputAlertOpened && output && (
          <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
        )}
      </Center>
    </Stack>
  );
};

export default AssetClaim;
