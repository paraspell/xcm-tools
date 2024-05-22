import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "./ErrorAlert";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import TransferInfoForm, { FormValues } from "./TransferInfoForm";
import OutputAlert from "./OutputAlert";
import { getTransferInfo } from "@paraspell/sdk";

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

  const onSubmit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    try {
      const output = await getTransferInfo(
        formValues.from,
        formValues.to,
        selectedAccount.address,
        formValues.destinationAddress,
        formValues.currency,
        formValues.amount
      );
      console.log(output);
      setOutput(JSON.stringify(output, null, 2));
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

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onOutputAlertCloseClick = () => {
    closeOutputAlert();
  };

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
