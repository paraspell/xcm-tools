import {
  Stack,
  Box,
  Alert,
  Text,
  Title,
  Center,
  useMantineColorScheme,
  Badge,
} from '@mantine/core';
import ErrorAlert from '../ErrorAlert';
import type {
  FormValuesTransformed,
  TCurrencyEntryTransformed,
} from './XcmTransferForm';
import XcmTransferForm from './XcmTransferForm';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type {
  TCurrencyCoreWithFee,
  TCurrencyInputWithAmount,
} from '@paraspell/sdk';
import {
  isForeignAsset,
  getOtherAssets,
  isRelayChain,
  Override,
  type TMultiLocation,
  type TNodePolkadotKusama,
  type TPapiTransaction,
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
import { IconJson } from '@tabler/icons-react';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { CodeHighlight } from '@mantine/code-highlight';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const XcmTransfer = () => {
  const { selectedAccount, apiType, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [output, setOutput] = useState<string>();

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

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
      currency,
      amount,
    }: TCurrencyEntryTransformed,
  ): TCurrencyInputWithAmount => {
    if (isCustomCurrency) {
      if (customCurrencyType === 'id') {
        return {
          id: customCurrency,
          amount,
        };
      } else if (customCurrencyType === 'symbol') {
        return {
          symbol: customCurrency,
          amount,
        };
      } else if (customCurrencyType === 'overridenMultilocation') {
        return {
          multilocation: Override(JSON.parse(customCurrency) as TMultiLocation),
          amount,
        };
      } else {
        return {
          multilocation: JSON.parse(customCurrency) as TMultiLocation,
          amount,
        };
      }
    } else if (currency) {
      if (isForeignAsset(currency) && ethers.isAddress(currency.assetId)) {
        return { symbol: currency.symbol ?? '', amount };
      }

      if (!isForeignAsset(currency)) {
        return { symbol: currency.symbol ?? '', amount };
      }

      const hasDuplicateIds = isRelayChain(from)
        ? false
        : getOtherAssets(from as TNodePolkadotKusama).filter(
            (asset) => asset.assetId === currency.assetId,
          ).length > 1;
      return hasDuplicateIds
        ? { symbol: currency.symbol ?? '', amount }
        : {
            id: currency.assetId ?? '',
            amount,
          };
    } else {
      throw Error('Currency is required');
    }
  };

  const submit = async (
    formValues: FormValuesTransformed,
    isDryRun: boolean,
  ) => {
    const { from, to, currencies, address, ahAddress, useApi } = formValues;

    if (!selectedAccount) {
      alert('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);

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

      if (isDryRun) {
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
        closeAlert();
      } else {
        if (apiType === 'PAPI') {
          await submitTransactionPapi(
            tx as TPapiTransaction,
            signer as PolkadotSigner,
          );
        } else {
          await submitTransaction(
            api as ApiPromise,
            tx as Extrinsic,
            signer as Signer,
            selectedAccount.address,
          );
        }
        alert('Transaction was successful!');
      }
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        closeOutputAlert();
        openAlert();
      }
    } finally {
      setLoading(false);
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
    }
  };

  const onSubmit = (formValues: FormValuesTransformed, isDryRun: boolean) =>
    void submit(formValues, isDryRun);

  const onAlertCloseClick = () => closeAlert();

  const onOutputAlertCloseClick = () => closeOutputAlert();

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={460} mx="auto" gap="0">
        <Box px="xl" pb="xl">
          <Center mb="xs">
            <Title order={2}>XCM Transfer 🪄</Title>
          </Center>

          <Center>
            <Badge
              variant="light"
              radius="xl"
              mb="md"
              style={{ textTransform: 'unset' }}
            >
              v{VERSION}
            </Badge>
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
        <XcmTransferForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
      </Box>
      <Box>
        {outputAlertOpened && output && (
          <Alert
            color="green"
            title="Output"
            icon={<IconJson size={24} />}
            withCloseButton
            onClose={onOutputAlertCloseClick}
            mt="lg"
            style={{ overflowWrap: 'anywhere' }}
            data-testid="output"
            p="xl"
          >
            <CodeHighlight
              code={output}
              lang="json"
              style={{
                padding: 0,
                borderRadius: 16,
                marginTop: 20,
                backgroundColor: 'transparent',
              }}
            />
          </Alert>
        )}
      </Box>
    </Stack>
  );
};

export default XcmTransfer;
