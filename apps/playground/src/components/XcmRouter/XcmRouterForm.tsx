import {
  Button,
  Center,
  Fieldset,
  Group,
  Menu,
  MultiSelect,
  Paper,
  rem,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  CHAINS,
  SUBSTRATE_CHAINS,
  type TAssetInfo,
  type TChain,
  type TSubstrateChain,
} from '@paraspell/sdk';
import type { TExchangeChain, TExchangeInput } from '@paraspell/xcm-router';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';
import {
  Icon123,
  IconChevronDown,
  IconCoinFilled,
  IconInfoCircle,
} from '@tabler/icons-react';
import { ethers } from 'ethers';
import type { PolkadotSigner } from 'polkadot-api';
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
} from 'polkadot-api/pjs-signer';
import type { FC, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useRouterCurrencyOptions,
  useWallet,
} from '../../hooks';
import type { TRouterSubmitType, TWalletAccount } from '../../types';
import { isValidWalletAddress } from '../../utils';
import { showErrorNotification } from '../../utils/notifications';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { CurrencySelection } from '../common/CurrencySelection';
import { CurrencyInfo } from '../CurrencyInfo';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import WalletSelectModal from '../WalletSelectModal/WalletSelectModal';

export type TCurrencyEntry = {
  currencyOptionId: string;
  customCurrency: string;
  amount: string;
  isCustomCurrency: boolean;
  customCurrencyType?: 'id' | 'symbol' | 'location' | 'overridenLocation';
  customCurrencySymbolSpecifier?:
    | 'auto'
    | 'native'
    | 'foreign'
    | 'foreignAbstract';
};

export type TRouterFormValues = {
  from?: TSubstrateChain;
  exchange?: TExchangeChain[];
  to?: TChain;
  currencies: [TCurrencyEntry, TCurrencyEntry]; // [currencyFrom, currencyTo]
  recipientAddress: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
};

export type TRouterFormValuesTransformed = Omit<
  TRouterFormValues,
  'exchange' | 'currencies'
> & {
  exchange: TExchangeChain;
  currencyFrom: TAssetInfo & { amount: string };
  currencyTo: TAssetInfo;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
};

export const XcmRouterForm: FC<Props> = ({ onSubmit, loading }) => {
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedAccount(account);
    closeAccountsModal();
  };

  useEffect(() => {
    if (!selectedAccount || !injectedExtension) return;

    const account = injectedExtension
      ?.getAccounts()
      .find((account) => account.address === selectedAccount.address);
    if (!account) {
      throw new Error('No selected account');
    }

    form.setFieldValue('evmSigner', account.polkadotSigner);
    form.setFieldValue('evmInjectorAddress', selectedAccount.address);
  }, [selectedAccount, injectedExtension]);

  const form = useForm<TRouterFormValues>({
    initialValues: {
      from: 'Astar',
      exchange: undefined,
      to: 'Hydration',
      currencies: [
        // currencyFrom (index 0)
        {
          currencyOptionId: '',
          customCurrency: '',
          amount: '10',
          isCustomCurrency: false,
          customCurrencyType: 'id',
          customCurrencySymbolSpecifier: 'auto',
        },
        // currencyTo (index 1)
        {
          currencyOptionId: '',
          customCurrency: '',
          amount: '0',
          isCustomCurrency: false,
          customCurrencyType: 'id',
          customCurrencySymbolSpecifier: 'auto',
        },
      ],
      recipientAddress: DEFAULT_ADDRESS,
      slippagePct: '1',
      useApi: false,
    },

    validate: {
      recipientAddress: (value: string) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      currencies: {
        currencyOptionId: (value: string, values: TRouterFormValues, path: string) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return values.currencies[index].customCurrency
              ? null
              : 'Custom currency is required';
          } else {
            // Only require Currency From (index 0), Currency To (index 1) is optional
            if (index === 0) {
              return value ? null : 'Currency selection is required';
            }
            return null;
          }
        },
        customCurrency: (value: string, values: TRouterFormValues, path: string) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return value ? null : 'Custom currency is required';
          }
          return null;
        },
        amount: (value: string, _values: TRouterFormValues, path: string) => {
          const index = Number(path.split('.')[1]);
          // Only validate amount for currencyFrom (index 0)
          if (index === 0) {
            return Number(value) > 0 ? null : 'Amount must be greater than 0';
          }
          return null;
        },
      },
      exchange: (value: TExchangeChain[] | undefined, values: TRouterFormValues) => {
        if (value === undefined && !values.from) {
          return 'Origin must be set to use Auto select';
        }
        return null;
      },
    },
    validateInputOnChange: ['exchange'],
  });

  useAutoFillWalletAddress(form, 'recipientAddress');

  const initEvmExtensions = () => {
    const ext = getInjectedExtensions();
    if (!ext.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      return;
    }
    setExtensions(ext);
    openWalletSelectModal();
  };

  const onConnectEvmWallet = () => {
    try {
      initEvmExtensions();
    } catch (_e) {
      showErrorNotification('Failed to connect EVM wallet');
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue('evmSigner', undefined);
    form.setFieldValue('evmInjectorAddress', undefined);
    closeAccountsModal();
  };

  const selectProvider = async (walletName: string) => {
    try {
      const extension = await connectInjectedExtension(walletName);
      setInjectedExtension(extension);

      const allAccounts = extension.getAccounts();
      const evmAccounts = allAccounts.filter((acc) =>
        ethers.isAddress(acc.address),
      );
      if (!evmAccounts.length) {
        showErrorNotification('No EVM accounts found in the selected wallet');
        return;
      }

      setAccounts(
        evmAccounts.map((acc) => ({
          address: acc.address,
          meta: {
            name: acc.name,
            source: extension.name,
          },
        })),
      );

      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to connect to wallet');
    }
  };

  const onProviderSelect = (walletName: string) => {
    void selectProvider(walletName);
  };

  const getExchange = (exchange: TExchangeChain[] | undefined) => {
    if (Array.isArray(exchange)) {
      if (exchange.length === 1) {
        return exchange[0];
      }

      if (exchange.length === 0) {
        return undefined;
      }
    }

    return exchange;
  };

  const { from: formFrom, to: formTo, exchange: formExchange, currencies } = form.values;
  const currencyFrom = currencies[0];
  const currencyTo = currencies[1];
  
  // Auto exchange is when no specific exchange is selected
  const isAutoExchange = !formExchange || formExchange.length === 0;

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
    adjacency,
  } = useRouterCurrencyOptions(
    formFrom,
    getExchange(formExchange) as TExchangeInput,
    formTo,
    currencyFrom.currencyOptionId,
    currencyTo.currencyOptionId,
  );

  const pairKey = (asset?: { location?: object; symbol?: string }) =>
    asset?.location ? JSON.stringify(asset.location) : asset?.symbol;

  // Only run when the maps or adjacency changes, not when selections change
  useEffect(() => {
    const currencyFromOptionId = currencyFrom.currencyOptionId;
    const currencyToOptionId = currencyTo.currencyOptionId;
    
    if (!currencyFromOptionId || !currencyToOptionId) return;

    const fromAsset = currencyFromMap[currencyFromOptionId];
    const toAsset = currencyToMap[currencyToOptionId];

    if (!fromAsset || !toAsset) return;

    const fromKey = pairKey(fromAsset);
    const toKey = pairKey(toAsset);

    if (fromKey && toKey && !adjacency.get(fromKey)?.has(toKey)) {
      form.setFieldValue('currencies.1.currencyOptionId', '');
    }
  }, [
    currencyFromMap,
    currencyToMap,
    adjacency,
  ]);

  // Only clear invalid selections when the maps change, not when selections change
  useEffect(() => {
    const currencyFromOptionId = currencyFrom.currencyOptionId;
    const currencyToOptionId = currencyTo.currencyOptionId;
    
    if (currencyFromOptionId && Object.keys(currencyFromMap).length > 0 && !currencyFromMap[currencyFromOptionId]) {
      form.setFieldValue('currencies.0.currencyOptionId', '');
      form.setFieldValue('currencies.1.currencyOptionId', '');
    }
    if (currencyToOptionId && Object.keys(currencyToMap).length > 0 && !currencyToMap[currencyToOptionId]) {
      form.setFieldValue('currencies.1.currencyOptionId', '');
    }
  }, [
    currencyFromMap,
    currencyToMap,
  ]);

  const onSubmitInternal = (
    values: TRouterFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TRouterSubmitType = 'default',
  ) => {
    const currencyFromEntry = values.currencies[0];
    const currencyToEntry = values.currencies[1];

    const currencyFromAsset = currencyFromEntry.isCustomCurrency 
      ? null 
      : currencyFromMap[currencyFromEntry.currencyOptionId];
    const currencyToAsset = currencyToEntry.isCustomCurrency 
      ? null 
      : currencyToMap[currencyToEntry.currencyOptionId];

    const finalCurrencyFrom = currencyFromAsset || {
      symbol: currencyFromEntry.customCurrency,
      decimals: 0, // Default value for custom currencies
      assetId: currencyFromEntry.customCurrency,
      isNative: false,
    };
    
    const finalCurrencyTo = currencyToAsset || {
      symbol: currencyToEntry.customCurrency,
      decimals: 0, // Default value for custom currencies
      assetId: currencyToEntry.customCurrency,
      isNative: false,
    };

    if (!finalCurrencyFrom || !finalCurrencyTo) {
      return;
    }

    const transformedValues = {
      ...values,
      exchange: getExchange(values.exchange) as TExchangeChain,
      currencyFrom: { ...finalCurrencyFrom, amount: currencyFromEntry.amount },
      currencyTo: finalCurrencyTo as TAssetInfo,
    };

    onSubmit(transformedValues, submitType);
  };

  const infoEvmWallet = (
    <Tooltip
      label="You need to connect your Polkadot EVM wallet when choosing EVM chain as origin"
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
  }, [formFrom]);

  useEffect(() => {
    if (isFromNotParaToPara) {
      form.setFieldValue(
        'currencies.0.currencyOptionId',
        Object.keys(currencyFromMap)[0],
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue('currencies.1.currencyOptionId', Object.keys(currencyToMap)[0]);
    }
  }, [isToNotParaToPara, currencyToMap]);

  const {
    connectWallet,
    selectedAccount: selectedAccountPolkadot,
    isInitialized,
    isLoadingExtensions,
  } = useWallet();

  const onSubmitInternalBestAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getBestAmountOut');
    }
  };

  const onSubmitGetXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getXcmFee');
    }
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <WalletSelectModal
            isOpen={walletSelectModalOpened}
            onClose={closeWalletSelectModal}
            providers={extensions}
            onProviderSelect={onProviderSelect}
          />

          <AccountSelectModal
            isOpen={accountsModalOpened}
            onClose={closeAccountsModal}
            accounts={accounts}
            onAccountSelect={onAccountSelect}
            title="Select EVM account"
            onDisconnect={onAccountDisconnect}
          />

          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the chain you're sending from"
            data={SUBSTRATE_CHAINS}
            allowDeselect={true}
            required={false}
            clearable
            data-testid="select-from"
            {...form.getInputProps('from')}
          />

          <MultiSelect
            label="Exchange"
            placeholder={formExchange?.length ? 'Pick value' : 'Auto select'}
            data={EXCHANGE_CHAINS}
            searchable
            clearable
            required
            withAsterisk={false}
            data-testid="select-exchange"
            description="Select the chain where the asset swap will take place"
            {...form.getInputProps('exchange')}
          />

          <ParachainSelect
            label="Destination"
            placeholder="Pick value"
            data={CHAINS}
            data-testid="select-to"
            description="Select the chain that will receive the swapped assets"
            allowDeselect={true}
            required={false}
            clearable
            {...form.getInputProps('to')}
          />

          <Fieldset legend="Currency From">
            <Group>
              <Stack gap="xs" flex={1}>
                <CurrencySelection
                  form={form}
                  index={0}
                  currencyOptions={currencyFromOptions}
                  isAutoExchange={isAutoExchange}
                />
                <TextInput
                  label="Amount"
                  rightSection={<CurrencyInfo />}
                  placeholder="0"
                  size="sm"
                  required
                  data-testid="input-amount-from"
                  {...form.getInputProps('currencies.0.amount')}
                />
              </Stack>
            </Group>
          </Fieldset>

          <Fieldset legend="Currency To">
            <CurrencySelection
              form={form}
              index={1}
              currencyOptions={currencyToOptions}
              isAutoExchange={isAutoExchange}
            />
          </Fieldset>

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            required
            data-testid="input-recipient-address"
            {...form.getInputProps('recipientAddress')}
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

                  <Menu.Item
                    leftSection={<IconCoinFilled size={16} />}
                    onClick={onSubmitGetXcmFee}
                  >
                    Get XCM fees
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
