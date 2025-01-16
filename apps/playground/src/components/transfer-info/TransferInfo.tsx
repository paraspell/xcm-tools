import {
  Stack,
  Box,
  Center,
  Title,
  Text,
  useMantineColorScheme,
  Badge,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TCurrencyCore, TMultiLocation } from '@paraspell/sdk';
import ErrorAlert from '../ErrorAlert';
import { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import type { FormValues } from './TransferInfoForm';
import TransferInfoForm from './TransferInfoForm';
import OutputAlert from '../OutputAlert';
import { fetchFromApi, replaceBigInt } from '../../utils';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const TransferInfo = () => {
  const { selectedAccount, apiType } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();
  const [output, setOutput] = useState<string>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const resolveCurrency = (formValues: FormValues): TCurrencyCore => {
    if (formValues.customCurrencyType === 'multilocation') {
      return {
        multilocation: JSON.parse(formValues.currency) as TMultiLocation,
      };
    } else if (formValues.customCurrencyType === 'id') {
      return { id: formValues.currency };
    } else {
      return { symbol: formValues.currency };
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi } = formValues;
    const originAddress = formValues.address;
    const currency = resolveCurrency(formValues);
    if (useApi) {
      return fetchFromApi(
        {
          origin: formValues.from,
          destination: formValues.to,
          accountOrigin: originAddress,
          accountDestination: formValues.destinationAddress,
          currency,
          amount: formValues.amount,
        },
        `/transfer-info`,
        'POST',
        true,
      );
    } else {
      const Sdk =
        apiType === 'PAPI'
          ? await import('@paraspell/sdk')
          : await import('@paraspell/sdk-pjs');

      return Sdk.getTransferInfo({
        origin: formValues.from,
        destination: formValues.to,
        accountOrigin: originAddress,
        accountDestination: formValues.destinationAddress,
        currency: {
          ...currency,
          amount: formValues.amount,
        },
      });
    }
  };

  const submit = async (formValues: FormValues) => {
    closeAlert();
    closeOutputAlert();
    if (!selectedAccount) {
      alert('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  const onAlertCloseClick = () => closeAlert();

  const onOutputAlertCloseClick = () => closeOutputAlert();

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>Transfer Info 📩</Title>
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
            The transfer info feature provides essential details, including
            fees, transfer sufficiency, and more.
          </Text>
        </Box>
        <TransferInfoForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
        {outputAlertOpened && output && (
          <OutputAlert
            useLinkIcon
            output={output}
            onClose={onOutputAlertCloseClick}
          />
        )}
      </Box>
    </Stack>
  );
};

export default TransferInfo;
