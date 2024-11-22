import { Box, Container, Stack, Title } from "@mantine/core";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useEffect, useState } from "react";
import ErrorAlert from "../components/ErrorAlert";
import OutputAlert from "../components/OutputAlert";
import type { FormValues } from "../components/analyser/AnalyserForm";
import AnalyserForm from "../components/analyser/AnalyserForm";
import { convertMultilocationToUrlJson } from "@paraspell/xcm-analyser";
import { fetchFromApi } from "../utils/submitUsingApi";

const XcmAnalyserSandbox = () => {
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
    return convertMultilocationToUrlJson(input);
  };

  const convertUsingApi = async (input: string) => {
    return fetchFromApi(
      { multilocation: JSON.parse(input) as Record<string, unknown> },
      "/xcm-analyser",
      "POST",
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
    <Container p="xl">
      <Stack gap="xs">
        <Stack w="100%" maw={400} mx="auto" gap="lg">
          <Title order={3}>XCM Analyser Sandbox</Title>
          <AnalyserForm onSubmit={onSubmit} loading={loading} />
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
            <OutputAlert useLinkIcon onClose={onOutputAlertCloseClick}>
              {output}
            </OutputAlert>
          )}
        </Box>
      </Stack>
    </Container>
  );
};

export default XcmAnalyserSandbox;
