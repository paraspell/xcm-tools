import { useForm } from "@mantine/form";
import {
  EXCHANGE_NODES,
  TExchangeNode,
  TransactionType,
} from "@paraspell/xcm-router";
import { isValidWalletAddress } from "../utils";
import { FC, useEffect, useState } from "react";
import {
  Text,
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  TextInput,
  Tooltip,
  Center,
  rem,
} from "@mantine/core";
import {
  getAllAssetsSymbols,
  NODES_WITH_RELAY_CHAINS,
  TNodeWithRelayChains,
} from "@paraspell/sdk";
import { Signer } from "@polkadot/api/types";
import { web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import AccountsModal from "./AccountsModal";
import { useDisclosure } from "@mantine/hooks";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { BrowserProvider, ethers } from "ethers";
import { IconInfoCircle } from "@tabler/icons-react";
import EthAccountsModal from "./EthAccountsModal";

export type TAutoSelect = "Auto select";

export type FormValues = {
  from: TNodeWithRelayChains;
  exchange: TExchangeNode | TAutoSelect;
  to: TNodeWithRelayChains;
  currencyFrom: string;
  currencyTo: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  transactionType: keyof typeof TransactionType;
  useApi: boolean;
  evmSigner?: Signer;
  evmInjectorAddress?: string;
  assetHubAddress?: string;
  ethSigner?: ethers.Signer;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const RouterTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [
    assetHubModalOpened,
    { open: openAssetHubModal, close: closeAssetHubModal },
  ] = useDisclosure(false);

  const [ethModalOpened, { open: openEthModal, close: closeEthModal }] =
    useDisclosure(false);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [ethAccounts, setEthAccounts] = useState<string[]>([]);
  const [assetHubAccounts, setAssetHubAccounts] = useState<
    InjectedAccountWithMeta[]
  >([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();

  const [selectedAssetHubAccount, setSelectedAssetHubAccount] =
    useState<InjectedAccountWithMeta>();

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [selectedEthAccount, setSelectedEthAccount] = useState<string | null>(
    null
  );

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const onEthAccountSelect = (account: string) => async () => {
    setSelectedEthAccount(account);
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    const tempSigner = await provider.getSigner(account);
    form.setFieldValue("ethSigner", tempSigner);
    closeEthModal();
  };

  const onAssetHubAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAssetHubAccount(account);
    closeAssetHubModal();
  };

  useEffect(() => {
    void (async () => {
      if (selectedAccount) {
        const injector = await web3FromAddress(selectedAccount.address);
        form.setFieldValue("evmSigner", injector.signer);
        form.setFieldValue("evmInjectorAddress", selectedAccount.address);
      }
    })();
  }, [selectedAccount]);

  useEffect(() => {
    void (async () => {
      if (selectedEthAccount) {
        if (!provider) {
          throw new Error("Provider not initialized");
        }

        const signer = await provider.getSigner();

        if (!signer) {
          throw new Error("Signer not initialized");
        }
        form.setFieldValue("ethSigner", signer);
      }
    })();
  }, [selectedEthAccount]);

  useEffect(() => {
    if (selectedAssetHubAccount) {
      form.setFieldValue("assetHubAddress", selectedAssetHubAccount.address);
    }
  }, [selectedAssetHubAccount]);

  const form = useForm<FormValues>({
    initialValues: {
      from: "Astar",
      to: "Moonbeam",
      exchange: "Auto select",
      currencyFrom: "ASTR",
      currencyTo: "GLMR",
      amount: "10000000000000000000",
      recipientAddress: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      slippagePct: "1",
      transactionType: "FULL_TRANSFER",
      useApi: false,
    },

    validate: {
      recipientAddress: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
    },
  });

  useEffect(() => {
    if (form.values.from === "Ethereum" || form.values.to === "Ethereum") {
      onAccountDisconnect();
    }
  }, [form.values.from, form.values.to]);

  useEffect(() => {
    if (form.values.from !== "Ethereum" || form.values.to !== "Ethereum") {
      onAssetHubAccountDisconnect();
      onEthWalletDisconnect();
    }
  }, [form.values.from, form.values.to]);

  const connectAssetHubWallet = async () => {
    try {
      const allAccounts = await web3Accounts();
      setAssetHubAccounts(
        allAccounts.filter((account) => !ethers.isAddress(account.address))
      );
      openAssetHubModal();
    } catch (error) {
      console.error("Failed to connect EVM wallet:", error);
      alert("Failed to connect EVM wallet");
    }
  };

  const onConnectAssetHubWallet = () => void connectAssetHubWallet();

  const connectEvmWallet = async () => {
    try {
      const allAccounts = await web3Accounts();
      setAccounts(
        allAccounts.filter((account) => ethers.isAddress(account.address))
      );
      openModal();
    } catch (error) {
      console.error("Failed to connect EVM wallet:", error);
      alert("Failed to connect EVM wallet");
    }
  };

  const onConnectEvmWallet = () => void connectEvmWallet();

  const connectEthWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(tempProvider);
    try {
      const accounts = (await tempProvider.send(
        "eth_requestAccounts",
        []
      )) as string[];
      console.log("Accounts:", accounts);
      setEthAccounts(accounts);
      openEthModal();
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const onConnectEthWallet = () => void connectEthWallet();

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue("evmSigner", undefined);
    form.setFieldValue("evmInjectorAddress", undefined);
    closeModal();
  };

  const onAssetHubAccountDisconnect = () => {
    setSelectedAssetHubAccount(undefined);
    form.setFieldValue("assetHubAddress", undefined);
    closeAssetHubModal();
  };

  const onEthWalletDisconnect = () => {
    setSelectedEthAccount(null);
    form.setFieldValue("ethSigner", undefined);
    closeEthModal();
  };

  const fromCurrencySymbols = [
    ...new Set(getAllAssetsSymbols(form.values.from)),
  ];
  const toCurrencySymbols = [...new Set(getAllAssetsSymbols(form.values.to))];

  const infoEthWallet = (
    <Tooltip
      label="You need to connect your Metamask wallet when choosing Ethereum as the origin or destination chain"
      position="top-end"
      withArrow
      transitionProps={{ transition: "pop-bottom-right" }}
    >
      <Text component="div" style={{ cursor: "help" }}>
        <Center>
          <IconInfoCircle
            style={{ width: rem(18), height: rem(18) }}
            stroke={1.5}
          />
        </Center>
      </Text>
    </Tooltip>
  );

  const infoAssetHubWallet = (
    <Tooltip
      label="You need to connect your AssetHub wallet (Polkadot wallet) when choosing Ethereum as the origin or destination chain"
      position="top-end"
      withArrow
      transitionProps={{ transition: "pop-bottom-right" }}
    >
      <Text component="div" style={{ cursor: "help" }}>
        <Center>
          <IconInfoCircle
            style={{ width: rem(18), height: rem(18) }}
            stroke={1.5}
          />
        </Center>
      </Text>
    </Tooltip>
  );

  const infoEvmWallet = (
    <Tooltip
      label="You need to connect yout Polkadot EVM wallet when choosing EVM chain as origin"
      position="top-end"
      withArrow
      transitionProps={{ transition: "pop-bottom-right" }}
    >
      <Text component="div" style={{ cursor: "help" }}>
        <Center>
          <IconInfoCircle
            style={{ width: rem(18), height: rem(18) }}
            stroke={1.5}
          />
        </Center>
      </Text>
    </Tooltip>
  );

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <EthAccountsModal
          isOpen={ethModalOpened}
          onClose={closeEthModal}
          accounts={ethAccounts}
          onAccountSelect={onEthAccountSelect}
          onDisconnect={onAccountDisconnect}
        />
        <AccountsModal
          isOpen={modalOpened}
          onClose={closeModal}
          accounts={accounts}
          onAccountSelect={onAccountSelect}
          title="Select evm account"
          onDisconnect={onAccountDisconnect}
        />
        <AccountsModal
          isOpen={assetHubModalOpened}
          onClose={closeAssetHubModal}
          accounts={assetHubAccounts}
          onAccountSelect={onAssetHubAccountSelect}
          title="Select AssetHub account"
          onDisconnect={onAssetHubAccountDisconnect}
        />
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("from")}
        />

        <Select
          label="Exchange node"
          placeholder="Pick value"
          data={["Auto select", ...EXCHANGE_NODES]}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("exchange")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("to")}
        />

        <Select
          label="Currency from"
          placeholder="Pick value"
          data={fromCurrencySymbols}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("currencyFrom")}
        />

        <Select
          label="Currency to"
          placeholder="Pick value"
          data={toCurrencySymbols}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("currencyTo")}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          {...form.getInputProps("recipientAddress")}
        />

        <TextInput
          label="Amount"
          placeholder="0"
          required
          {...form.getInputProps("amount")}
        />

        {!form.values.useApi && (
          <Select
            label="Transaction type"
            placeholder="Pick value"
            data={[
              TransactionType.TO_EXCHANGE.toString(),
              TransactionType.TO_DESTINATION.toString(),
              TransactionType.SWAP.toString(),
              TransactionType.FULL_TRANSFER.toString(),
              TransactionType.FROM_ETH.toString(),
              TransactionType.TO_ETH.toString(),
            ]}
            searchable
            required
            {...form.getInputProps("transactionType")}
          />
        )}

        <TextInput
          label="Slippage percentage (%)"
          placeholder="1"
          required
          {...form.getInputProps("slippagePct")}
        />

        <Group justify="space-between">
          <Checkbox label="Use XCM API" {...form.getInputProps("useApi")} />
          <Button.Group orientation="vertical">
            {(form.values.from === "Ethereum" ||
              form.values.to === "Ethereum") && (
              <Button
                size="xs"
                variant="outline"
                onClick={onConnectEthWallet}
                rightSection={infoEthWallet}
              >
                {selectedEthAccount
                  ? `Connected: ${selectedEthAccount.substring(0, 6)}...${selectedEthAccount.substring(selectedEthAccount.length - 4)}`
                  : "Connect Ethereum Wallet"}
              </Button>
            )}
            {(form.values.from === "Ethereum" ||
              form.values.to === "Ethereum") && (
              <Button
                size="xs"
                variant="outline"
                onClick={onConnectAssetHubWallet}
                rightSection={infoAssetHubWallet}
              >
                {selectedAssetHubAccount
                  ? `${selectedAssetHubAccount?.meta.name} (${selectedAssetHubAccount?.meta.source})`
                  : "Connect AssetHub wallet"}
              </Button>
            )}
            {form.values.from !== "Ethereum" &&
              form.values.to !== "Ethereum" && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onConnectEvmWallet}
                  rightSection={infoEvmWallet}
                >
                  {selectedAccount
                    ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
                    : "Connect EVM wallet"}
                </Button>
              )}
          </Button.Group>
        </Group>

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default RouterTransferForm;
