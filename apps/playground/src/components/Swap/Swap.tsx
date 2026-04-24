import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  MultiSelect,
  Stack,
  TextInput,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { type UseFormReturnType } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { EXCHANGE_CHAINS } from '@paraspell/sdk';
import { IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect } from 'react';

import { DEFAULT_SLIPPAGE, DEFAULT_SWAP_OPTIONS } from '../../constants';
import { useEvmWallet, useSwapCurrencyOptions } from '../../hooks';
import type { TFormValues } from '../../types';
import { isSwapActive } from '../../utils';
import { AccountSelectModal } from '../AccountSelectModal/AccountSelectModal';
import { CurrencySelection } from '../common/CurrencySelection';
import { PolkadotWalletSelectModal } from '../WalletSelectModal/WalletSelectModal';

type Props = {
  form: UseFormReturnType<TFormValues>;
};

export const Swap = ({ form }: Props) => {
  const { colorScheme } = useMantineColorScheme();

  const [opened, { open, close }] = useDisclosure(
    isSwapActive(form.values.swapOptions),
  );

  const {
    extensions,
    injectedExtension,
    accounts,
    selectedAccount: evmAccount,
    walletSelectModalOpened,
    accountsModalOpened,
    closeWalletSelectModal,
    closeAccountsModal,
    onConnectEvmWallet,
    onProviderSelect,
    onAccountSelect,
    onAccountDisconnect: onEvmDisconnect,
  } = useEvmWallet();

  useEffect(() => {
    if (!evmAccount || !injectedExtension) return;

    const account = injectedExtension
      .getAccounts()
      .find((a) => a.address === evmAccount.address);
    if (!account) return;

    form.setFieldValue('swapOptions.evmSigner', account.polkadotSigner);
    form.setFieldValue('swapOptions.evmInjectorAddress', evmAccount.address);
  }, [evmAccount, injectedExtension]);

  const onRemove = () => {
    form.setFieldValue('swapOptions', DEFAULT_SWAP_OPTIONS);
    onEvmDisconnect();
    close();
  };

  const onAccountDisconnect = () => {
    onEvmDisconnect();
    form.setFieldValue('swapOptions.evmSigner', undefined);
    form.setFieldValue('swapOptions.evmInjectorAddress', '');
  };

  const { from, to, swapOptions } = form.values;
  const { exchange, currencyTo } = swapOptions;
  const { currencyOptionId } = currencyTo;

  const { currencyToOptions } = useSwapCurrencyOptions(
    from,
    exchange,
    to,
    undefined,
    currencyOptionId || undefined,
  );

  const infoEvmWallet = (
    <Tooltip label="Required for transfers from EVM chains like Moonbeam">
      <IconInfoCircle size={16} />
    </Tooltip>
  );

  return (
    <Stack gap="md" py="sm">
      {!opened && (
        <Button
          variant="transparent"
          size="compact-xs"
          leftSection={<IconPlus size={16} />}
          onClick={open}
        >
          Add Swap
        </Button>
      )}
      {opened && (
        <Fieldset legend="Swap" pos="relative">
          <Group>
            <Stack flex={1}>
              <MultiSelect
                label="Exchange"
                placeholder={exchange.length ? 'Pick value' : 'Auto select'}
                data={EXCHANGE_CHAINS}
                searchable
                clearable
                data-testid="swap-exchange-select"
                description="Select the DEX for the asset swap"
                {...form.getInputProps('swapOptions.exchange')}
              />
              <CurrencySelection
                form={form}
                fieldPath="swapOptions.currencyTo"
                fieldValue={currencyTo}
                showOverrideLocation={true}
                required
                currencyOptions={currencyToOptions}
              />
              <Group gap="lg" align="flex-end">
                <TextInput
                  flex={1}
                  label="Slippage (%)"
                  placeholder={DEFAULT_SLIPPAGE.toString()}
                  data-testid="swap-slippage-input"
                  {...form.getInputProps('swapOptions.slippage')}
                />
                <Button
                  flex={1}
                  size="xs"
                  h={36}
                  variant="subtle"
                  onClick={onConnectEvmWallet}
                  rightSection={infoEvmWallet}
                  data-testid="swap-connect-evm-wallet"
                >
                  {evmAccount
                    ? `${evmAccount.meta.name} (${evmAccount.meta.source})`
                    : 'Connect EVM wallet'}
                </Button>
              </Group>
            </Stack>

            <ActionIcon
              color="red"
              variant="subtle"
              bg={colorScheme === 'light' ? 'white' : 'dark.7'}
              pos="absolute"
              right={20}
              top={-25}
              onClick={onRemove}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>

          <PolkadotWalletSelectModal
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
        </Fieldset>
      )}
    </Stack>
  );
};
