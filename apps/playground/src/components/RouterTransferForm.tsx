import { useForm } from "@mantine/form";
import {
  EXCHANGE_NODES,
  TExchangeNode,
  TransactionType,
} from "@paraspell/xcm-router";
import { isValidWalletAddress } from "../utils";
import { FC, useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { NODES_WITH_RELAY_CHAINS, TNodeWithRelayChains } from "@paraspell/sdk";
import { Signer } from "@polkadot/api/types";
import { web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import AccountsModal from "./AccountsModal";
import { useDisclosure } from "@mantine/hooks";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ethers } from "ethers";

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
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const RouterTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  useEffect(() => {
    (async () => {
      if (selectedAccount) {
        const injector = await web3FromAddress(selectedAccount.address);
        form.setFieldValue("evmSigner", injector.signer);
        form.setFieldValue("evmInjectorAddress", selectedAccount.address);
      }
    })();
  }, [selectedAccount]);

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

  const onConnectEvmWallet = async () => {
    const allAccounts = await web3Accounts();
    setAccounts(
      allAccounts.filter((account) => ethers.isAddress(account.address))
    );
    openModal();
  };

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue("evmSigner", undefined);
    form.setFieldValue("evmInjectorAddress", undefined);
    closeModal();
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <AccountsModal
          isOpen={modalOpened}
          onClose={closeModal}
          accounts={accounts}
          onAccountSelect={onAccountSelect}
          title="Select evm account"
          onDisconnect={onAccountDisconnect}
        />
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps("from")}
        />

        <Select
          label="Exchange node"
          placeholder="Pick value"
          data={["Auto select", ...EXCHANGE_NODES]}
          searchable
          required
          {...form.getInputProps("exchange")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps("to")}
        />

        <TextInput
          label="Currency from"
          placeholder="ASTR"
          required
          {...form.getInputProps("currencyFrom")}
        />

        <TextInput
          label="Currency to"
          placeholder="GLMR"
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

          <Button size="xs" variant="white" onClick={onConnectEvmWallet}>
            {selectedAccount
              ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
              : "Connect EVM wallet"}
          </Button>
        </Group>

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default RouterTransferForm;
