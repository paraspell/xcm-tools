import { Stack, Title, Box, Button } from "@mantine/core";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useState, useEffect } from "react";
import type { BrowserProvider, LogDescription } from "ethers";
import { ethers } from "ethers";
import ErrorAlert from "../ErrorAlert";
import type {
  FormValues,
  FormValuesTransformed,
} from "./EthBridgeTransferForm";
import EthBridgeTransferForm from "./EthBridgeTransferForm";
import { EvmBuilder } from "@paraspell/sdk";
import { fetchFromApi } from "../../utils/submitUsingApi";
import { IGateway__factory } from "@snowbridge/contract-types";
import type { MultiAddressStruct } from "@snowbridge/contract-types/dist/IGateway";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/keyring";
import { Web3 } from "web3";
import type { EIP6963ProviderDetail, TEthBridgeApiResponse } from "../../types";
import EthWalletSelectModal from "../EthWalletSelectModal";
import EthAccountsSelectModal from "../EthAccountsSelectModal";

const EthBridgeTransfer = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setSelectedAccount(null);
      setAccounts([]);
    } else {
      setAccounts(accounts);
      setIsAccountModalOpen(true);
    }
  };

  useEffect(() => {
    if (selectedProvider && selectedProvider.provider) {
      const provider = selectedProvider.provider;

      provider.on("accountsChanged", handleAccountsChanged);

      return () => {
        provider.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [selectedProvider]);

  const connectWallet = async () => {
    try {
      const providerMap = await Web3.requestEIP6963Providers();

      if (providerMap.size === 0) {
        alert("No compatible Ethereum wallets found.");
        return;
      }

      const providerArray = Array.from(providerMap.values());

      setProviders(providerArray);
      setIsWalletModalOpen(true);
    } catch (error) {
      console.error("Error fetching providers:", error);
      alert("An error occurred while fetching wallet providers.");
    }
  };

  const onConnectWallet = () => void connectWallet();

  const selectProvider = async (providerInfo: EIP6963ProviderDetail) => {
    try {
      setIsWalletModalOpen(false);
      const provider = providerInfo.provider;

      if (!provider) {
        alert("Selected provider is not available.");
        return;
      }

      const tempProvider = new ethers.BrowserProvider(provider);
      setProvider(tempProvider);
      setSelectedProvider(providerInfo);

      const accounts = (await tempProvider.send(
        "eth_requestAccounts",
        [],
      )) as string[];

      if (accounts.length === 0) {
        alert("No accounts found in the selected wallet.");
        return;
      }

      setAccounts(accounts);
      setIsAccountModalOpen(true);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("An error occurred while connecting to the wallet.");
    }
  };

  const onProviderSelect = (provider: EIP6963ProviderDetail) => {
    void selectProvider(provider);
  };

  const onAccountSelect = (account: string) => {
    setIsAccountModalOpen(false);
    setSelectedAccount(account);
  };

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
      .currency({ symbol: currency?.symbol ?? "", amount })
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
      true,
    )) as TEthBridgeApiResponse;

    const GATEWAY_CONTRACT = "0xEDa338E4dC46038493b885327842fD3E301CaB39";

    const contract = IGateway__factory.connect(GATEWAY_CONTRACT, signer);

    const abi = ethers.AbiCoder.defaultAbiCoder();

    const address: MultiAddressStruct = {
      data: abi.encode(
        ["bytes32"],
        [u8aToHex(decodeAddress(formValues.address))],
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
      },
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

  const onWalletDisconnect = () => {
    setSelectedAccount(null);
    setAccounts([]);
    setIsWalletModalOpen(false);
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
      <EthWalletSelectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        providers={providers}
        onProviderSelect={onProviderSelect}
        onDisconnect={onWalletDisconnect}
      />
      <EthAccountsSelectModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        onAccountSelect={onAccountSelect}
      />
    </Stack>
  );
};

export default EthBridgeTransfer;
