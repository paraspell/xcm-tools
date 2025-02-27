import { useEffect, useState } from 'react';
import type { FC, FormEvent } from 'react';
import { useForm } from '@mantine/form';
import type { TAutoSelect, TExchangeNode } from '@paraspell/xcm-router';
import { EXCHANGE_NODES } from '@paraspell/xcm-router';
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
  Menu,
} from '@mantine/core';
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import { NODES_WITH_RELAY_CHAINS } from '@paraspell/sdk';
import type { Signer } from '@polkadot/api/types';
import { web3Accounts, web3FromAddress } from '@polkadot/extension-dapp';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import { useDisclosure } from '@mantine/hooks';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ethers } from 'ethers';
import { IconChevronDown, IconInfoCircle, Icon123 } from '@tabler/icons-react';
import useRouterCurrencyOptions from '../../hooks/useRouterCurrencyOptions';
import type { TRouterSubmitType, TWalletAccount } from '../../types';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { useWallet } from '../../hooks/useWallet';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { showErrorNotification } from '../../utils/notifications';

export type TRouterFormValues = {
  from?: TNodeDotKsmWithRelayChains;
  exchange: TExchangeNode | TAutoSelect;
  to?: TNodeWithRelayChains;
  currencyFromOptionId: string;
  currencyToOptionId: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: Signer;
  evmInjectorAddress?: string;
};

export type TRouterFormValuesTransformed = TRouterFormValues & {
  currencyFrom: TAsset;
  currencyTo: TAsset;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
};

export const XcmRouterForm: FC<Props> = ({ onSubmit, loading }) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();

  const onAccountSelect = (account: TWalletAccount) => () => {
    setSelectedAccount(account);
    closeModal();
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

  const form = useForm<TRouterFormValues>({
    initialValues: {
      from: 'Astar',
      exchange: 'Auto select',
      to: 'Hydration',
      currencyFromOptionId: '',
      currencyToOptionId: '',
      amount: '10000000000000000000',
      recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      slippagePct: '1',
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
      exchange: (value, values) => {
        if (value === 'Auto select' && !values.from) {
          return 'Origin must be set to use Auto select';
        }
        return null;
      },
    },
    validateInputOnChange: ['exchange'],
  });

  const { from, to, exchange } = form.getValues();

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

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
  } = useRouterCurrencyOptions(from, exchange, to);

  const onSubmitInternal = (
    values: TRouterFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TRouterSubmitType = 'default',
  ) => {
    const currencyFrom = currencyFromMap[values.currencyFromOptionId];
    const currencyTo = currencyToMap[values.currencyToOptionId];

    if (!currencyFrom || !currencyTo) {
      return;
    }

    const transformedValues = {
      ...values,
      currencyFrom,
      currencyTo: {
        ...currencyTo,
        assetId: currencyTo.id,
      } as TAsset,
    };

    onSubmit(transformedValues, submitType);
  };

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
    form.validateField('exchange');
  }, [form.values.from]);

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

  const onSubmitInternalBestAmount = () => {
    const results = [
      form.validateField('from'),
      form.validateField('exchange'),
      form.validateField('to'),
      form.validateField('currencyFromOptionId'),
      form.validateField('currencyToOptionId'),
      form.validateField('amount'),
    ];
    const isValid = results.every((result) => !result.hasError);
    if (isValid) {
      onSubmitInternal(form.getValues(), undefined, 'getBestAmountOut');
    }
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <AccountSelectModal
            isOpen={modalOpened}
            onClose={closeModal}
            accounts={accounts}
            onAccountSelect={onAccountSelect}
            title="Select evm account"
            onDisconnect={onAccountDisconnect}
          />

          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the chain you're sending from"
            data={NODES_WITH_RELAY_CHAINS}
            allowDeselect={true}
            required={false}
            clearable
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
            allowDeselect={true}
            required={false}
            clearable
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
            </Button.Group>
          </Group>

          {selectedAccountPolkadot ? (
            <Button.Group>
              <Button
                type="submit"
                loading={loading}
                flex={1}
                data-testid="submit"
              >
                Submit transaction
              </Button>
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Button
                    style={{
                      borderLeft: '1px solid #ff93c0',
                    }}
                  >
                    <IconChevronDown />
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<Icon123 size={16} />}
                    onClick={onSubmitInternalBestAmount}
                  >
                    Get best amount out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Button.Group>
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
