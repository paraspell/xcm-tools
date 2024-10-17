import { Stack, Title, Box, Alert, Text } from "@mantine/core";
import ErrorAlert from "../ErrorAlert";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { fetchFromApi } from "../../utils/submitUsingApi";
import type { FormValues } from "./AssetsForm";
import AssetsForm from "./AssetsForm";
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
} from "@paraspell/sdk";
import { IconJson } from "@tabler/icons-react";
import { useWallet } from "../../hooks/useWallet";

const AssetsQueries = () => {
  const [errorAlertOpened, { open: openErrorAlert, close: closeErrorAlert }] =
    useDisclosure(false);
  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const { apiType } = useWallet();

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

  const submitUsingSdk = async ({
    func,
    node,
    currency,
    currencyType,
    address,
  }: FormValues) => {
    const Sdk =
      apiType === "PAPI"
        ? await import("@paraspell/sdk/papi")
        : await import("@paraspell/sdk");

    switch (func) {
      case "ASSETS_OBJECT":
        return getAssetsObject(node);
      case "ASSET_ID":
        return getAssetId(node, currency);
      case "RELAYCHAIN_SYMBOL":
        return getRelayChainSymbol(node);
      case "NATIVE_ASSETS":
        return getNativeAssets(node);
      case "OTHER_ASSETS":
        return getOtherAssets(node);
      case "ALL_SYMBOLS":
        return getAllAssetsSymbols(node);
      case "DECIMALS":
        return getAssetDecimals(node, currency);
      case "HAS_SUPPORT":
        return hasSupportForAsset(node, currency);
      case "PARA_ID":
        return getParaId(node);
      case "BALANCE_NATIVE":
        return Sdk.getBalanceNative({ address, node });
      case "BALANCE_FOREIGN":
        return Sdk.getBalanceForeign({
          address,
          node,
          currency:
            currencyType === "id" ? { id: currency } : { symbol: currency },
        });
    }
  };

  const getEndpoint = ({ func, node }: FormValues) => {
    switch (func) {
      case "ASSETS_OBJECT":
        return `/assets/${node}`;
      case "ASSET_ID":
        return `/assets/${node}/id`;
      case "RELAYCHAIN_SYMBOL":
        return `/assets/${node}/relay-chain-symbol`;
      case "NATIVE_ASSETS":
        return `/assets/${node}/native`;
      case "OTHER_ASSETS":
        return `/assets/${node}/other`;
      case "ALL_SYMBOLS":
        return `/assets/${node}/all-symbols`;
      case "DECIMALS":
        return `/assets/${node}/decimals`;
      case "HAS_SUPPORT":
        return `/assets/${node}/has-support`;
      case "PARA_ID":
        return `/assets/${node}/para-id`;
      case "BALANCE_NATIVE":
        return apiType === "PAPI"
          ? `/balance/${node}/native-papi`
          : `/balance/${node}/native`;
      case "BALANCE_FOREIGN":
        return apiType === "PAPI"
          ? `/balance/${node}/foreign-papi`
          : `/balance/${node}/foreign`;
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi, func, address, currencyType, currency } = formValues;
    const isBalanceQuery =
      func === "BALANCE_FOREIGN" || func === "BALANCE_NATIVE";
    if (useApi) {
      return await fetchFromApi(
        isBalanceQuery
          ? {
              address,
              currency:
                currencyType === "id" ? { id: currency } : { symbol: currency },
            }
          : formValues,
        `${getEndpoint(formValues)}`,
        isBalanceQuery ? "POST" : "GET",
        isBalanceQuery,
      );
    } else {
      return await submitUsingSdk(formValues);
    }
  };

  const submit = async (formValues: FormValues) => {
    setLoading(true);

    try {
      const output = await getQueryResult(formValues);
      if (typeof output === "bigint") {
        setOutput(output.toString());
      } else {
        setOutput(JSON.stringify(output, null, 2));
      }
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

  const onErrorAlertCloseClick = () => closeErrorAlert();

  const onOutputAlertCloseClick = () => closeOutputAlert();

  const jsonIcon = <IconJson size={24} />;

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Assets queries</Title>
        <AssetsForm onSubmit={onSubmit} loading={loading} />
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
          <Alert
            color="green"
            title="Output"
            icon={jsonIcon}
            withCloseButton
            onClose={onOutputAlertCloseClick}
            mt="lg"
            style={{ overflowWrap: "anywhere" }}
            data-testid="output"
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
