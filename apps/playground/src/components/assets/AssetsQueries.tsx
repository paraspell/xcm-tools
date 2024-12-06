import { Stack, Title, Box, Alert, Text } from "@mantine/core";
import ErrorAlert from "../ErrorAlert";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { fetchFromApi } from "../../utils/submitUsingApi";
import type { FormValues } from "./AssetsForm";
import AssetsForm from "./AssetsForm";
import type {
  TCurrencyCore,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
} from "@paraspell/sdk";
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

  const submitUsingSdk = async (formValues: FormValues) => {
    const { func, node, currency, address } = formValues;
    const Sdk =
      apiType === "PAPI"
        ? await import("@paraspell/sdk/papi")
        : await import("@paraspell/sdk");

    const resolvedCurrency = resolveCurrency(formValues);

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
        return getParaId(node as TNodePolkadotKusama);
      case "BALANCE_NATIVE":
        return Sdk.getBalanceNative({
          address,
          node: node as TNodePolkadotKusama,
        });
      case "BALANCE_FOREIGN":
        return Sdk.getBalanceForeign({
          address,
          node: node as TNodePolkadotKusama,
          currency: resolvedCurrency,
        });
      case "ASSET_BALANCE":
        return Sdk.getAssetBalance({
          address,
          node: node as TNodePolkadotKusama,
          currency: resolvedCurrency,
        });
      case "MAX_NATIVE_TRANSFERABLE_AMOUNT":
        return Sdk.getMaxNativeTransferableAmount({
          address,
          node: node as TNodeDotKsmWithRelayChains,
          currency:
            (resolvedCurrency as { symbol: string }).symbol.length > 0
              ? (resolvedCurrency as { symbol: string })
              : undefined,
        });
      case "MAX_FOREIGN_TRANSFERABLE_AMOUNT":
        return Sdk.getMaxForeignTransferableAmount({
          address,
          node: node as TNodePolkadotKusama,
          currency: resolvedCurrency,
        });
      case "TRANSFERABLE_AMOUNT":
        return Sdk.getTransferableAmount({
          address,
          node: node as TNodePolkadotKusama,
          currency: resolvedCurrency,
        });
      case "EXISTENTIAL_DEPOSIT":
        return Sdk.getExistentialDeposit(
          node as TNodeWithRelayChains,
          (resolvedCurrency as { symbol: string }).symbol.length > 0
            ? (resolvedCurrency as { symbol: string })
            : undefined,
        );
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
        return `/nodes/${node}/para-id`;
      case "BALANCE_NATIVE":
        return apiType === "PAPI"
          ? `/balance/${node}/native-papi`
          : `/balance/${node}/native`;
      case "BALANCE_FOREIGN":
        return apiType === "PAPI"
          ? `/balance/${node}/foreign-papi`
          : `/balance/${node}/foreign`;
      case "ASSET_BALANCE":
        return apiType === "PAPI"
          ? `/balance/${node}/asset-papi`
          : `/balance/${node}/asset`;
      case "MAX_NATIVE_TRANSFERABLE_AMOUNT":
        return apiType === "PAPI"
          ? `/balance/${node}/max-native-transferable-amount-papi`
          : `/balance/${node}/max-native-transferable-amount`;
      case "MAX_FOREIGN_TRANSFERABLE_AMOUNT":
        return apiType === "PAPI"
          ? `/balance/${node}/max-foreign-transferable-amount-papi`
          : `/balance/${node}/max-foreign-transferable-amount`;
      case "TRANSFERABLE_AMOUNT":
        return apiType === "PAPI"
          ? `/balance/${node}/transferable-amount-papi`
          : `/balance/${node}/transferable`;
      case "EXISTENTIAL_DEPOSIT":
        return `/balance/${node}/existential-deposit`;
    }
  };

  const resolveCurrency = (formValues: FormValues): TCurrencyCore => {
    if (formValues.currencyType === "multilocation") {
      return {
        multilocation: JSON.parse(formValues.currency) as TMultiLocation,
      };
    } else if (formValues.currencyType === "id") {
      return { id: formValues.currency };
    } else {
      return { symbol: formValues.currency };
    }
  };

  const getQueryResult = async (formValues: FormValues): Promise<unknown> => {
    const { useApi, func, address } = formValues;
    const shouldUsePost =
      func === "BALANCE_FOREIGN" ||
      func === "BALANCE_NATIVE" ||
      func === "ASSET_BALANCE" ||
      func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
      func === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
      func === "TRANSFERABLE_AMOUNT" ||
      func === "EXISTENTIAL_DEPOSIT";
    const resolvedCurrency = resolveCurrency(formValues);
    if (useApi) {
      return fetchFromApi(
        shouldUsePost
          ? {
              address,
              ...((func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
                func === "EXISTENTIAL_DEPOSIT") &&
              (resolvedCurrency as { symbol: string }).symbol.length === 0
                ? {}
                : { currency: resolvedCurrency }),
            }
          : formValues,
        `${getEndpoint(formValues)}`,
        shouldUsePost ? "POST" : "GET",
        shouldUsePost,
      );
    } else {
      return submitUsingSdk(formValues);
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
