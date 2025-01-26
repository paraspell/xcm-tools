import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useForm } from '@mantine/form';
import type { TAutoSelect, TExchangeNode } from '@paraspell/xcm-router';
import { EXCHANGE_NODES, TransactionType } from '@paraspell/xcm-router';
import { isValidWalletAddress } from '../../utils';
import {
  Text,
  Button,
  Group,
  Select,
  Stack,
  TextInput,
  Tooltip,
  Center,
  rem,
  Paper,
} from '@mantine/core';
import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk';
import { NODES_WITH_RELAY_CHAINS } from '@paraspell/sdk';
import type { Signer } from '@polkadot/api/types';
import { web3Accounts, web3FromAddress } from '@polkadot/extension-dapp';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import { useDisclosure } from '@mantine/hooks';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ethers } from 'ethers';
import { IconInfoCircle } from '@tabler/icons-react';
import useRouterCurrencyOptions from '../../hooks/useRouterCurrencyOptions';
import EthWalletSelectModal from '../EthWalletSelectModal';
import EthAccountsSelectModal from '../EthAccountsSelectModal';
import type { EIP6963ProviderDetail, TWalletAccount } from '../../types';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { useWallet } from '../../hooks/useWallet';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { showErrorNotification } from '../../utils/notifications';

export type TRouterFormValues = {
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

export type TRouterFormValuesTransformed = TRouterFormValues & {
  currencyFrom: TAsset;
  currencyTo: TAsset;
};

type Props = {
  onSubmit: (values: TRouterFormValuesTransformed) => void;
  loading: boolean;
  onConnectEthWallet: () => void;
  ethProviders: EIP6963ProviderDetail[];
  onEthProviderSelect: (providerInfo: EIP6963ProviderDetail) => void;
  onEthWalletDisconnect: () => void;
  ethAccounts: string[];
  isEthWalletModalOpen: boolean;
  setIsEthWalletModalOpen: (isOpen: boolean) => void;
  isEthAccountModalOpen: boolean;
  setIsEthAccountModalOpen: (isOpen: boolean) => void;
};

export const XcmRouterForm: FC<Props> = ({
  onSubmit,
  loading,
  onConnectEthWallet,
  ethProviders,
  onEthProviderSelect,
  onEthWalletDisconnect,
  ethAccounts,
  isEthWalletModalOpen,
  setIsEthWalletModalOpen,
  isEthAccountModalOpen,
  setIsEthAccountModalOpen,
}) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [
    assetHubModalOpened,
    { open: openAssetHubModal, close: closeAssetHubModal },
  ] = useDisclosure(false);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [assetHubAccounts, setAssetHubAccounts] = useState<
    InjectedAccountWithMeta[]
  >([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();

  const [selectedAssetHubAccount, setSelectedAssetHubAccount] =
    useState<TWalletAccount>();

  const [selectedEthAccount, setSelectedEthAccount] = useState<string | null>(
    null,
  );

  const onAccountSelect = (account: TWalletAccount) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const onEthAccountSelect = (account: string) => {
    setSelectedEthAccount(account);
    setIsEthAccountModalOpen(false);
    form.setFieldValue('ethAddress', account);
  };

  const onAssetHubAccountSelect = (account: TWalletAccount) => () => {
    setSelectedAssetHubAccount(account);
    closeAssetHubModal();
  };

  useEffect(() => {
    void (async () => {
      if (selectedAccount) {
        const injector = await web3FromAddress(selectedAccount.address);
        form.setFieldValue('evmSigner', injector.signer);
        form.setFieldValue('evmInjectorAddress', selectedAccount.address);
      }
    })();
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedEthAccount) {
      form.setFieldValue('ethAddress', selectedEthAccount);
    }
  }, [selectedEthAccount]);

  useEffect(() => {
    if (selectedAssetHubAccount) {
      form.setFieldValue('assetHubAddress', selectedAssetHubAccount.address);
    }
  }, [selectedAssetHubAccount]);

  const form = useForm<TRouterFormValues>({
    initialValues: {
      from: 'Astar',
      to: 'Hydration',
      exchange: 'Auto select',
      currencyFromOptionId: '',
      currencyToOptionId: '',
      amount: '10000000000000000000',
      recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      slippagePct: '1',
      transactionType: 'FULL_TRANSFER',
      useApi: false,
    },

    validate: {
      recipientAddress: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      currencyFromOptionId: (value) => {
        return value ? null : 'Currency from selection is required';
      },
      currencyToOptionId: (value) => {
        return value ? null : 'Currency to selection is required';
      },
    },
  });

  const { from, to, exchange } = form.getValues();

  useEffect(() => {
    if (from === 'Ethereum' || to === 'Ethereum') {
      onAccountDisconnect();
    }
  }, [from, to]);

  useEffect(() => {
    if (from !== 'Ethereum' || to !== 'Ethereum') {
      onAssetHubAccountDisconnect();
      onEthWalletDisconnect();
    }
  }, [from, to]);

  const connectAssetHubWallet = async () => {
    try {
      const allAccounts = await web3Accounts();
      setAssetHubAccounts(
        allAccounts.filter((account) => !ethers.isAddress(account.address)),
      );
      openAssetHubModal();
    } catch (_e) {
      showErrorNotification('Failed to connect AssetHub wallet');
    }
  };

  const onConnectAssetHubWallet = () => void connectAssetHubWallet();

  const connectEvmWallet = async () => {
    try {
      const allAccounts = await web3Accounts();
      setAccounts(
        allAccounts.filter((account) => ethers.isAddress(account.address)),
      );
      openModal();
    } catch (_e) {
      showErrorNotification('Failed to connect EVM wallet');
    }
  };

  const onConnectEvmWallet = () => void connectEvmWallet();

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue('evmSigner', undefined);
    form.setFieldValue('evmInjectorAddress', undefined);
    closeModal();
  };

  const onAssetHubAccountDisconnect = () => {
    setSelectedAssetHubAccount(undefined);
    form.setFieldValue('assetHubAddress', undefined);
    closeAssetHubModal();
  };

  const onEthWalletDisconnectInternal = () => {
    setSelectedEthAccount(null);
    form.setFieldValue('ethSigner', undefined);
    setIsEthWalletModalOpen(false);
    onEthWalletDisconnect();
  };

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
  } = useRouterCurrencyOptions(from, exchange, to);

  const onSubmitInternal = (values: TRouterFormValues) => {
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
      label="You need to connect your Ethereum wallet when choosing Ethereum as the origin or destination chain"
      position="top-end"
      withArrow
      transitionProps={{ transition: 'pop-bottom-right' }}
    >
      <Text component="div" style={{ cursor: 'help' }}>
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
      transitionProps={{ transition: 'pop-bottom-right' }}
    >
      <Text component="div" style={{ cursor: 'help' }}>
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
      transitionProps={{ transition: 'pop-bottom-right' }}
    >
      <Text component="div" style={{ cursor: 'help' }}>
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
        'currencyFromOptionId',
        Object.keys(currencyFromMap)[0],
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue('currencyToOptionId', Object.keys(currencyToMap)[0]);
    }
  }, [isToNotParaToPara, currencyToMap]);

  const {
    connectWallet,
    selectedAccount: selectedAccountPolkadot,
    isInitialized,
    isLoadingExtensions,
  } = useWallet();

  const onConnectWalletClick = () => void connectWallet();

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <EthWalletSelectModal
            isOpen={isEthWalletModalOpen}
            onClose={() => setIsEthWalletModalOpen(false)}
            providers={ethProviders}
            onProviderSelect={onEthProviderSelect}
            onDisconnect={onEthWalletDisconnectInternal}
          />
          <EthAccountsSelectModal
            isOpen={isEthAccountModalOpen}
            onClose={() => setIsEthAccountModalOpen(false)}
            accounts={ethAccounts}
            onAccountSelect={onEthAccountSelect}
          />
          <AccountSelectModal
            isOpen={modalOpened}
            onClose={closeModal}
            accounts={accounts}
            onAccountSelect={onAccountSelect}
            title="Select evm account"
            onDisconnect={onAccountDisconnect}
          />
          <AccountSelectModal
            isOpen={assetHubModalOpened}
            onClose={closeAssetHubModal}
            accounts={assetHubAccounts}
            onAccountSelect={onAssetHubAccountSelect}
            title="Select AssetHub account"
            onDisconnect={onAssetHubAccountDisconnect}
          />

          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the chain you're sending from"
            data={NODES_WITH_RELAY_CHAINS}
            data-testid="select-from"
            {...form.getInputProps('from')}
          />

          <Select
            label="Exchange"
            placeholder="Pick value"
            data={['Auto select', ...EXCHANGE_NODES]}
            allowDeselect={false}
            searchable
            required
            data-testid="select-exchange"
            description="Select the chain where the asset swap will take place"
            {...form.getInputProps('exchange')}
          />

          <ParachainSelect
            label="Destination"
            placeholder="Pick value"
            data={[...NODES_WITH_RELAY_CHAINS]}
            data-testid="select-to"
            description="Select the chain that will receive the swapped assets"
            {...form.getInputProps('to')}
          />

          <Select
            key={from + exchange + to + 'currencyFrom'}
            label="Currency From"
            placeholder="Pick value"
            data={currencyFromOptions}
            allowDeselect={false}
            disabled={isFromNotParaToPara}
            searchable
            required
            data-testid="select-currency-from"
            {...form.getInputProps('currencyFromOptionId')}
          />

          <Select
            key={from + exchange + to + 'currencyTo'}
            label="Currency To"
            placeholder="Pick value"
            data={currencyToOptions}
            allowDeselect={false}
            disabled={isToNotParaToPara}
            searchable
            required
            data-testid="select-currency-to"
            {...form.getInputProps('currencyToOptionId')}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            required
            data-testid="input-recipient-address"
            {...form.getInputProps('recipientAddress')}
          />

          <TextInput
            label="Amount"
            placeholder="0"
            required
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

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
            data-testid="select-transaction-type"
            allowDeselect={false}
            {...form.getInputProps('transactionType')}
          />

          <TextInput
            label="Slippage percentage (%)"
            placeholder="1"
            required
            data-testid="input-slippage-pct"
            {...form.getInputProps('slippagePct')}
          />

          <Group justify="space-between">
            <XcmApiCheckbox
              {...form.getInputProps('useApi', { type: 'checkbox' })}
            />

            <Button.Group orientation="vertical">
              {(from === 'Ethereum' || to === 'Ethereum') && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onConnectEthWallet}
                  rightSection={infoEthWallet}
                  data-testid="connect-eth-wallet"
                >
                  {selectedEthAccount
                    ? `Connected: ${selectedEthAccount.substring(0, 6)}...${selectedEthAccount.substring(selectedEthAccount.length - 4)}`
                    : 'Connect Ethereum Wallet'}
                </Button>
              )}
              {(from === 'Ethereum' || to === 'Ethereum') && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onConnectAssetHubWallet}
                  rightSection={infoAssetHubWallet}
                  data-testid="connect-asset-hub-wallet"
                >
                  {selectedAssetHubAccount
                    ? `${selectedAssetHubAccount?.meta.name} (${selectedAssetHubAccount?.meta.source})`
                    : 'Connect AssetHub wallet'}
                </Button>
              )}
              {from !== 'Ethereum' && to !== 'Ethereum' && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onConnectEvmWallet}
                  rightSection={infoEvmWallet}
                  data-testid="connect-evm-wallet"
                >
                  {selectedAccount
                    ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
                    : 'Connect EVM wallet'}
                </Button>
              )}
            </Button.Group>
          </Group>

          {selectedAccountPolkadot ? (
            <Button type="submit" loading={loading} data-testid="submit">
              Submit transaction
            </Button>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!isInitialized || isLoadingExtensions}
            >
              Connect wallet
            </Button>
          )}
        </Stack>
      </form>
    </Paper>
  );
};
