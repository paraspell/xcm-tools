import { Stack, Title, Box } from "@mantine/core";
import ErrorAlert from "./ErrorAlert";
import TransferForm, { FormValuesTransformed } from "./TransferForm";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { Builder, TNode, createApiInstanceForNode } from "@paraspell/sdk";
import { ApiPromise } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { Signer } from "@polkadot/api/types";
import { useState, useEffect } from "react";
import { submitTransaction } from "../utils";
import { submitTxUsingApi } from "../utils/submitUsingApi";
import { useWallet } from "../hooks/useWallet";

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
    isCustomCurrency,
    customCurrency,
    currency,
  }: FormValuesTransformed) => {
    if (isCustomCurrency) {
      return customCurrency;
    } else if (currency) {
      return currency.assetId
        ? { id: currency.assetId }
        : { symbol: currency.symbol ?? "" };
    } else {
      throw Error("Currency is required");
    }
  };

  const createTransferTx = (values: FormValuesTransformed, api: ApiPromise) => {
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
        .amount(amount)
        .address(address)
        .build();
    }
  };

  const submitUsingSdk = async (
    formValues: FormValuesTransformed,
    injectorAddress: string,
    signer: Signer
  ) => {
    const api = await createApiInstanceForNode(formValues.from);
    const tx = await createTransferTx(formValues, api);
    await submitTransaction(api, tx, signer, injectorAddress);
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
            currency:
              formValues.currency?.symbol ?? formValues.currency?.assetId,
          },
          formValues.from,
          "/x-transfer",
          selectedAccount.address,
          injector.signer
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
