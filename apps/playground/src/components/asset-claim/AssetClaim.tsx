import { Stack, Title, Box } from "@mantine/core";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { Builder, createApiInstanceForNode } from "@paraspell/sdk";
import { ApiPromise } from "@polkadot/api";
import { Signer } from "@polkadot/api/types";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { useState, useEffect } from "react";
import { useWallet } from "../../hooks/useWallet";
import { submitTransaction } from "../../utils";
import ErrorAlert from "../ErrorAlert";
import AssetClaimForm, { FormValues } from "./AssetClaimForm";
import { submitTxUsingApi } from "../../utils/submitUsingApi";

const AssetClaim = () => {
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

  const createTransferTx = (
    { from, amount, address }: FormValues,
    api: ApiPromise
  ) => {
    return Builder(api)
      .claimFrom(from)
      .fungible([
        {
          id: {
            Concrete: {
              parents: from === "Polkadot" || from === "Kusama" ? 0 : 1,
              interior: {
                Here: null,
              },
            },
          },
          fun: { Fungible: amount },
        },
      ])
      .account(address)
      .build();
  };

  const submitUsingSdk = async (
    formValues: FormValues,
    injectorAddress: string,
    signer: Signer
  ) => {
    const api = await createApiInstanceForNode(formValues.from);
    const tx = await createTransferTx(formValues, api);
    await submitTransaction(api, tx, signer, injectorAddress);
  };

  const submit = async (formValues: FormValues) => {
    const { useApi, from, amount } = formValues;

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
            from,
            address: formValues.address,
            fungible: [
              {
                id: {
                  Concrete: {
                    parents: from === "Polkadot" || from === "Kusama" ? 0 : 1,
                    interior: "Here",
                  },
                },
                fun: { Fungible: amount },
              },
            ],
          },
          formValues.from,
          "/asset-claim",
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

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Title order={3}>Asset Claim</Title>
        <AssetClaimForm onSubmit={onSubmit} loading={loading} />
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

export default AssetClaim;
