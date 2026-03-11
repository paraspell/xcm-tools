/* eslint-disable no-console */
import {
  Box,
  Center,
  Container,
  Image,
  Stack,
  Text,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TBuilderConfig, TUrl } from '@paraspell/sdk';
import { replaceBigInt } from '@paraspell/sdk';
import axios, { AxiosError } from 'axios';
import type { PolkadotSigner } from 'polkadot-api';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import type { TRouterFormValuesTransformed } from '../../components/XcmRouter/XcmRouterForm';
import { XcmRouterForm } from '../../components/XcmRouter/XcmRouterForm';
import { API_URL } from '../../constants';
import { useWallet } from '../../hooks';
import type {
  TApiTransaction,
  TProgressSwapEvent,
  TRouterSubmitType,
} from '../../types';
import {
  createBuilderOptions,
  fetchFromApi,
  setupBaseRouterBuilder,
  submitApiTransactions,
  submitSdkTransactions,
} from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { TransferStepper } from '../common/TransferStepper';
import { VersionBadge } from '../common/VersionBadge';

const VERSION = import.meta.env.VITE_XCM_ROUTER_VERSION as string;

export const XcmRouter = () => {
  const { selectedAccount, accounts, changeAccount, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [output, setOutput] = useState<string>();

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TProgressSwapEvent>();

  const [showStepper, setShowStepper] = useState(false);

  const [runConfetti, setRunConfetti] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  useEffect(() => {
    if (showStepper) {
      scrollIntoView();
    }
  }, [showStepper, scrollIntoView]);

  const onStatusChange = (status: TProgressSwapEvent) => {
    setProgressInfo(status);
  };

  const submitUsingRouterModule = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    signer: PolkadotSigner,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    const { evmSigner } = formValues;

    const builder = setupBaseRouterBuilder(
      builderOptions,
      formValues,
      senderAddress,
    );

    const txContexts = await builder.buildTransactions();

    await submitSdkTransactions({
      txContexts,
      signer,
      evmSigner,
      onStatusChange,
    });
  };

  const submitUsingApi = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    signer: PolkadotSigner,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    try {
      const response = await axios.post<TApiTransaction[]>(
        `${API_URL}/router`,
        {
          ...formValues,
          senderAddress,
          options: builderOptions,
        },
        {
          timeout: 120000,
        },
      );

      const transactions = response.data;

      await submitApiTransactions({
        transactions,
        signer,
        evmSigner: formValues.evmSigner,
        onStatusChange,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        showErrorNotification('Error while fetching data.');
        console.error(error);
        let errorMessage = 'Error while fetching data.';
        if (error.response === undefined) {
          errorMessage += ' Make sure the API is running.';
        } else {
          // Append the server-provided error message if available
          const serverMessage =
            error.response.data &&
            (error.response.data as { message: string }).message
              ? ' Server response: ' +
                (error.response.data as { message: string }).message
              : '';
          errorMessage += serverMessage;
        }
        throw new Error(errorMessage, { cause: error });
      } else if (error instanceof Error) {
        console.error(error);
        throw new Error(error.message, { cause: error });
      }
    }
  };

  const submitGetXcmFee = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    const { useApi } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...formValues,
            senderAddress,
            options: builderOptions,
          },
          '/router/xcm-fees',
          'POST',
          true,
        );
      } else {
        const builder = setupBaseRouterBuilder(
          builderOptions,
          formValues,
          senderAddress,
        );
        result = await builder.getXcmFees();
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'XCM fee calculated');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGetTransferableAmount = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    const { useApi } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...formValues,
            senderAddress,
            options: builderOptions,
          },
          '/router/transferable-amount',
          'POST',
          true,
        );
      } else {
        const builder = setupBaseRouterBuilder(
          builderOptions,
          formValues,
          senderAddress,
        );
        result = await builder.getTransferableAmount();
      }

      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(
        undefined,
        'Success',
        'Transferable amount calculated',
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGetMinTransferableAmount = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    const { useApi } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...formValues,
            senderAddress,
            options: builderOptions,
          },
          '/router/min-transferable-amount',
          'POST',
          true,
        );
      } else {
        const builder = setupBaseRouterBuilder(
          builderOptions,
          formValues,
          senderAddress,
        );
        result = await builder.getMinTransferableAmount();
      }

      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(
        undefined,
        'Success',
        'Min transferable amount calculated',
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitDryRun = async (
    formValues: TRouterFormValuesTransformed,
    senderAddress: string,
    builderOptions: TBuilderConfig<TUrl>,
  ) => {
    const { useApi } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...formValues,
            senderAddress,
            options: builderOptions,
          },
          '/router/dry-run',
          'POST',
          true,
        );
      } else {
        const builder = setupBaseRouterBuilder(
          builderOptions,
          formValues,
          senderAddress,
        );
        result = await builder.dryRun();
      }

      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'Dry run completed');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGetBestAmountOut = async (
    formValues: TRouterFormValuesTransformed,
    builderOptions: TBuilderConfig<TUrl>,
    senderAddress: string,
  ) => {
    const { useApi } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...formValues,
            options: builderOptions,
          },
          '/router/best-amount-out',
          'POST',
          true,
        );
      } else {
        const builder = setupBaseRouterBuilder(
          builderOptions,
          formValues,
          senderAddress,
        );

        result = await builder.getBestAmountOut();
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'Best amount fetched');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (
    formValues: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => {
    const { useApi } = formValues;
    if (!selectedAccount) {
      if (accounts.length > 0) {
        await changeAccount();
        return;
      }
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    const builderOptions = createBuilderOptions(formValues);

    closeOutputAlert();

    if (submitType === 'getBestAmountOut') {
      await submitGetBestAmountOut(
        formValues,
        builderOptions,
        selectedAccount.address,
      );
      return;
    }

    if (submitType === 'getMinTransferableAmount') {
      await submitGetMinTransferableAmount(
        formValues,
        selectedAccount.address,
        builderOptions,
      );
      return;
    }

    if (submitType === 'getTransferableAmount') {
      await submitGetTransferableAmount(
        formValues,
        selectedAccount.address,
        builderOptions,
      );
      return;
    }

    if (submitType === 'getXcmFee') {
      await submitGetXcmFee(
        formValues,
        selectedAccount.address,
        builderOptions,
      );
      return;
    }

    if (submitType === 'dryRun') {
      await submitDryRun(formValues, selectedAccount.address, builderOptions);
      return;
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    const signer = await getSigner();

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        args.length > 1 &&
        typeof args[2] === 'string' &&
        args[2].includes('ExtrinsicStatus::')
      ) {
        const error = new Error(args[2]);
        showErrorNotification(error.message, notifId);
        setError(error);
        openAlert();
        setShowStepper(false);
        setLoading(false);
      } else {
        originalError(...args);
        setProgressInfo(undefined);
      }
    };

    try {
      setShowStepper(true);
      setProgressInfo(undefined);
      if (useApi) {
        await submitUsingApi(
          formValues,
          selectedAccount.address,
          signer as PolkadotSigner,
          builderOptions,
        );
      } else {
        await submitUsingRouterModule(
          formValues,
          selectedAccount.address,
          signer as PolkadotSigner,
          builderOptions,
        );
      }
      setRunConfetti(true);
      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful',
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
      setShowStepper(false);
    }
    setLoading(false);
  };

  const onSubmit = (
    formValues: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void submit(formValues, submitType);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onConfettiComplete = () => {
    setRunConfetti(false);
  };

  const theme = useMantineColorScheme();

  const width = window.innerWidth;
  const height = document.body.scrollHeight;

  const onOutputAlertCloseClick = () => closeOutputAlert();

  return (
    <Container px="xl" pb="128">
      <Stack gap="xl">
        <Stack w="100%" maw={480} mx="auto" gap="0">
          <Box px="xl" pb="xl">
            <Center>
              <Image src="/spellrouter.png" fit="contain" w={220} p={8} />
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
              Easily exchange and transfer cross-chain assets between two
              parachains using XCM.
            </Text>
          </Box>
          <XcmRouterForm onSubmit={onSubmit} loading={loading} />
        </Stack>
        <Box ref={targetRef}>
          {showStepper && (
            <Center
              mt={
                progressInfo?.type === 'SELECTING_EXCHANGE' ? undefined : 'md'
              }
            >
              <TransferStepper progressInfo={progressInfo} />
            </Center>
          )}
          {alertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error?.message.split('\n\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </ErrorAlert>
          )}
        </Box>
        <Box>
          {outputAlertOpened && output && (
            <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
          )}
        </Box>
      </Stack>
      <Confetti
        run={runConfetti}
        recycle={false}
        numberOfPieces={500}
        tweenDuration={10000}
        onConfettiComplete={onConfettiComplete}
        width={width}
        height={height}
      />
    </Container>
  );
};
