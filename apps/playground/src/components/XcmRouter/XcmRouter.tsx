/* eslint-disable no-console */
import {
  Box,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type {
  TAsset,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk-pjs';
import {
  getOtherAssets,
  isForeignAsset,
  type TCurrencyInput,
} from '@paraspell/sdk-pjs';
import type {
  TExchangeNode,
  TRouterEvent,
  TTransaction,
} from '@paraspell/xcm-router';
import { createDexNodeInstance, RouterBuilder } from '@paraspell/xcm-router';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import { web3FromAddress } from '@polkadot/extension-dapp';
import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import type { TRouterFormValuesTransformed } from '../../components/XcmRouter/XcmRouterForm';
import { XcmRouterForm } from '../../components/XcmRouter/XcmRouterForm';
import { API_URL } from '../../consts';
import { useWallet } from '../../hooks/useWallet';
import type { TRouterSubmitType } from '../../types';
import { fetchFromApi, replaceBigInt, submitTransaction } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import { TransferStepper } from './TransferStepper';

const VERSION = import.meta.env.VITE_XCM_ROUTER_VERSION as string;

export const XcmRouter = () => {
  const { selectedAccount } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [output, setOutput] = useState<string>();

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TRouterEvent>();

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

  const onStatusChange = (status: TRouterEvent) => {
    setProgressInfo(status);
  };

  const determineCurrency = (
    node: TNodeDotKsmWithRelayChains | undefined,
    asset: TAsset,
    isAutoExchange = false,
  ): TCurrencyInput => {
    if (!isForeignAsset(asset)) {
      return { symbol: asset.symbol };
    }

    if (asset.assetId === undefined && asset.multiLocation === undefined) {
      return { symbol: asset.symbol };
    }

    if (ethers.isAddress(asset.assetId)) {
      return { symbol: asset.symbol };
    }

    if (isAutoExchange) {
      return asset.multiLocation
        ? { multilocation: asset.multiLocation as TMultiLocation }
        : { symbol: asset.symbol };
    }

    const hasDuplicateIds =
      node &&
      getOtherAssets(node).filter(
        (other) =>
          other.assetId !== undefined && other.assetId === asset.assetId,
      ).length > 1;

    if (hasDuplicateIds) {
      return { symbol: asset.symbol };
    }

    if (asset.assetId) return { id: asset.assetId };
    if (asset.multiLocation)
      return { multilocation: asset.multiLocation as TMultiLocation };

    throw new Error('Invalid currency input');
  };

  const submitUsingRouterModule = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const {
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress,
      slippagePct,
      evmSigner,
    } = formValues;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(
        determineCurrency(
          from
            ? from
            : exchange
              ? createDexNodeInstance(exchange).node
              : undefined,
          currencyFrom,
        ),
      )
      .currencyTo(
        determineCurrency(
          exchange ? createDexNodeInstance(exchange).node : undefined,
          currencyTo,
          exchange === undefined,
        ),
      )
      .amount(amount)
      .senderAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .evmSenderAddress(evmInjectorAddress)
      .signer(signer)
      .evmSigner(evmSigner)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();
  };

  const submitUsingApi = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const { currencyFrom, currencyTo } = formValues;
    try {
      const response = await axios.post(
        `${API_URL}/router`,
        {
          ...formValues,
          currencyFrom: { symbol: currencyFrom.symbol },
          currencyTo: { symbol: currencyTo.symbol },
          exchange: exchange ?? undefined,
          injectorAddress,
        },
        {
          timeout: 120000,
        },
      );

      const transactions = (await response.data) as (TTransaction & {
        wsProviders: string[];
      })[];

      for (const [
        index,
        { node, type, wsProviders, tx },
      ] of transactions.entries()) {
        onStatusChange({
          node,
          type,
          currentStep: index,
          routerPlan: transactions,
        });

        const api = await ApiPromise.create({
          provider: new WsProvider(wsProviders),
        });

        if (type === 'TRANSFER' && index === 0) {
          // When submitting to exchange, prioritize the evmSigner if available
          await submitTransaction(
            api,
            api.tx(tx),
            formValues.evmSigner ?? signer,
            formValues.evmInjectorAddress ?? injectorAddress,
          );
        } else {
          await submitTransaction(api, api.tx(tx), signer, injectorAddress);
        }
      }

      onStatusChange({
        type: 'COMPLETED',
        node: transactions[transactions.length - 1].node,
        currentStep: transactions.length - 1,
        routerPlan: transactions,
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
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        console.error(error);
        throw new Error(error.message);
      }
    }
  };

  const submitGetBestAmountOut = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | undefined,
  ) => {
    const { useApi, from, to, currencyFrom, currencyTo } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(formValues, '/dry-run', 'POST', true);
      } else {
        result = await RouterBuilder()
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(
            determineCurrency(
              from
                ? from
                : exchange
                  ? createDexNodeInstance(exchange).node
                  : undefined,
              currencyFrom,
            ),
          )
          .currencyTo(
            determineCurrency(
              exchange ? createDexNodeInstance(exchange).node : undefined,
              currencyTo,
              exchange === undefined,
            ),
          )
          .amount(formValues.amount)
          .getBestAmountOut();
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'Best amount fetched');
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
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    closeOutputAlert();

    if (submitType === 'getBestAmountOut') {
      await submitGetBestAmountOut(formValues, undefined);
      return;
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    const injector = await web3FromAddress(selectedAccount.address);

    const exchange =
      formValues.exchange === 'Auto select' ? undefined : formValues.exchange;

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
          exchange,
          selectedAccount.address,
          injector.signer,
        );
      } else {
        await submitUsingRouterModule(
          formValues,
          exchange,
          selectedAccount.address,
          injector.signer,
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
        <Stack w="100%" maw={460} mx="auto" gap="0">
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
          {progressInfo && progressInfo?.type === 'SELECTING_EXCHANGE' && (
            <Center>
              <Group mt="md">
                <Loader />
                <Title order={4}>Searching for best exchange rate</Title>
              </Group>
            </Center>
          )}
          {showStepper && progressInfo?.type !== 'SELECTING_EXCHANGE' && (
            <Center mt="md">
              <TransferStepper progressInfo={progressInfo} />
            </Center>
          )}
          {alertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error?.message
                .split('\n\n')
                .map((line, index) => <p key={index}>{line}</p>)}
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
