import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "./ErrorAlert";
import type { FormValuesTransformed } from "./TransferForm";
import TransferForm from "./TransferForm";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import type {
  TCurrencyInput,
  TMultiLocation,
  TNode,
  TNodePolkadotKusama,
} from "@paraspell/sdk/papi";
import {
  Builder,
  createApiInstanceForNode,
  getOtherAssets,
  isRelayChain,
} from "@paraspell/sdk/papi";
import type { PolkadotClient } from "polkadot-api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import type { Signer } from "@polkadot/api/types";
import { useState, useEffect } from "react";
import { submitTransactionPapi } from "../utils";
import { submitTxUsingApi } from "../utils/submitUsingApi";
import { useWallet } from "../hooks/useWallet";
import type {
  InjectedExtension,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer";
import {
  getInjectedExtensions,
  connectInjectedExtension,
} from "polkadot-api/pjs-signer";

const XcmTransfer = () => {
  const { selectedAccount } = useWallet();

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
            (asset) => asset.assetId === currency.assetId
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

  const createTransferTx = (
    values: FormValuesTransformed,
    api: PolkadotClient
  ) => {
    const { from, to, amount, address } = values;
    if (from === "Polkadot" || from === "Kusama") {
      return Builder(api)
        .to(to as TNode)
        .amount(amount)
        .address(address)
        .build();
    } else if (to === "Polkadot" || to === "Kusama") {
      return Builder(api).from(from).amount(amount).address(address).build();
    } else {
      return Builder(api)
        .from(from)
        .to(to)
        .currency(determineCurrency(values))
        .feeAsset("0")
        .amount(amount)
        .address(address)
        .build();
    }
  };

  const submitUsingSdk = async (
    formValues: FormValuesTransformed,
    _injectorAddress: string,
    _signer: Signer
  ) => {
    const api = await createApiInstanceForNode(formValues.from);
    const tx = await createTransferTx(formValues, api);

    const extensions: string[] = getInjectedExtensions();

    // Connect to an extension
    const selectedExtension: InjectedExtension = await connectInjectedExtension(
      extensions[0]
    );

    // Get accounts registered in the extension
    const accounts: InjectedPolkadotAccount[] = selectedExtension.getAccounts();

    // The signer for each account is in the `polkadotSigner` property of `InjectedPolkadotAccount`
    const polkadotSigner = accounts[0].polkadotSigner;

    await submitTransactionPapi(tx, polkadotSigner);
    //await submitTransaction(api, tx, signer, injectorAddress);
  };

  const submit = async (formValues: FormValuesTransformed) => {
    const { useApi } = formValues;
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      if (useApi) {
        await submitTxUsingApi(
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
          formValues.from,
          "/x-transfer",
          selectedAccount.address,
          injector.signer,
          "POST",
          true
        );
      } else {
        await submitUsingSdk(
          formValues,
          selectedAccount.address,
          injector.signer
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
