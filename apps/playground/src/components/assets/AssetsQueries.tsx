import { Stack, Title, Box, Alert, Text } from '@mantine/core';
import ErrorAlert from '../ErrorAlert';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { fetchFromApi } from '../../utils/submitUsingApi';
import AssetsForm, { FormValues } from './AssetsForm';
import {
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetsObject,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  hasSupportForAsset,
} from '@paraspell/sdk';
import { IconJson } from '@tabler/icons-react';

const AssetsQueries = () => {
  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] = useDisclosure(false);
  const [outputAlertOpened, { open: openOutputAlert, close: closeOutputAlert }] =
    useDisclosure(false);

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

  const submitUsingSdk = async ({ func, node, symbol }: FormValues) => {
    switch (func) {
      case 'ASSETS_OBJECT':
        return getAssetsObject(node);
      case 'ASSET_ID':
        return getAssetId(node, symbol);
      case 'RELAYCHAIN_SYMBOL':
        return getRelayChainSymbol(node);
      case 'NATIVE_ASSETS':
        return getNativeAssets(node);
      case 'OTHER_ASSETS':
        return getOtherAssets(node);
      case 'ALL_SYMBOLS':
        return getAllAssetsSymbols(node);
      case 'DECIMALS':
        return getAssetDecimals(node, symbol);
      case 'HAS_SUPPORT':
        return hasSupportForAsset(node, symbol);
      case 'PARA_ID':
        return getParaId(node);
    }
  };

  const getEndpoint = ({ func, node }: FormValues) => {
    switch (func) {
      case 'ASSETS_OBJECT':
        return `${node}`;
      case 'ASSET_ID':
        return `${node}/id`;
      case 'RELAYCHAIN_SYMBOL':
        return `${node}/relay-chain-symbol`;
      case 'NATIVE_ASSETS':
        return `${node}/native`;
      case 'OTHER_ASSETS':
        return `${node}/other`;
      case 'ALL_SYMBOLS':
        return `${node}/all-symbols`;
      case 'DECIMALS':
        return `${node}/decimals`;
      case 'HAS_SUPPORT':
        return `${node}/has-support`;
      case 'PARA_ID':
        return `${node}/para-id`;
    }
  };

  const getQueryResult = async (formValues: FormValues) => {
    const { useApi } = formValues;
    if (useApi) {
      return await fetchFromApi(formValues, `/assets/${getEndpoint(formValues)}`);
    } else {
      return await submitUsingSdk(formValues);
    }
  };

  const onSubmit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output, null, 2));
      openOutputAlert();
      closeErrorAlert();
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setError(e);
        openErrorAlert();
        closeOutputAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onErrorAlertCloseClick = () => {
    closeErrorAlert();
  };

  const onOutputAlertCloseClick = () => {
    closeOutputAlert();
  };

  const jsonIcon = <IconJson size={24} />;

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Assets queries</Title>
        <AssetsForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {errorAlertOpened && (
          <ErrorAlert onAlertCloseClick={onErrorAlertCloseClick}>{error?.message}</ErrorAlert>
        )}
      </Box>
      <Box>
        {outputAlertOpened && (
          <Alert
            color="green"
            title="Output"
            icon={jsonIcon}
            withCloseButton
            onClose={onOutputAlertCloseClick}
            mt="lg"
            style={{ overflowWrap: 'anywhere' }}
          >
            <Text component="pre" size="sm">
              {output}
            </Text>
          </Alert>
        )}
      </Box>
    </Stack>
  );
};

export default AssetsQueries;
