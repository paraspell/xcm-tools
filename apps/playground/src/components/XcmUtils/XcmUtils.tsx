/* eslint-disable no-console */
import {
  Box,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type {
  GeneralBuilder,
  TBuilderOptions,
  TCurrencyCore,
  TCurrencyInput,
  TPapiApiOrUrl,
  WithComplexAmount,
} from '@paraspell/sdk';
import {
  Foreign,
  ForeignAbstract,
  getOtherAssets,
  isForeignAsset,
  isRelayChain,
  Native,
  Override,
  replaceBigInt,
  type TLocation,
} from '@paraspell/sdk';
import type { TPjsApiOrUrl } from '@paraspell/sdk-pjs';
import type { GeneralBuilder as GeneralBuilderPjs } from '@paraspell/sdk-pjs';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks';
import XcmTransferStateProvider from '../../providers/XcmTrasferState/XcmTransferStateProvider';
import type { TSubmitType } from '../../types';
import { fetchFromApi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type {
  FormValuesTransformed,
  TCurrencyEntryTransformed,
} from './XcmUtilsForm';
import XcmTransferForm from './XcmUtilsForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const XcmUtils = () => {
  const { selectedAccount, apiType } = useWallet();

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>();

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const determineCurrency = (
    { from }: FormValuesTransformed,
    {
      isCustomCurrency,
      customCurrency,
      customCurrencyType,
      customCurrencySymbolSpecifier,
      currency,
    }: TCurrencyEntryTransformed,
  ): TCurrencyInput => {
    if (isCustomCurrency) {
      if (customCurrencyType === 'id') {
        return {
          id: customCurrency,
        };
      } else if (customCurrencyType === 'symbol') {
        if (customCurrencySymbolSpecifier === 'native') {
          return {
            symbol: Native(customCurrency),
          };
        }
        if (customCurrencySymbolSpecifier === 'foreign') {
          return {
            symbol: Foreign(customCurrency),
          };
        }
        if (customCurrencySymbolSpecifier === 'foreignAbstract') {
          return {
            symbol: ForeignAbstract(customCurrency),
          };
        }
        return {
          symbol: customCurrency,
        };
      } else if (customCurrencyType === 'overridenLocation') {
        return {
          location: Override(JSON.parse(customCurrency) as TLocation),
        };
      } else {
        return {
          location: JSON.parse(customCurrency) as TLocation,
        };
      }
    } else if (currency) {
      const hasDuplicateIds = isRelayChain(from)
        ? false
        : getOtherAssets(from).filter(
            (asset) =>
              isForeignAsset(asset) &&
              isForeignAsset(currency) &&
              asset.assetId === currency.assetId,
          ).length > 1;

      if (isForeignAsset(currency) && currency.assetId && !hasDuplicateIds) {
        return {
          id: currency.assetId,
        };
      }

      if (currency.location) {
        return {
          location: currency.location,
        };
      }

      return isForeignAsset(currency)
        ? { symbol: currency.symbol }
        : { symbol: Native(currency.symbol) };
    } else {
      throw Error('Currency is required');
    }
  };

  const determineFeeAsset = (
    formValues: FormValuesTransformed,
    transformedFeeAsset?: TCurrencyEntryTransformed,
  ): TCurrencyInput | undefined => {
    if (!transformedFeeAsset) return undefined;
    if (
      transformedFeeAsset.currencyOptionId ||
      transformedFeeAsset.isCustomCurrency
    ) {
      return determineCurrency(formValues, transformedFeeAsset);
    }
    return undefined;
  };

  const performFeeOperation = async (
    formValues: FormValuesTransformed,
    selectedAccountAddress: string,
    notifId: string | undefined,
    submitType: TSubmitType,
  ) => {
    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const Builder = Sdk.Builder as ((
      options?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((options?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    const { from, to, currencies, transformedFeeAsset, address, useApi } =
      formValues;

    const currencyInputs = currencies.map((c) => ({
      ...determineCurrency(formValues, c),
      amount: c.isMax ? 'ALL' : c.amount,
    }));

    const body = {
      ...formValues,
      senderAddress: selectedAccountAddress,
      currency:
        currencyInputs.length === 1 ? currencyInputs[0] : currencyInputs,
      feeAsset: determineFeeAsset(formValues, transformedFeeAsset),
    };

    let result;
    let apiEndpoint = '';
    let successMessage = '';
    let currentNotifId = notifId;

    if (!currentNotifId) {
      currentNotifId = showLoadingNotification(
        'Processing',
        `Workspaceing ${submitType}...`,
      );
    }

    switch (submitType) {
      case 'getXcmFee':
        apiEndpoint = '/xcm-fee';
        successMessage = 'XCM fee retrieved';
        break;
      case 'getXcmFeeEstimate':
        apiEndpoint = '/xcm-fee-estimate';
        successMessage = 'XCM fee estimate retrieved';
        break;
      case 'getOriginXcmFee':
        apiEndpoint = '/origin-xcm-fee';
        successMessage = 'Origin XCM fee retrieved';
        break;
      case 'getOriginXcmFeeEstimate':
        apiEndpoint = '/origin-xcm-fee-estimate';
        successMessage = 'Origin XCM fee estimate retrieved';
        break;
      default:
        showErrorNotification(
          `Unsupported fee operation type: ${submitType}`,
          currentNotifId,
        );
        throw new Error(`Unsupported fee operation type: ${submitType}`);
    }

    try {
      if (useApi) {
        const { useApi, currencies, ...safeFormValues } = body;
        result = await fetchFromApi(
          {
            ...safeFormValues,
            options: {
              abstractDecimals: true,
            },
          },
          apiEndpoint,
          'POST',
          true,
        );
      } else {
        const builder = Builder({
          abstractDecimals: true,
        })
          .from(from)
          .to(to)
          .currency(
            currencyInputs.length === 1
              ? (currencyInputs[0] as WithComplexAmount<TCurrencyInput>)
              : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
          )
          .feeAsset(body.feeAsset as TCurrencyInput)
          .address(address)
          .senderAddress(selectedAccountAddress)
          .ahAddress(body.ahAddress);

        switch (submitType) {
          case 'getXcmFee':
            result = await builder.getXcmFee();
            break;
          case 'getXcmFeeEstimate':
            result = await builder.getXcmFeeEstimate();
            break;
          case 'getOriginXcmFee':
            result = await builder.getOriginXcmFee();
            break;
          case 'getOriginXcmFeeEstimate':
            result = await builder.getOriginXcmFeeEstimate();
            break;
        }
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeErrorAlert();
      showSuccessNotification(currentNotifId ?? '', 'Success', successMessage);
    } catch (e) {
      if (e instanceof Error) {
        showErrorNotification(e.message, currentNotifId);
        setError(e);
        closeOutputAlert();
        openErrorAlert();
      }
      throw e;
    }
  };

  const performInfoOperation = async (
    formValues: FormValuesTransformed,
    selectedAccountAddress: string,
    notifId: string | undefined,
    submitType: TSubmitType,
  ) => {
    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const Builder = Sdk.Builder as ((
      options?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((options?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    const { from, to, currencies, transformedFeeAsset, address, useApi } =
      formValues;

    const currencyInputs = currencies.map((c) => ({
      ...determineCurrency(formValues, c),
      amount: c.isMax ? 'ALL' : c.amount,
    }));

    const body = {
      ...formValues,
      senderAddress: selectedAccountAddress,
      currency:
        currencyInputs.length === 1 ? currencyInputs[0] : currencyInputs,
      feeAsset: determineFeeAsset(formValues, transformedFeeAsset),
    };

    let result;
    let apiEndpoint = '';
    let successMessage = '';
    let currentNotifId = notifId;

    if (!currentNotifId) {
      currentNotifId = showLoadingNotification(
        'Processing',
        `Workspaceing ${submitType}...`,
      );
    }

    switch (submitType) {
      case 'getTransferableAmount':
        apiEndpoint = '/transferable-amount';
        successMessage = 'Transferable amount retrieved';
        break;
      case 'getMinTransferableAmount':
        apiEndpoint = '/min-transferable-amount';
        successMessage = 'Minimum transferable amount retrieved';
        break;
      case 'getReceivableAmount':
        apiEndpoint = '/receivable-amount';
        successMessage = 'Receivable amount retrieved';
        break;
      case 'verifyEdOnDestination':
        apiEndpoint = '/verify-ed-on-destination';
        successMessage = 'ED verification result retrieved';
        break;
      case 'getTransferInfo':
        apiEndpoint = '/transfer-info';
        successMessage = 'Transfer info retrieved';
        break;
      default:
        showErrorNotification(
          `Unsupported info operation type: ${submitType}`,
          currentNotifId,
        );
        throw new Error(`Unsupported info operation type: ${submitType}`);
    }

    try {
      if (useApi) {
        const { useApi, currencies, ...safeFormValues } = body;
        result = await fetchFromApi(
          {
            ...safeFormValues,
            options: {
              abstractDecimals: true,
            },
          },
          apiEndpoint,
          'POST',
          true,
        );
      } else {
        const builder = Builder({
          abstractDecimals: true,
        })
          .from(from)
          .to(to)
          .currency(
            currencyInputs.length === 1
              ? (currencyInputs[0] as WithComplexAmount<TCurrencyInput>)
              : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
          )
          .feeAsset(body.feeAsset as TCurrencyInput)
          .address(address)
          .senderAddress(selectedAccountAddress)
          .ahAddress(body.ahAddress);

        switch (submitType) {
          case 'getTransferableAmount':
            result = await builder.getTransferableAmount();
            break;
          case 'getMinTransferableAmount':
            result = await builder.getMinTransferableAmount();
            break;
          case 'getReceivableAmount':
            result = await builder.getReceivableAmount();
            break;
          case 'verifyEdOnDestination':
            result = await builder.verifyEdOnDestination();
            break;
          case 'getTransferInfo':
            result = await builder.getTransferInfo();
            break;
        }
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeErrorAlert();
      showSuccessNotification(currentNotifId ?? '', 'Success', successMessage);
    } catch (e) {
      if (e instanceof Error) {
        showErrorNotification(e.message, currentNotifId);
        setError(e);
        closeOutputAlert();
        openErrorAlert();
      }
      throw e;
    }
  };

  const submit = async (
    formValues: FormValuesTransformed,
    submitType: TSubmitType,
  ) => {
    if (!selectedAccount) {
      showErrorNotification('No account selected. Please connect your wallet.');
      setError(new Error('No account selected. Please connect your wallet.'));
      openErrorAlert();
      return;
    }

    setLoading(true);
    const opTextMap: Record<string, string> = {
      getXcmFee: 'Getting XCM fee...',
      getXcmFeeEstimate: 'Getting XCM fee estimate...',
      getOriginXcmFee: 'Getting Origin XCM fee...',
      getOriginXcmFeeEstimate: 'Getting Origin XCM fee estimate...',
      getTransferableAmount: 'Getting transferable amount...',
      verifyEdOnDestination: 'Verifying ED on destination...',
      getReceivableAmount: 'Getting receivable amount...',
      getTransferInfo: 'Getting transfer info...',
    };
    const loadingMessage = opTextMap[submitType] ?? 'Processing request...';
    const notifId = showLoadingNotification('Processing', loadingMessage);

    try {
      if (
        submitType === 'getXcmFee' ||
        submitType === 'getXcmFeeEstimate' ||
        submitType === 'getOriginXcmFee' ||
        submitType === 'getOriginXcmFeeEstimate'
      ) {
        await performFeeOperation(
          formValues,
          selectedAccount.address,
          notifId,
          submitType,
        );
      } else if (
        submitType === 'getTransferableAmount' ||
        submitType === 'getMinTransferableAmount' ||
        submitType === 'getReceivableAmount' ||
        submitType === 'verifyEdOnDestination' ||
        submitType === 'getTransferInfo'
      ) {
        await performInfoOperation(
          formValues,
          selectedAccount.address,
          notifId,
          submitType,
        );
      } else {
        console.warn(`Unsupported submit type received: ${submitType}`);
        showErrorNotification(
          `Operation ${submitType} is not supported.`,
          notifId,
        );
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error('Error during submit:', e);
        if (!errorAlertOpened) {
          showErrorNotification(e.message, notifId);
          setError(e);
          closeOutputAlert();
          openErrorAlert();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (
    formValues: FormValuesTransformed,
    submitType: TSubmitType,
  ) => void submit(formValues, submitType);

  const onAlertCloseClick = () => closeErrorAlert();
  const onOutputAlertCloseClick = () => closeOutputAlert();

  const { colorScheme } = useMantineColorScheme();

  return (
    <>
      <Stack gap="xl">
        <Stack w="100%" maw={460} mx="auto" gap="0">
          <Box px="xl" pb="xl">
            <Center mb="xs">
              <Title order={2}>XCM Utilities 🪄</Title>
            </Center>
            <Center>
              <VersionBadge version={VERSION} />
            </Center>
            <Text
              size="xs"
              c={colorScheme === 'light' ? 'gray.7' : 'dark.1'}
              fw={700}
              ta="center"
            >
              Query XCM information and fees.
            </Text>
          </Box>
          <XcmTransferStateProvider>
            <XcmTransferForm onSubmit={onSubmit} loading={loading} />
          </XcmTransferStateProvider>
        </Stack>
        <Center ref={targetRef}>
          {errorAlertOpened && error && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error.message}
            </ErrorAlert>
          )}
        </Center>
        <Center>
          {outputAlertOpened && output && (
            <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
          )}
        </Center>
      </Stack>
    </>
  );
};

export default XcmUtils;
