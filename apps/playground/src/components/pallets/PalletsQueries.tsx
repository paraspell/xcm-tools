import {
  Stack,
  Box,
  useMantineColorScheme,
  Center,
  Title,
  Text,
  Badge,
} from '@mantine/core';
import ErrorAlert from '../ErrorAlert';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { fetchFromApi } from '../../utils';
import { getDefaultPallet, getSupportedPallets } from '@paraspell/sdk';
import type { FormValues } from './PalletsForm';
import PalletsForm from './PalletsForm';
import OutputAlert from '../OutputAlert';
import { showErrorNotification } from '../../utils/notifications';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const PalletsQueries = () => {
  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);
  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [error, setError] = useState<Error>();
  const [output, setOutput] = useState<string>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const submitUsingSdk = ({ func, node }: FormValues) => {
    switch (func) {
      case 'ALL_PALLETS':
        return getSupportedPallets(node);
      case 'DEFAULT_PALLET':
        return getDefaultPallet(node);
    }
  };

  const getEndpoint = ({ func, node }: FormValues) => {
    switch (func) {
      case 'ALL_PALLETS':
        return `${node}`;
      case 'DEFAULT_PALLET':
        return `${node}/default`;
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi } = formValues;
    if (useApi) {
      return fetchFromApi(formValues, `/pallets/${getEndpoint(formValues)}`);
    } else {
      return submitUsingSdk(formValues);
    }
  };

  const submit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output, null, 2));
      openOutputAlert();
      closeErrorAlert();
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openErrorAlert();
        closeOutputAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  const onErrorAlertCloseClick = () => {
    closeErrorAlert();
  };

  const onOutputAlertCloseClick = () => {
    closeOutputAlert();
  };

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>Pallets 📦</Title>
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
            Query the supported pallets and the default pallet for transfers for
            a given node.
          </Text>
        </Box>
        <PalletsForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {errorAlertOpened && (
          <ErrorAlert onAlertCloseClick={onErrorAlertCloseClick}>
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
  );
};

export default PalletsQueries;
