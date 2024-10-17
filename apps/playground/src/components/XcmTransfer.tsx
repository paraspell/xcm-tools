import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "./ErrorAlert";
import type { FormValuesTransformed } from "./TransferForm";
import TransferForm from "./TransferForm";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import type {
  Extrinsic,
  TCurrencyInput,
  TMultiLocation,
  TNode,
  TNodePolkadotKusama,
} from "@paraspell/sdk";
import type { TPapiTransaction } from "@paraspell/sdk/papi";
import { getOtherAssets, isRelayChain } from "@paraspell/sdk/papi";
import type { PolkadotClient, PolkadotSigner } from "polkadot-api";
import type { Signer } from "@polkadot/api/types";
import { useState, useEffect } from "react";
import { submitTransaction, submitTransactionPapi } from "../utils";
import { getTxFromApi } from "../utils/submitUsingApi";
import { useWallet } from "../hooks/useWallet";
import type { ApiPromise } from "@polkadot/api";

const XcmTransfer = () => {
  const { selectedAccount, apiType, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const determineCurrency = ({
    from,
    isCustomCurrency,
    customCurrency,
    customCurrencyType,
    currency,
  }: FormValuesTransformed): TCurrencyInput => {
    if (isCustomCurrency) {
      if (customCurrencyType === "id") {
        return {
          id: customCurrency,
        };
      } else if (customCurrencyType === "symbol") {
        return {
          symbol: customCurrency,
        };
      } else {
        return {
          multilocation: JSON.parse(customCurrency) as TMultiLocation,
        };
      }
    } else if (currency) {
      if (!currency.assetId) {
        return { symbol: currency.symbol ?? "" };
      }

      const hasDuplicateIds = isRelayChain(from)
        ? false
        : getOtherAssets(from as TNodePolkadotKusama).filter(
            (asset) => asset.assetId === currency.assetId,
          ).length > 1;
      return hasDuplicateIds
        ? { symbol: currency.symbol ?? "" }
        : {
            id: currency.assetId,
          };
    } else {
      throw Error("Currency is required");
    }
  };

  const submit = async (formValues: FormValuesTransformed) => {
    const { from, to, amount, address, useApi } = formValues;

    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    const signer = await getSigner();

    try {
      const Sdk =
        apiType === "PAPI"
          ? await import("@paraspell/sdk/papi")
          : await import("@paraspell/sdk");

      const api = await Sdk.createApiInstanceForNode(from);

      let tx: Extrinsic | TPapiTransaction;
      if (useApi) {
        tx = await getTxFromApi(
          {
            ...formValues,
            from:
              formValues.from === "Polkadot" || formValues.from === "Kusama"
                ? undefined
                : formValues.from,
            to:
              formValues.to === "Polkadot" || formValues.to === "Kusama"
                ? undefined
                : formValues.to,
            currency: determineCurrency(formValues),
          },
          api,
          apiType === "PJS" ? "/x-transfer-hash" : "/x-transfer-papi",
          selectedAccount.address,
          apiType,
          "POST",
          true,
        );
      } else {
        const builder = Sdk.Builder(api as ApiPromise & PolkadotClient);
        if (from === "Polkadot" || from === "Kusama") {
          tx = await builder
            .to(to as TNode)
            .amount(amount)
            .address(address)
            .build();
        } else if (to === "Polkadot" || to === "Kusama") {
          tx = await builder.from(from).amount(amount).address(address).build();
        } else {
          tx = await builder
            .from(from)
            .to(to)
            .currency(determineCurrency(formValues))
            .feeAsset("0")
            .amount(amount)
            .address(address)
            .build();
        }
      }

      if (apiType === "PAPI") {
        await submitTransactionPapi(
          tx as TPapiTransaction,
          signer as PolkadotSigner,
        );
      } else {
        await submitTransaction(
          api as ApiPromise,
          tx as Extrinsic,
          signer as Signer,
          selectedAccount.address,
        );
      }

      alert("Transaction was successful!");
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

  const onSubmit = (formValues: FormValuesTransformed) =>
    void submit(formValues);

  const onAlertCloseClick = () => closeAlert();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>New XCM transfer</Title>
        <TransferForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message}
          </ErrorAlert>
        )}
      </Box>
    </Stack>
  );
};

export default XcmTransfer;
