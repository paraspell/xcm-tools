import { Stack, Title, Box } from '@mantine/core';
import ErrorAlert from '../ErrorAlert';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { fetchFromApi } from '../../utils/submitUsingApi';
import { getDefaultPallet, getSupportedPallets } from '@paraspell/sdk';
import type { FormValues } from './PalletsForm';
import PalletsForm from './PalletsForm';
import OutputAlert from '../OutputAlert';

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

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Pallets queries</Title>
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
        {outputAlertOpened && (
          <OutputAlert onClose={onOutputAlertCloseClick}>{output}</OutputAlert>
        )}
      </Box>
    </Stack>
  );
};

export default PalletsQueries;
