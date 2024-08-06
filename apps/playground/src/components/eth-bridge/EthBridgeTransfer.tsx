import { Stack, Title, Box, Button } from "@mantine/core";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { BrowserProvider, ethers } from "ethers";
import ErrorAlert from "../ErrorAlert";
import EthBridgeTransferForm, { FormValues } from "./EthBridgeTransferForm";
import { EvmBuilder } from "@paraspell/sdk";

const EthBridgeTransfer = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        console.log("Please connect to MetaMask.");
        setSelectedAccount(null);
      } else {
        setSelectedAccount(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on(
        "accountsChanged",
        handleAccountsChanged as (...args: unknown[]) => void
      );
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(tempProvider);
    try {
      await tempProvider.send("eth_requestAccounts", []);
      const tempSigner = await tempProvider.getSigner();
      const account = await tempSigner.getAddress();
      setSelectedAccount(account);
      console.log("Wallet connected:", account);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const onConnectWallet = () => void connectWallet();

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const submitEthTransaction = async ({
    to,
    amount,
    currency,
    address,
  }: FormValues) => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error("Signer not initialized");
    }

    await EvmBuilder(provider)
      .to(to)
      .amount(amount)
      .currency(currency)
      .address(address)
      .signer(signer)
      .build();
  };

  const submit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw new Error("No account selected!");
    }

    setLoading(true);

    try {
      await submitEthTransaction(formValues);
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
        <Title order={3}>Ethereum Bridge Transfer</Title>
        <Button size="xs" variant="outline" onClick={onConnectWallet}>
          {selectedAccount
            ? `Connected: ${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`
            : "Connect Ethereum Wallet"}
        </Button>
        <EthBridgeTransferForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message
              .split("\n\n")
              .map((line, index) => <p key={index}>{line}</p>)}{" "}
          </ErrorAlert>
        )}
      </Box>
    </Stack>
  );
};

export default EthBridgeTransfer;
