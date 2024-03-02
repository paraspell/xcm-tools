import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "../ErrorAlert";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { fetchFromApi } from "../../utils/submitUsingApi";
import {
  closeChannels,
  createApiInstanceForNode,
  openChannels,
} from "@paraspell/sdk";
import OutputAlert from "../OutputAlert";
import ChannelsForm, { FormValues } from "./ChannelsForm";
import { ApiPromise } from "@polkadot/api";
import { useWallet } from "../../providers/WalletProvider";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { buildTx, submitTransaction } from "../../utils";

const ChannelsQueries = () => {
  const { selectedAccount } = useWallet();

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

  const submitUsingSdk = async (
    { func, from, to, maxSize, maxMessageSize, inbound, outbound }: FormValues,
    api: ApiPromise
  ) => {
    switch (func) {
      case "OPEN_CHANNEL":
        return openChannels.openChannel({
          api,
          origin: from,
          destination: to,
          maxSize: Number(maxSize),
          maxMessageSize: Number(maxMessageSize),
        });
      case "CLOSE_CHANNEL":
        return closeChannels.closeChannel({
          api,
          origin: from,
          inbound: Number(inbound),
          outbound: Number(outbound),
        });
    }
  };

  const getQueryResult = async (formValues: FormValues, api: ApiPromise) => {
    const { func, useApi } = formValues;
    if (useApi) {
      return await fetchFromApi(
        formValues,
        `/hrmp/channels`,
        func === "OPEN_CHANNEL" ? "POST" : "DELETE"
      );
    } else {
      return await submitUsingSdk(formValues, api);
    }
  };

  const onSubmit = async (formValues: FormValues) => {
    const { from } = formValues;

    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      const api = await createApiInstanceForNode(from);
      const output = await getQueryResult(formValues, api);
      setOutput(JSON.stringify(output, null, 2));
      openOutputAlert();
      closeErrorAlert();
      await submitTransaction(
        api,
        buildTx(api, output),
        injector.signer,
        selectedAccount.address
      );
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

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Pallets queries</Title>
        <ChannelsForm onSubmit={onSubmit} loading={loading} />
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

export default ChannelsQueries;
