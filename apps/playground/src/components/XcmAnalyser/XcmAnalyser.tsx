import {
  Box,
  Center,
  Container,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { convertLocationToUrlJson } from '@paraspell/xcm-analyser';
import { useEffect, useState } from 'react';

import type { FormValues } from '../../components/XcmAnalyser/XcmAnalyserForm';
import AnalyserForm from '../../components/XcmAnalyser/XcmAnalyserForm';
import XcmAnalyserStateProvider from '../../providers/XcmAnalyserState/XcmAnalyserStateProvider';
import { fetchFromApi } from '../../utils';
import { showErrorNotification } from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { VersionBadge } from '../common/VersionBadge';

const VERSION = import.meta.env.VITE_XCM_ANALYSER_VERSION as string;

export const XcmAnalyser = () => {
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

  const convertUsingSdk = (input: string) => {
    return convertLocationToUrlJson(input);
  };

  const convertUsingApi = async (input: string) => {
    return fetchFromApi(
      { location: JSON.parse(input) as Record<string, unknown> },
      '/xcm-analyser',
      'POST',
      true,
    );
  };

  const convert = async ({ useApi, input }: FormValues) => {
    if (useApi) {
      return convertUsingApi(input);
    }
    return convertUsingSdk(input);
  };

  const submit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await convert(formValues);
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
    <Container px="xl" pb="xl">
      <Stack gap="xs">
        <Stack w="100%" maw={460} mx="auto" gap="0">
          <Box px="xl" pb="xl">
            <Center mb="xs">
              <Title order={2}>XCM Analyser 🔎 </Title>
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
              This tool allows you to convert XCM locations to human readable
              format (URLs)
            </Text>
          </Box>
          <XcmAnalyserStateProvider>
            <AnalyserForm onSubmit={onSubmit} loading={loading} />
          </XcmAnalyserStateProvider>
        </Stack>
        <Center ref={targetRef}>
          {errorAlertOpened && (
            <ErrorAlert onAlertCloseClick={onErrorAlertCloseClick}>
              {error?.message}
            </ErrorAlert>
          )}
        </Center>
        <Center>
          {outputAlertOpened && output && (
            <OutputAlert
              useLinkIcon
              output={output}
              onClose={onOutputAlertCloseClick}
            />
          )}
        </Center>
      </Stack>
    </Container>
  );
};
