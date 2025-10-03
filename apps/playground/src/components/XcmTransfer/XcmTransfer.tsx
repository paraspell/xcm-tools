import {
  Box,
  Center,
  Pagination,
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
import { BatchMode, replaceBigInt } from '@paraspell/sdk';
import {
  Foreign,
  ForeignAbstract,
  getOtherAssets,
  isForeignAsset,
  isRelayChain,
  Native,
  Override,
  type TLocation,
  type TPapiTransaction,
} from '@paraspell/sdk';
import type { Extrinsic, TPjsApiOrUrl } from '@paraspell/sdk-pjs';
import type { GeneralBuilder as GeneralBuilderPjs } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api';
import { useEffect, useState } from 'react';

import { useWallet } from '../../hooks';
import type { TSubmitType } from '../../types';
import {
  fetchFromApi,
  getTxFromApi,
  submitTransaction,
  submitTransactionPapi,
} from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import BatchTypeSelectModal from '../BatchTypeSelectModal/BatchTypeSelectModal';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';
import type {
  FormValuesTransformed,
  TCurrencyEntryTransformed,
} from './XcmTransferForm';
import XcmTransferForm from './XcmTransferForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const XcmTransfer = () => {
  const { selectedAccount, apiType, getSigner } = useWallet();

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [
    batchTypeModalOpened,
    { open: openBatchTypeModal, close: closeBatchTypeModal },
  ] = useDisclosure(false);

  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [output, setOutput] = useState<string>();

  const [batchItems, setBatchItems] = useState<FormValuesTransformed[]>([]);
  const [lastFormValues, setLastFormValues] = useState<FormValuesTransformed>();
  const [currentPage, setCurrentPage] = useState(1);

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

  const submitTx = async (
    api: ApiPromise | PolkadotClient,
    tx: Extrinsic | TPapiTransaction,
    signer: PolkadotSigner | Signer,
    address: string,
    onSign?: () => void,
  ) => {
    if (apiType === 'PAPI') {
      await submitTransactionPapi(
        tx as TPapiTransaction,
        signer as PolkadotSigner,
        onSign,
      );
    } else {
      await submitTransaction(
        api as ApiPromise,
        tx as Extrinsic,
        signer as Signer,
        address,
        onSign,
      );
    }
  };

  const submitBatch = async (
    items: FormValuesTransformed[],
    batchMode: `${BatchMode}`,
  ) => {
    if (!selectedAccount) {
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    if (!items.every((item) => item.useApi === items[0].useApi)) {
      showErrorNotification(
        'Cannot mix API and SDK transactions in the same batch',
      );
      throw Error('Cannot mix API and SDK transactions in the same batch');
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
      options?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((options?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    const firstItem = items[0];

    let api;
    try {
      let tx: Extrinsic | TPapiTransaction;
      if (firstItem.useApi) {
        api = await Sdk.createChainClient(firstItem.from);
        tx = await getTxFromApi(
          {
            transfers: items.map((item) => {
              const currencyInputs = item.currencies.map((c) => ({
                ...determineCurrency(item, c),
                amount: c.amount,
              }));
              return {
                ...item,
                currency:
                  currencyInputs.length === 1
                    ? currencyInputs[0]
                    : (currencyInputs as TCurrencyCore[]),
              };
            }),
            options: { mode: batchMode },
          },
          api,
          '/x-transfer-batch',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        if (items.length < 1) {
          throw Error('No items to batch');
        }

        const [firstItem, ...restItems] = items;

        const {
          from,
          to,
          currencies,
          transformedFeeAsset,
          address,
          ahAddress,
        } = firstItem;
        const currencyInputs = currencies.map((c) => ({
          ...determineCurrency(firstItem, c),
          amount: c.amount,
        }));

        let builder = Builder({
          abstractDecimals: true,
        })
          .from(from)
          .to(to)
          .currency(
            currencyInputs.length === 1
              ? currencyInputs[0]
              : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
          )
          .feeAsset(determineFeeAsset(firstItem, transformedFeeAsset))
          .address(address)
          .senderAddress(selectedAccount.address)
          .ahAddress(ahAddress)
          .addToBatch();

        for (const item of restItems) {
          const { from, to, currencies, address } = item;
          const currencyInputs = currencies.map((c) => ({
            ...determineCurrency(item, c),
            amount: c.amount,
          }));
          builder = builder
            .from(from)
            .to(to)
            .currency(
              currencyInputs.length === 1
                ? currencyInputs[0]
                : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
            )
            .feeAsset(determineFeeAsset(firstItem, transformedFeeAsset))
            .address(address)
            .senderAddress(selectedAccount.address)
            .addToBatch();
        }

        tx = await builder.buildBatch({ mode: BatchMode[batchMode] });
        api = builder.getApi();
      }

      const signer = await getSigner();

      await submitTx(api, tx, signer, selectedAccount.address, () => {
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
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        closeOutputAlert();
        openErrorAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onBatchTypeSelect = (value: `${BatchMode}`) => {
    if (!lastFormValues) {
      showErrorNotification('Unexpected error, no last form values found');
      throw Error('No last form values found');
    }
    closeBatchTypeModal();
    void submitBatch([...batchItems, lastFormValues], value);
  };

  const performDryRun = async (
    formValues: FormValuesTransformed,
    selectedAccount: { address: string },
    submitType: 'dryRun' | 'dryRunPreview',
    notifId: string | undefined,
  ) => {
    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const Builder = Sdk.Builder as ((
      options?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((options?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    const {
      from,
      to,
      currencies,
      transformedFeeAsset,
      address,
      ahAddress,
      useApi,
    } = formValues;
    const currencyInputs = currencies.map((c) => ({
      ...determineCurrency(formValues, c),
      amount: c.amount,
    }));

    let result;
    if (useApi) {
      const { useApi, currencies, useXcmFormatCheck, ...safeFormValues } =
        formValues;
      result = await fetchFromApi(
        {
          ...safeFormValues,
          options: {
            abstractDecimals: true,
            ...(submitType === 'dryRunPreview'
              ? { mintFeeAssets: true }
              : undefined),
          },
          senderAddress: selectedAccount.address,
          currency:
            currencyInputs.length === 1 ? currencyInputs[0] : currencyInputs,
          feeAsset: determineFeeAsset(formValues, transformedFeeAsset),
        },
        submitType === 'dryRunPreview' ? '/dry-run-preview' : '/dry-run',
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
            ? currencyInputs[0]
            : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
        )
        .feeAsset(determineFeeAsset(formValues, transformedFeeAsset))
        .address(address)
        .senderAddress(selectedAccount.address)
        .ahAddress(ahAddress);

      result =
        submitType === 'dryRun'
          ? await builder.dryRun()
          : await builder.dryRunPreview({ mintFeeAssets: true });
    }

    setOutput(JSON.stringify(result, replaceBigInt, 2));
    openOutputAlert();
    closeErrorAlert();
    showSuccessNotification(notifId ?? '', 'Success', 'Dry run was successful');
  };

  const submit = async (
    formValues: FormValuesTransformed,
    submitType: TSubmitType,
  ) => {
    const {
      from,
      to,
      currencies,
      transformedFeeAsset,
      address,
      ahAddress,
      useApi,
      useXcmFormatCheck,
    } = formValues;

    if (submitType === 'delete') {
      setBatchItems((prevItems) => {
        const newBatch = [...prevItems];
        newBatch.splice(currentPage - 1, 1);

        // Decide which page to show next
        let nextPage = 1;
        if (currentPage > 1) {
          nextPage = currentPage - 1;
        } else if (newBatch.length > 0) {
          nextPage = 1;
        } else {
          nextPage = 1;
        }

        setCurrentPage(nextPage);

        return newBatch;
      });

      showSuccessNotification(undefined, 'Success', 'Transaction deleted');
      return;
    }

    if (submitType === 'update') {
      setBatchItems((prev) => {
        const newBatch = [...prev];
        newBatch[currentPage - 1] = formValues;
        return newBatch;
      });

      showSuccessNotification(undefined, 'Success', 'Transaction updated');
      return;
    }

    if (submitType === 'addToBatch') {
      setBatchItems((prev) => {
        const newBatch = [...prev, formValues];
        setCurrentPage(newBatch.length + 1);
        return newBatch;
      });

      showSuccessNotification(
        undefined,
        'Success',
        'Transaction added to batch',
      );
      return;
    }

    if (submitType === 'default' && batchItems.length > 0) {
      setLastFormValues(formValues);
      openBatchTypeModal();
      return;
    }

    if (!selectedAccount) {
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);
    let notifId = showLoadingNotification(
      'Processing',
      submitType === 'dryRun'
        ? 'Dry run is being processed'
        : 'Waiting to sign transaction',
    );

    const signer = await getSigner();

    const Sdk =
      apiType === 'PAPI'
        ? await import('@paraspell/sdk')
        : await import('@paraspell/sdk-pjs');

    const Builder = Sdk.Builder as ((
      options?: TBuilderOptions<TPjsApiOrUrl>,
    ) => GeneralBuilder) &
      ((options?: TBuilderOptions<TPapiApiOrUrl>) => GeneralBuilderPjs);

    let api;
    try {
      if (submitType === 'dryRun' || submitType === 'dryRunPreview') {
        await performDryRun(formValues, selectedAccount, submitType, notifId);
        return;
      }

      const currencyInputs = currencies.map((c) => {
        return {
          ...determineCurrency(formValues, c),
          amount: c.amount,
        };
      });

      let tx: Extrinsic | TPapiTransaction | undefined;
      if (useApi) {
        api = await Sdk.createChainClient(from);
        const { useApi, useXcmFormatCheck, currencies, ...safeFormValues } =
          formValues;
        tx = await getTxFromApi(
          {
            ...safeFormValues,
            options: {
              abstractDecimals: true,
              xcmFormatCheck: useXcmFormatCheck,
            },
            feeAsset: determineFeeAsset(formValues, transformedFeeAsset),
            currency:
              currencyInputs.length === 1 ? currencyInputs[0] : currencyInputs,
          },
          api,
          '/x-transfer',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        const builder = Builder({
          abstractDecimals: true,
          xcmFormatCheck: useXcmFormatCheck,
        })
          .from(from)
          .to(to)
          .currency(
            currencyInputs.length === 1
              ? currencyInputs[0]
              : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
          )
          .feeAsset(determineFeeAsset(formValues, transformedFeeAsset))
          .address(address)
          .senderAddress(selectedAccount.address)
          .ahAddress(ahAddress);
        tx = await builder.build();
        api = builder.getApi();
      }

      if (!tx) {
        throw Error('Transaction is undefined');
      }
      if (!api) {
        throw Error('API is undefined');
      }

      await submitTx(api, tx, signer, selectedAccount.address, () => {
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
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        closeOutputAlert();
        openErrorAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (
    formValues: FormValuesTransformed,
    submitType: TSubmitType,
  ) => void submit(formValues, submitType);

  const onPageChange = (page: number) => setCurrentPage(page);

  const onAlertCloseClick = () => closeErrorAlert();

  const onOutputAlertCloseClick = () => closeOutputAlert();

  const theme = useMantineColorScheme();

  return (
    <>
      <BatchTypeSelectModal
        isOpen={batchTypeModalOpened}
        onClose={closeBatchTypeModal}
        onBatchTypeSelect={onBatchTypeSelect}
      />
      <Stack gap="xl">
        <Stack w="100%" maw={460} mx="auto" gap="0">
          <Box px="xl" pb="xl">
            <Center mb="xs">
              <Title order={2}>XCM Transfer 🪄</Title>
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
              Easily transfer assets across Paraverse 🪐 using XCM.
            </Text>
          </Box>

          <XcmTransferForm
            onSubmit={onSubmit}
            loading={loading}
            isBatchMode={batchItems.length > 0}
            isVisible={currentPage === batchItems.length + 1}
          />

          {currentPage !== batchItems.length + 1 && (
            <XcmTransferForm
              key={currentPage}
              onSubmit={onSubmit}
              loading={loading}
              isBatchMode={batchItems.length > 0}
              initialValues={batchItems[currentPage - 1]}
            />
          )}

          <Pagination
            value={currentPage}
            onChange={onPageChange}
            total={batchItems.length + 1}
            hideWithOnePage
            style={{
              justifyContent: 'center',
            }}
            py="lg"
          />
        </Stack>
        <Center ref={targetRef}>
          {errorAlertOpened && (
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
    </>
  );
};

export default XcmTransfer;
