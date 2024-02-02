import { Title, Stack, Container, Box, Loader, Group, Center } from '@mantine/core';
import {
  transfer,
  TransactionType,
  TTxProgressInfo,
  TExchangeNode,
  TransactionStatus,
} from '@paraspell/xcm-router';
import { useWallet } from '../providers/WalletProvider';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import RouterTransferForm, { FormValues } from '../components/RouterTransferForm';
import TransferStepper from '../components/TransferStepper';
import Confetti from 'react-confetti';
import { Signer } from '@polkadot/api/types';
import axios, { AxiosError } from 'axios';
import { createApiInstanceForNode } from '@paraspell/sdk';
import { buildTx, submitTransaction } from '../utils';
import ErrorAlert from '../components/ErrorAlert';

const RouterTransferPage = () => {
  const { selectedAccount } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] = useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TTxProgressInfo>();

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

  const onStatusChange = (status: TTxProgressInfo) => {
    setProgressInfo(status);
  };

  const submitUsingRouterModule = async (
    formValues: FormValues,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const { transactionType } = formValues;
    await transfer({
      ...formValues,
      injectorAddress: injectorAddress,
      signer: signer,
      type: TransactionType[transactionType],
      exchange: exchange ?? undefined,
      onStatusChange,
    });
  };

  const submitUsingApi = async (
    formValues: FormValues,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const { from } = formValues;

    try {
      const response = await axios.get('http://localhost:3001/router', {
        timeout: 120000,
        params: {
          ...formValues,
          exchange: exchange ?? undefined,
          injectorAddress,
        },
      });

      const {
        txs: [toExchange, swap, toDest],
        exchangeNode,
      } = await response.data;

      const originApi = await createApiInstanceForNode(from);
      const swapApi = await createApiInstanceForNode(exchangeNode);
      onStatusChange({
        type: TransactionType.TO_EXCHANGE,
        status: TransactionStatus.IN_PROGRESS,
      });
      await submitTransaction(originApi, buildTx(originApi, toExchange), signer, injectorAddress);
      onStatusChange({
        type: TransactionType.SWAP,
        status: TransactionStatus.IN_PROGRESS,
      });
      await submitTransaction(swapApi, buildTx(swapApi, swap), signer, injectorAddress);
      onStatusChange({
        type: TransactionType.TO_DESTINATION,
        status: TransactionStatus.IN_PROGRESS,
      });
      await submitTransaction(swapApi, buildTx(swapApi, toDest), signer, injectorAddress);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error);
        let errorMessage = 'Error while fetching data.';
        if (error.response === undefined) {
          errorMessage += ' Make sure the API is running.';
        } else {
          // Append the server-provided error message if available
          const serverMessage =
            error.response.data && error.response.data.message
              ? ' Server response: ' + error.response.data.message
              : '';
          errorMessage += serverMessage;
        }
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        console.error(error);
        throw new Error(error.message);
      }
    }
  };

  const onSubmit = async (formValues: FormValues) => {
    const { useApi } = formValues;
    if (!selectedAccount) {
      alert('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    const exchange = formValues.exchange === 'Auto select' ? undefined : formValues.exchange;

    const originalError = console.error;
    console.error = (...args) => {
      if (args[2].includes('ExtrinsicStatus::')) {
        setError(new Error(args[2]));
        openAlert();
        setShowStepper(false);
        setLoading(false);
      } else {
        originalError(...args);
      }
    };

    try {
      setShowStepper(true);
      setProgressInfo(undefined);
      if (useApi) {
        await submitUsingApi(formValues, exchange, selectedAccount.address, injector.signer);
      } else {
        await submitUsingRouterModule(
          formValues,
          exchange,
          selectedAccount.address,
          injector.signer,
        );
      }
      setRunConfetti(true);
      alert('Transaction was successful!');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onConfettiComplete = () => {
    setRunConfetti(false);
  };

  return (
    <Container p="xl">
      <Stack gap="xl">
        <Stack w="100%" maw={400} mx="auto" gap="lg">
          <Title order={3}>New SpellRouter transfer</Title>
          <RouterTransferForm onSubmit={onSubmit} loading={loading} />
        </Stack>
        <Box ref={targetRef}>
          {progressInfo?.isAutoSelectingExchange && (
            <Center>
              <Group mt="md">
                <Loader />
                <Title order={4}>Searching for best exchange rate</Title>
              </Group>
            </Center>
          )}
          {showStepper && !progressInfo?.isAutoSelectingExchange && (
            <Box mt="md">
              <TransferStepper progressInfo={progressInfo} />
            </Box>
          )}
          {alertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>{error?.message}</ErrorAlert>
          )}
        </Box>
      </Stack>
      <Confetti
        run={runConfetti}
        recycle={false}
        numberOfPieces={500}
        tweenDuration={10000}
        onConfettiComplete={onConfettiComplete}
      />
    </Container>
  );
};

export default RouterTransferPage;
