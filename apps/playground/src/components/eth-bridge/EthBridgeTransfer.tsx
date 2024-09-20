import { Stack, Title, Box, Button } from "@mantine/core";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { BrowserProvider, ethers, LogDescription } from "ethers";
import ErrorAlert from "../ErrorAlert";
import EthBridgeTransferForm, {
  FormValues,
  FormValuesTransformed,
} from "./EthBridgeTransferForm";
import { EvmBuilder } from "@paraspell/sdk";
import { fetchFromApi } from "../../utils/submitUsingApi";
import { IGateway__factory } from "@snowbridge/contract-types";
import { MultiAddressStruct } from "@snowbridge/contract-types/dist/IGateway";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/keyring";

interface ApiResponse {
  token: string;
  destinationParaId: number;
  destinationFee: string;
  amount: string;
  fee: string;
}

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

  const submitEthTransactionSdk = async ({
    to,
    amount,
    currency,
    address,
  }: FormValuesTransformed) => {
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
      .currency({ symbol: currency?.symbol ?? "" })
      .address(address)
      .signer(signer)
      .build();
  };

  const submitEthTransactionApi = async (formValues: FormValuesTransformed) => {
    const { currency } = formValues;
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error("Signer not initialized");
    }

    const apiResponse = (await fetchFromApi(
      {
        ...formValues,
        destAddress: formValues.address,
        address: await signer.getAddress(),
        currency: { symbol: currency?.symbol ?? "" },
      },
      "/x-transfer-eth",
      "POST",
      true
    )) as ApiResponse;

    const GATEWAY_CONTRACT = "0xEDa338E4dC46038493b885327842fD3E301CaB39";

    const contract = IGateway__factory.connect(GATEWAY_CONTRACT, signer);

    const abi = ethers.AbiCoder.defaultAbiCoder();

    const address: MultiAddressStruct = {
      data: abi.encode(
        ["bytes32"],
        [u8aToHex(decodeAddress(formValues.address))]
      ),
      kind: 1,
    };

    const response = await contract.sendToken(
      apiResponse.token,
      apiResponse.destinationParaId,
      address,
      apiResponse.destinationFee,
      apiResponse.amount,
      {
        value: apiResponse.fee,
      }
    );
    const receipt = await response.wait(1);

    if (receipt === null) {
      throw new Error("Error waiting for transaction completion");
    }

    if (receipt?.status !== 1) {
      throw new Error("Transaction failed");
    }

    const events: LogDescription[] = [];
    receipt.logs.forEach((log) => {
      const event = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (event !== null) {
        events.push(event);
      }
    });

    return true;
  };

  const submit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw new Error("No account selected!");
    }

    setLoading(true);

    try {
      if (formValues.useApi) {
        await submitEthTransactionApi(formValues);
      } else {
        await submitEthTransactionSdk(formValues);
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
        <Title order={3}>Ethereum Bridge Transfer</Title>
        <Button
          size="xs"
          variant="outline"
          onClick={onConnectWallet}
          data-testid="btn-connect-eth-wallet"
        >
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
