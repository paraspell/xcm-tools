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
import type { GeneralBuilder, TBuilderConfig, TUrl } from '@paraspell/sdk';
import { BatchMode, replaceBigInt } from '@paraspell/sdk';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';
import { useEffect, useState } from 'react';

import { QUERY_CONFIG } from '../../constants';
import { useWallet } from '../../hooks';
import type {
  TApiTransaction,
  TFormValuesTransformed,
  TProgressSwapEvent,
  TQuerySubmitType,
  TSubmitType,
} from '../../types';
import type { TTransaction } from '../../utils';
import {
  addSwapToBuilder,
  buildApiPayload,
  createBuilderOptions,
  fetchFromApi,
  getTxFromApi,
  importSdk,
  isSwapActive,
  resolveSender,
  setupBaseBuilder,
  submitApiTransactions,
  submitSdkTransactions,
  submitTx,
} from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { BatchTypeSelectModal } from '../BatchTypeSelectModal/BatchTypeSelectModal';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { TransferStepper } from '../common/TransferStepper';
import { VersionBadge } from '../common/VersionBadge';
import { XcmTransferForm } from './XcmTransferForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

export const XcmTransfer = () => {
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

  const [batchItems, setBatchItems] = useState<TFormValuesTransformed[]>([]);
  const [lastFormValues, setLastFormValues] =
    useState<TFormValuesTransformed>();
  const [currentPage, setCurrentPage] = useState(1);

  const [progressInfo, setProgressInfo] = useState<TProgressSwapEvent>();
  const [showStepper, setShowStepper] = useState(false);

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

  const handleError = (e: unknown, notifId?: string) => {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(e);
      showErrorNotification(e.message, notifId);
      setError(e);
      closeOutputAlert();
      openErrorAlert();
    }
  };

  const submitBatch = async (
    items: TFormValuesTransformed[],
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

    const firstItem = items[0];

    const { useApi } = firstItem;

    const { createChainClient, Builder } = await importSdk(apiType);

    const builderOptions = createBuilderOptions(firstItem);

    const sender = firstItem.localAccount || selectedAccount.address;

    let api;

    const signer = await getSigner();

    try {
      let tx: TTransaction;
      if (useApi) {
        api = await createChainClient(firstItem.from);
        tx = await getTxFromApi(
          {
            transfers: items.map((item) => buildApiPayload(item, sender)),
            options: {
              mode: batchMode,
              ...builderOptions,
            },
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

        const addToBatch = (
          builder: GeneralBuilder,
          item: TFormValuesTransformed,
        ) => {
          return setupBaseBuilder(builder, item, sender, signer).addToBatch();
        };

        const initialBuilder = Builder(builderOptions);
        let builder = addToBatch(initialBuilder, firstItem);

        for (const item of restItems) {
          builder = addToBatch(builder, item);
        }

        tx = await builder.buildBatch({ mode: BatchMode[batchMode] });
        api = builder.getApi();
      }

      await submitTx(apiType, api, tx, signer, selectedAccount.address, () => {
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
      handleError(e, notifId);
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

  const executeSdkQuery = async (
    formValues: TFormValuesTransformed,
    sender: string,
    signer: PolkadotSigner | Signer,
    builderOptions: TBuilderConfig<TUrl>,
    submitType: TQuerySubmitType,
  ) => {
    const { Builder } = await importSdk(apiType);
    const builder = Builder(builderOptions);
    const finalBuilder = setupBaseBuilder(builder, formValues, sender, signer);

    switch (submitType) {
      case 'dryRun':
        return finalBuilder.dryRun();
      case 'dryRunPreview':
        return finalBuilder.dryRunPreview({ mintFeeAssets: true });
      case 'getXcmFee':
        return finalBuilder.getXcmFee();
      case 'getOriginXcmFee':
        return finalBuilder.getOriginXcmFee();
      case 'getTransferableAmount':
        return finalBuilder.getTransferableAmount();
      case 'getMinTransferableAmount':
        return finalBuilder.getMinTransferableAmount();
      case 'getReceivableAmount':
        return finalBuilder.getReceivableAmount();
      case 'verifyEdOnDestination':
        return finalBuilder.verifyEdOnDestination();
      case 'getTransferInfo':
        return finalBuilder.getTransferInfo();
      case 'getBestAmountOut': {
        if (!formValues.transformedCurrencyTo) {
          throw new Error(
            'Swap configuration is required for getBestAmountOut.',
          );
        }

        const swapBuilder = addSwapToBuilder(
          finalBuilder,
          formValues.transformedCurrencyTo,
          formValues.swapOptions,
          signer,
          sender,
        );
        return swapBuilder.getBestAmountOut();
      }
    }
  };

  const performQuery = async (
    formValues: TFormValuesTransformed,
    sender: string,
    signer: PolkadotSigner | Signer,
    notifId: string | undefined,
    submitType: TQuerySubmitType,
  ) => {
    const { endpoint, message } = QUERY_CONFIG[submitType];
    const builderOptions = createBuilderOptions(formValues);

    const result = formValues.useApi
      ? await fetchFromApi(
          buildApiPayload(formValues, sender, {
            ...builderOptions,
            ...(submitType === 'dryRunPreview'
              ? { mintFeeAssets: true }
              : undefined),
          }),
          endpoint,
          'POST',
          true,
        )
      : await executeSdkQuery(
          formValues,
          sender,
          signer,
          builderOptions,
          submitType,
        );

    setOutput(JSON.stringify(result, replaceBigInt, 2));
    openOutputAlert();
    closeErrorAlert();
    showSuccessNotification(notifId ?? '', 'Success', message);
  };

  const submit = async (
    formValues: TFormValuesTransformed,
    submitType: TSubmitType,
  ) => {
    const { from, localAccount, useApi } = formValues;

    const batchIndex = currentPage - 1;

    if (submitType === 'delete') {
      setBatchItems((prevItems) => {
        const newBatch = [...prevItems];
        newBatch.splice(batchIndex, 1);
        setCurrentPage(Math.max(1, batchIndex));
        return newBatch;
      });

      showSuccessNotification(undefined, 'Success', 'Transaction deleted');
      return;
    }

    if (submitType === 'update') {
      setBatchItems((prev) => {
        const newBatch = [...prev];
        newBatch[batchIndex] = formValues;
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

    const sender = resolveSender(localAccount, selectedAccount);

    setLoading(true);
    let notifId = showLoadingNotification(
      'Processing',
      submitType !== 'default'
        ? 'Processing request...'
        : 'Waiting to sign transaction',
    );

    const signer = await getSigner();

    try {
      if (submitType !== 'default') {
        await performQuery(formValues, sender, signer, notifId, submitType);
        return;
      }

      const builderOptions = createBuilderOptions(formValues);
      const { createChainClient, Builder } = await importSdk(apiType);

      let api;
      let tx: TTransaction | undefined;
      let hash: string | undefined;

      if (useApi) {
        const apiPayload = buildApiPayload(formValues, sender, builderOptions);

        if (isSwapActive(formValues.swapOptions)) {
          const transactions = await fetchFromApi<
            typeof apiPayload,
            TApiTransaction[]
          >(apiPayload, '/x-transfers', 'POST', true);

          if (transactions.length > 1) {
            setShowStepper(true);
          }

          await submitApiTransactions({
            transactions,
            apiType,
            signer,
            senderAddress: sender,
            evmSigner: formValues.swapOptions.evmSigner,
            onStatusChange:
              transactions.length > 1 ? onStatusChange : undefined,
          });

          showSuccessNotification(
            notifId ?? '',
            'Success',
            'Transaction was successful',
          );
        } else {
          api = await createChainClient(from);
          tx = await getTxFromApi(
            apiPayload,
            api,
            '/x-transfer',
            sender,
            apiType,
            'POST',
            true,
          );
        }
      } else {
        const builder = Builder(builderOptions);
        const finalBuilder = setupBaseBuilder(
          builder,
          formValues,
          sender,
          signer,
        );

        if (isSwapActive(formValues.swapOptions)) {
          const txContexts = await finalBuilder.buildAll();

          if (txContexts.length > 1) {
            setShowStepper(true);
          }

          await submitSdkTransactions({
            txContexts,
            apiType,
            signer,
            senderAddress: sender,
            evmSigner: formValues.swapOptions.evmSigner,
            onStatusChange: txContexts.length > 1 ? onStatusChange : undefined,
          });

          showSuccessNotification(
            notifId ?? '',
            'Success',
            'Transaction was successful',
          );
        } else if (localAccount) {
          hash = await finalBuilder.signAndSubmit();
        } else {
          tx = await finalBuilder.build();
        }

        api = finalBuilder.getApi();
      }

      if (tx) {
        if (!api) {
          throw Error('API is undefined');
        }

        await submitTx(apiType, api, tx, signer, sender, () => {
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
      } else if (hash !== undefined) {
        setOutput(`'Transaction was submitted. Hash: ${hash}'`);
        openOutputAlert();
        showSuccessNotification(
          notifId ?? '',
          'Success',
          `Transaction was submitted`,
          false,
        );
      }
    } catch (e) {
      handleError(e, notifId);
    } finally {
      setLoading(false);
      setShowStepper(false);
    }
  };

  const onSubmit = (
    formValues: TFormValuesTransformed,
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
        <Stack w="100%" maw={480} mx="auto" gap="0">
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
          {showStepper && progressInfo?.type !== 'SELECTING_EXCHANGE' && (
            <TransferStepper progressInfo={progressInfo} />
          )}
        </Center>
        <Center>
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
