import {
  Stack,
  Box,
  Text,
  Title,
  Center,
  useMantineColorScheme,
  Pagination,
} from '@mantine/core';
import { ErrorAlert } from '../common/ErrorAlert';
import type {
  FormValuesTransformed,
  TCurrencyEntryTransformed,
} from './XcmTransferForm';
import XcmTransferForm from './XcmTransferForm';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TCurrencyCoreWithFee, TCurrencyInput } from '@paraspell/sdk';
import { BatchMode } from '@paraspell/sdk';
import {
  isForeignAsset,
  getOtherAssets,
  isRelayChain,
  Override,
  type TMultiLocation,
  type TNodePolkadotKusama,
  type TPapiTransaction,
  Native,
  Foreign,
  ForeignAbstract,
} from '@paraspell/sdk';
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api';
import type { Signer } from '@polkadot/api/types';
import { useState, useEffect } from 'react';
import {
  submitTransaction,
  submitTransactionPapi,
  fetchFromApi,
  getTxFromApi,
  replaceBigInt,
} from '../../utils';
import { useWallet } from '../../hooks/useWallet';
import type { ApiPromise } from '@polkadot/api';
import { ethers } from 'ethers';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { VersionBadge } from '../common/VersionBadge';
import { OutputAlert } from '../common/OutputAlert';
import type { TSubmitType } from '../../types';
import BatchTypeSelectModal from '../BatchTypeSelectModal/BatchTypeSelectModal';

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
      } else if (customCurrencyType === 'overridenMultilocation') {
        return {
          multilocation: Override(JSON.parse(customCurrency) as TMultiLocation),
        };
      } else {
        return {
          multilocation: JSON.parse(customCurrency) as TMultiLocation,
        };
      }
    } else if (currency) {
      if (isForeignAsset(currency) && ethers.isAddress(currency.assetId)) {
        return { symbol: currency.symbol ?? '' };
      }

      if (!isForeignAsset(currency)) {
        return { symbol: currency.symbol ?? '' };
      }

      const hasDuplicateIds = isRelayChain(from)
        ? false
        : getOtherAssets(from as TNodePolkadotKusama).filter(
            (asset) => asset.assetId === currency.assetId,
          ).length > 1;
      return hasDuplicateIds
        ? { symbol: currency.symbol ?? '' }
        : {
            id: currency.assetId ?? '',
          };
    } else {
      throw Error('Currency is required');
    }
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

    const firstItem = items[0];
    const api = await Sdk.createApiInstanceForNode(firstItem.from);

    try {
      let tx: Extrinsic | TPapiTransaction;
      if (firstItem.useApi) {
        tx = await getTxFromApi(
          {
            transfers: items.map((item) => {
              const useMultiAssets = item.currencies.length > 1;
              const currencyInputs = item.currencies.map((c) => ({
                ...determineCurrency(item, c),
                amount: c.amount,
                ...(useMultiAssets && { isFeeAsset: c.isFeeAsset }),
              }));
              return {
                ...item,
                currency:
                  currencyInputs.length === 1
                    ? currencyInputs[0]
                    : { multiasset: currencyInputs as TCurrencyCoreWithFee[] },
              };
            }),
            options: { mode: batchMode },
          },
          api,
          apiType === 'PJS' ? '/x-transfer-batch' : '/x-transfer-batch-papi',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        const builder = Sdk.Builder(api as ApiPromise & PolkadotClient);

        for (const item of items) {
          const { from, to, currencies, address, ahAddress } = item;
          const useMultiAssets = currencies.length > 1;
          const currencyInputs = currencies.map((c) => ({
            ...determineCurrency(item, c),
            amount: c.amount,
            ...(useMultiAssets && { isFeeAsset: c.isFeeAsset }),
          }));

          builder
            .from(from)
            .to(to)
            .currency(
              currencyInputs.length === 1
                ? currencyInputs[0]
                : { multiasset: currencyInputs as TCurrencyCoreWithFee[] },
            )
            .address(address, ahAddress)
            .addToBatch();
        }

        tx = await builder.buildBatch({ mode: BatchMode[batchMode] });
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
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
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

  const submit = async (
    formValues: FormValuesTransformed,
    submitType: TSubmitType,
  ) => {
    const { from, to, currencies, address, ahAddress, useApi } = formValues;

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

    const api = await Sdk.createApiInstanceForNode(from);

    try {
      const useMultiAssets = currencies.length > 1;
      const currencyInputs = currencies.map((c) => {
        return {
          ...determineCurrency(formValues, c),
          amount: c.amount,
          ...(useMultiAssets && { isFeeAsset: c.isFeeAsset }),
        };
      });

      let tx: Extrinsic | TPapiTransaction;
      if (useApi) {
        tx = await getTxFromApi(
          {
            ...formValues,
            currency:
              currencyInputs.length === 1
                ? currencyInputs[0]
                : {
                    multiasset: currencyInputs,
                  },
          },
          api,
          apiType === 'PJS' ? '/x-transfer' : '/x-transfer-papi',
          selectedAccount.address,
          apiType,
          'POST',
          true,
        );
      } else {
        const builder = Sdk.Builder(api as ApiPromise & PolkadotClient);
        tx = await builder
          .from(from)
          .to(to)
          .currency(
            currencyInputs.length === 1
              ? currencyInputs[0]
              : {
                  multiasset: currencyInputs as TCurrencyCoreWithFee[],
                },
          )
          .address(address, ahAddress)
          .build();
      }

      if (submitType === 'dryRun') {
        let result;
        if (useApi) {
          result = await fetchFromApi(
            {
              ...formValues,
              injectorAddress: selectedAccount.address,
              currency:
                currencyInputs.length === 1
                  ? currencyInputs[0]
                  : {
                      multiasset: currencyInputs,
                    },
            },
            '/dry-run',
            'POST',
            true,
          );
        } else {
          result = await Sdk.getDryRun({
            api: api as ApiPromise & PolkadotClient,
            tx: tx as Extrinsic & TPapiTransaction,
            address: selectedAccount.address,
            node: from,
          });
        }
        setOutput(JSON.stringify(result, replaceBigInt, 2));
        openOutputAlert();
        closeErrorAlert();
        showSuccessNotification(
          notifId ?? '',
          'Success',
          'Dry run was successful',
        );
      } else {
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
      }
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
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
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
        <Box ref={targetRef}>
          {errorAlertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error?.message}
            </ErrorAlert>
          )}
        </Box>
        <Box>
          {outputAlertOpened && output && (
            <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
          )}
        </Box>
      </Stack>
    </>
  );
};

export default XcmTransfer;
