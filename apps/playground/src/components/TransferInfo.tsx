import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "./ErrorAlert";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import type { FormValues } from "./TransferInfoForm";
import TransferInfoForm from "./TransferInfoForm";
import OutputAlert from "./OutputAlert";
import { getTransferInfo } from "@paraspell/sdk";
import { fetchFromApi } from "../utils/submitUsingApi";
import { replaceBigInt } from "../utils/replaceBigInt";

const TransferInfo = () => {
  const { selectedAccount } = useWallet();

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

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi } = formValues;
    const originAddress = selectedAccount?.address ?? "";
    const currency =
      formValues.customCurrencyType === "id"
        ? { id: formValues.currency }
        : { symbol: formValues.currency };
    if (useApi) {
      return await fetchFromApi(
        {
          origin: formValues.from,
          destination: formValues.to,
          accountOrigin: originAddress,
          accountDestination: formValues.destinationAddress,
          currency,
          amount: formValues.amount,
        },
        `/transfer-info`,
        "POST",
        true,
      );
    } else {
      return await getTransferInfo(
        formValues.from,
        formValues.to,
        originAddress,
        formValues.destinationAddress,
        currency,
        formValues.amount,
      );
    }
  };

  const submit = async (formValues: FormValues) => {
    closeAlert();
    closeOutputAlert();
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      setOutput(JSON.stringify(output, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
    } catch (e) {
      if (e instanceof Error) {
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

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Transfer info</Title>
        <TransferInfoForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
        {outputAlertOpened && (
          <OutputAlert useLinkIcon onClose={onOutputAlertCloseClick}>
            {output}
          </OutputAlert>
        )}
      </Box>
    </Stack>
  );
};

export default TransferInfo;
