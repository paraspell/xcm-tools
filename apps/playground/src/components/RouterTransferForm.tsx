import { useForm } from "@mantine/form";
import {
  EXCHANGE_NODES,
  type TAutoSelect,
  type TExchangeNode,
  TransactionType,
} from "@paraspell/xcm-router";
import { isValidWalletAddress } from "../utils";
import { type FC, useEffect, useState } from "react";
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
  NODES_WITH_RELAY_CHAINS,
  type TAsset,
  type TNodeWithRelayChains,
} from "@paraspell/sdk";
import { type Signer } from "@polkadot/api/types";
import { web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import AccountsModal from "./AccountsModal";
import { useDisclosure } from "@mantine/hooks";
import { type InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { type BrowserProvider, ethers } from "ethers";
import { IconInfoCircle } from "@tabler/icons-react";
import EthAccountsModal from "./EthAccountsModal";
import useRouterCurrencyOptions from "../hooks/useRouterCurrencyOptions";

export type FormValues = {
  from: TNodeWithRelayChains;
  exchange: TExchangeNode | TAutoSelect;
  to: TNodeWithRelayChains;
  currencyFromOptionId: string;
  currencyToOptionId: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  transactionType: keyof typeof TransactionType;
  useApi: boolean;
  evmSigner?: Signer;
  evmInjectorAddress?: string;
  assetHubAddress?: string;
  ethAddress?: string;
};

export type FormValuesTransformed = FormValues & {
  currencyFrom: TAsset;
  currencyTo: TAsset;
};

type Props = {
  onSubmit: (values: FormValuesTransformed) => void;
  loading: boolean;
  initializeProvider: () => BrowserProvider | undefined;
  provider?: BrowserProvider;
};

const RouterTransferForm: FC<Props> = ({
  onSubmit,
  loading,
  initializeProvider,
  provider,
}) => {
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

  const [selectedEthAccount, setSelectedEthAccount] = useState<string | null>(
    null
  );

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const onEthAccountSelect = (account: string) => () => {
    setSelectedEthAccount(account);
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    form.setFieldValue("ethAddress", account);
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
    if (selectedEthAccount) {
      form.setFieldValue("ethAddress", selectedEthAccount);
    }
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
      currencyFromOptionId: "",
      currencyToOptionId: "",
      amount: "10000000000000000000",
      recipientAddress: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      slippagePct: "1",
      transactionType: "FULL_TRANSFER",
      useApi: false,
    },

    validate: {
      recipientAddress: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
      currencyFromOptionId: (value) => {
        return value ? null : "Currency from selection is required";
      },
      currencyToOptionId: (value) => {
        return value ? null : "Currency to selection is required";
      },
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
    const newProvider = initializeProvider();

    if (!newProvider) {
      throw new Error("Provider not initialized");
    }

    try {
      const accounts = (await newProvider.send(
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

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
  } = useRouterCurrencyOptions(
    form.values.from,
    form.values.exchange,
    form.values.to
  );

  const onSubmitInternal = (values: FormValues) => {
    const currencyFrom = currencyFromMap[values.currencyFromOptionId];
    const currencyTo = currencyToMap[values.currencyToOptionId];

    if (!currencyFrom || !currencyTo) {
      return;
    }

    const transformedValues = { ...values, currencyFrom, currencyTo };

    onSubmit(transformedValues);
  };

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

  useEffect(() => {
    if (isFromNotParaToPara) {
      form.setFieldValue(
        "currencyFromOptionId",
        Object.keys(currencyFromMap)[0]
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue("currencyToOptionId", Object.keys(currencyToMap)[0]);
    }
  }, [isToNotParaToPara, currencyToMap]);

  return (
    <form onSubmit={form.onSubmit(onSubmitInternal)}>
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
          data-testid="select-from"
          {...form.getInputProps("from")}
        />

        <Select
          label="Exchange node"
          placeholder="Pick value"
          data={["Auto select", ...EXCHANGE_NODES]}
          allowDeselect={false}
          searchable
          required
          data-testid="select-exchange"
          {...form.getInputProps("exchange")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          allowDeselect={false}
          searchable
          required
          data-testid="select-to"
          {...form.getInputProps("to")}
        />

        <Select
          key={
            form.values.from +
            form.values.exchange +
            form.values.to +
            "currencyFrom"
          }
          label="Currency From"
          placeholder="Pick value"
          data={currencyFromOptions}
          allowDeselect={false}
          disabled={isFromNotParaToPara}
          searchable
          required
          data-testid="select-currency-from"
          {...form.getInputProps("currencyFromOptionId")}
        />

        <Select
          key={
            form.values.from +
            form.values.exchange +
            form.values.to +
            "currencyTo"
          }
          label="Currency To"
          placeholder="Pick value"
          data={currencyToOptions}
          allowDeselect={false}
          disabled={isToNotParaToPara}
          searchable
          required
          data-testid="select-currency-to"
          {...form.getInputProps("currencyToOptionId")}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          data-testid="input-recipient-address"
          {...form.getInputProps("recipientAddress")}
        />

        <TextInput
          label="Amount"
          placeholder="0"
          required
          data-testid="input-amount"
          {...form.getInputProps("amount")}
        />

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
          data-testid="select-transaction-type"
          allowDeselect={false}
          {...form.getInputProps("transactionType")}
        />

        <TextInput
          label="Slippage percentage (%)"
          placeholder="1"
          required
          data-testid="input-slippage-pct"
          {...form.getInputProps("slippagePct")}
        />

        <Group justify="space-between">
          <Checkbox
            label="Use XCM API"
            {...form.getInputProps("useApi")}
            data-testid="checkbox-api"
          />
          <Button.Group orientation="vertical">
            {(form.values.from === "Ethereum" ||
              form.values.to === "Ethereum") && (
              <Button
                size="xs"
                variant="outline"
                onClick={onConnectEthWallet}
                rightSection={infoEthWallet}
                data-testid="connect-eth-wallet"
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
                data-testid="connect-asset-hub-wallet"
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
                  data-testid="connect-evm-wallet"
                >
                  {selectedAccount
                    ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
                    : "Connect EVM wallet"}
                </Button>
              )}
          </Button.Group>
        </Group>

        <Button type="submit" loading={loading} data-testid="submit">
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default RouterTransferForm;
