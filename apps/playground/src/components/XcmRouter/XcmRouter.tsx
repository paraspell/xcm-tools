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
import type { TSubstrateChain } from '@paraspell/sdk';
import {
  getOtherAssets,
  isForeignAsset,
  replaceBigInt,
  type TAssetInfo,
  type TCurrencyInput,
} from '@paraspell/sdk';
import type {
  TExchangeInput,
  TRouterBuilderOptions,
  TRouterEvent,
  TTransaction,
} from '@paraspell/xcm-router';
import { createExchangeInstance, RouterBuilder } from '@paraspell/xcm-router';
import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Binary, createClient, type PolkadotSigner } from 'polkadot-api';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { useEffect, useMemo, useState } from 'react';
import Confetti from 'react-confetti';

import type { TRouterFormValuesTransformed } from '../../components/XcmRouter/XcmRouterForm';
import { XcmRouterForm } from '../../components/XcmRouter/XcmRouterForm';
import { API_URL } from '../../consts';
import { useAdvancedRouterOptionsQuery, useWallet } from '../../hooks';
import type { TRouterSubmitType } from '../../types';
import { fetchFromApi, submitTransactionPapi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import type { AdvancedRouterOptions } from '../AdvancedOptionsAccordion/AdvancedOptionsAccordion';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import { TransferStepper } from './TransferStepper';

const VERSION = import.meta.env.VITE_XCM_ROUTER_VERSION as string;

export const XcmRouter = () => {
  const { selectedAccount, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [advancedRouterOptionsQuery, setAdvancedRouterOptionsQuery] =
    useAdvancedRouterOptionsQuery();

  const builderOptions = useMemo<TRouterBuilderOptions>(() => {
    const apiOverrides =
      advancedRouterOptionsQuery.customEndpoints &&
      advancedRouterOptionsQuery.customEndpoints.length > 0
        ? advancedRouterOptionsQuery.customEndpoints.reduce(
            (acc, ep) => ({
              ...acc,
              [ep.chain]: ep.endpoints?.map((e) => e.value) ?? [],
            }),
            {},
          )
        : undefined;

    return {
      abstractDecimals: advancedRouterOptionsQuery.abstractDecimals ?? true,
      development: advancedRouterOptionsQuery.isDevelopment ?? false,
      apiOverrides,
    };
  }, [
    advancedRouterOptionsQuery.abstractDecimals,
    advancedRouterOptionsQuery.isDevelopment,
    advancedRouterOptionsQuery.customEndpoints,
  ]);

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
    chain: TSubstrateChain | undefined,
    asset: TAssetInfo,
    isAutoExchange = false,
  ): TCurrencyInput => {
    if (asset.location) return { location: asset.location };

    if (!isForeignAsset(asset)) {
      return { symbol: asset.symbol };
    }

    if (asset.assetId === undefined && asset.location === undefined) {
      return { symbol: asset.symbol };
    }

    if (ethers.isAddress(asset.assetId)) {
      return { symbol: asset.symbol };
    }

    if (isAutoExchange) {
      return asset.location
        ? { location: asset.location }
        : { symbol: asset.symbol };
    }

    const hasDuplicateIds =
      chain &&
      getOtherAssets(chain).filter(
        (other) =>
          other.assetId !== undefined && other.assetId === asset.assetId,
      ).length > 1;

    if (hasDuplicateIds) {
      return { symbol: asset.symbol };
    }

    if (asset.assetId) return { id: asset.assetId };

    throw new Error('Invalid currency input');
  };

  const resolveCurrencyInputs = (params: {
    from?: TSubstrateChain;
    exchange: TExchangeInput;
    currencyFrom: TAssetInfo;
    currencyTo: TAssetInfo;
  }) => {
    const { from, exchange, currencyFrom, currencyTo } = params;

    const exchangeChain =
      exchange && !Array.isArray(exchange)
        ? createExchangeInstance(exchange).chain
        : undefined;

    const fromChain = from ?? exchangeChain;

    const isAutoExchange = exchange === undefined || Array.isArray(exchange);

    return {
      currencyFromInput: determineCurrency(fromChain, currencyFrom),
      currencyToInput: determineCurrency(
        exchangeChain,
        currencyTo,
        isAutoExchange,
      ),
    };
  };

  const submitUsingRouterModule = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeInput,
    senderAddress: string,
    signer: PolkadotSigner,
  ) => {
    const {
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
      evmSigner,
    } = formValues;

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    await RouterBuilder(builderOptions)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFromInput)
      .currencyTo(currencyToInput)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .evmSenderAddress(evmSenderAddress)
      .signer(signer)
      .evmSigner(evmSigner)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();
  };

  const submitUsingApi = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeInput,
    senderAddress: string,
    signer: PolkadotSigner,
  ) => {
    const { currencyFrom, currencyTo, from } = formValues;

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    const {
      isDevelopment,
      abstractDecimals,
      customEndpoints,
      ...safeFormValues
    } = formValues;

    try {
      const response = await axios.post(
        `${API_URL}/router`,
        {
          ...safeFormValues,
          currencyFrom: currencyFromInput,
          currencyTo: currencyToInput,
          exchange,
          senderAddress,
          options: builderOptions,
        },
        {
          timeout: 120000,
        },
      );

      const transactions = (await response.data) as (TTransaction & {
        wsProviders: string[];
        tx: string;
      })[];

      for (const [
        index,
        { chain, type, wsProviders, tx },
      ] of transactions.entries()) {
        onStatusChange({
          chain,
          type,
          currentStep: index,
          routerPlan: transactions,
        });

        const api = createClient(
          withPolkadotSdkCompat(getWsProvider(wsProviders)),
        );

        await submitTransactionPapi(
          await api.getUnsafeApi().txFromCallData(Binary.fromHex(tx)),
          // When submitting to exchange, prioritize the evmSigner if available
          type === 'TRANSFER' && index === 0
            ? signer
            : (formValues.evmSigner ?? signer),
        );
      }

      onStatusChange({
        type: 'COMPLETED',
        chain: transactions[transactions.length - 1].chain,
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

  const submitGetXcmFee = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeInput,
    senderAddress: string,
  ) => {
    const {
      useApi,
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
    } = formValues;

    setLoading(true);

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    const {
      isDevelopment,
      abstractDecimals,
      customEndpoints,
      ...safeFormValues
    } = formValues;

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...safeFormValues,
            currencyFrom: currencyFromInput,
            currencyTo: currencyToInput,
            exchange,
            senderAddress: selectedAccount?.address,
            options: builderOptions,
          },
          '/router/xcm-fees',
          'POST',
          true,
        );
      } else {
        result = await RouterBuilder(builderOptions)
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(currencyFromInput)
          .currencyTo(currencyToInput)
          .amount(amount)
          .senderAddress(senderAddress)
          .recipientAddress(recipientAddress)
          .evmSenderAddress(evmSenderAddress)
          .slippagePct(slippagePct)
          .onStatusChange(onStatusChange)
          .getXcmFees();
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
    exchange: TExchangeInput,
    senderAddress: string,
  ) => {
    const {
      useApi,
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
    } = formValues;

    setLoading(true);

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    const {
      isDevelopment,
      abstractDecimals,
      customEndpoints,
      ...safeFormValues
    } = formValues;

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          {
            ...safeFormValues,
            currencyFrom: currencyFromInput,
            currencyTo: currencyToInput,
            exchange,
            senderAddress,
            options: builderOptions,
          },
          '/router/transferable-amount',
          'POST',
          true,
        );
      } else {
        result = await RouterBuilder(builderOptions)
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(currencyFromInput)
          .currencyTo(currencyToInput)
          .amount(amount)
          .senderAddress(senderAddress)
          .recipientAddress(recipientAddress)
          .evmSenderAddress(evmSenderAddress)
          .slippagePct(slippagePct)
          .getTransferableAmount();
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
    exchange: TExchangeInput,
    senderAddress: string,
  ) => {
    const {
      useApi,
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
    } = formValues;

    setLoading(true);

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    try {
      let result;
      if (useApi) {
        const {
          isDevelopment,
          abstractDecimals,
          customEndpoints,
          ...safeFormValues
        } = formValues;
        result = await fetchFromApi(
          {
            ...safeFormValues,
            currencyFrom: currencyFromInput,
            currencyTo: currencyToInput,
            exchange,
            senderAddress,
            options: builderOptions,
          },
          '/router/min-transferable-amount',
          'POST',
          true,
        );
      } else {
        result = await RouterBuilder(builderOptions)
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(currencyFromInput)
          .currencyTo(currencyToInput)
          .amount(amount)
          .senderAddress(senderAddress)
          .recipientAddress(recipientAddress)
          .evmSenderAddress(evmSenderAddress)
          .slippagePct(slippagePct)
          .getMinTransferableAmount();
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
    exchange: TExchangeInput,
    senderAddress: string,
  ) => {
    const {
      useApi,
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
    } = formValues;

    setLoading(true);

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    try {
      let result;
      if (useApi) {
        const {
          isDevelopment,
          abstractDecimals,
          customEndpoints,
          ...safeFormValues
        } = formValues;
        result = await fetchFromApi(
          {
            ...safeFormValues,
            currencyFrom: currencyFromInput,
            currencyTo: currencyToInput,
            exchange,
            senderAddress,
            options: builderOptions,
          },
          '/router/dry-run',
          'POST',
          true,
        );
      } else {
        result = await RouterBuilder(builderOptions)
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(currencyFromInput)
          .currencyTo(currencyToInput)
          .amount(amount)
          .senderAddress(senderAddress)
          .recipientAddress(recipientAddress)
          .evmSenderAddress(evmSenderAddress)
          .slippagePct(slippagePct)
          .onStatusChange(onStatusChange)
          .dryRun();
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
    exchange: TExchangeInput,
  ) => {
    const { useApi, from, to, currencyFrom, currencyTo } = formValues;

    setLoading(true);

    const { currencyFromInput, currencyToInput } = resolveCurrencyInputs({
      from,
      exchange,
      currencyFrom,
      currencyTo,
    });

    try {
      let result;
      if (useApi) {
        const {
          isDevelopment,
          abstractDecimals,
          customEndpoints,
          ...safeFormValues
        } = formValues;
        result = await fetchFromApi(
          {
            ...safeFormValues,
            currencyFrom: currencyFromInput,
            currencyTo: currencyToInput,
            options: builderOptions,
          },
          '/router/best-amount-out',
          'POST',
          true,
        );
      } else {
        result = await RouterBuilder(builderOptions)
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(currencyFromInput)
          .currencyTo(currencyToInput)
          .amount(formValues.amount)
          .getBestAmountOut();
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
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    closeOutputAlert();

    const exchange = (
      formValues.exchange && formValues.exchange?.length > 1
        ? formValues.exchange
        : formValues.exchange?.[0]
    ) as TExchangeInput;

    if (submitType === 'getBestAmountOut') {
      await submitGetBestAmountOut(formValues, exchange);
      return;
    }

    if (submitType === 'getMinTransferableAmount') {
      await submitGetMinTransferableAmount(
        formValues,
        exchange,
        selectedAccount.address,
      );
      return;
    }

    if (submitType === 'getTransferableAmount') {
      await submitGetTransferableAmount(
        formValues,
        exchange,
        selectedAccount.address,
      );
      return;
    }

    if (submitType === 'getXcmFee') {
      await submitGetXcmFee(formValues, exchange, selectedAccount.address);
      return;
    }

    if (submitType === 'dryRun') {
      await submitDryRun(formValues, exchange, selectedAccount.address);
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
          exchange,
          selectedAccount.address,
          signer as PolkadotSigner,
        );
      } else {
        await submitUsingRouterModule(
          formValues,
          exchange,
          selectedAccount.address,
          signer as PolkadotSigner,
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
          <XcmRouterForm
            onSubmit={onSubmit}
            loading={loading}
            advancedOptions={
              advancedRouterOptionsQuery as AdvancedRouterOptions
            }
            onAdvancedOptionsChange={(options) =>
              void setAdvancedRouterOptionsQuery(options)
            }
          />
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
