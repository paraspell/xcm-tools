import { Button, Paper, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TSubstrateChain } from '@paraspell/sdk';
import { type FC, useEffect } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import { useAutoFillWalletAddress, useWallet } from '../../hooks';
import { isValidWalletAddress } from '../../utils';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

const SUPPORTED_CHAINS: TSubstrateChain[] = [
  'Polkadot',
  'Kusama',
  'AssetHubPolkadot',
  'AssetHubKusama',
];

export type FormValues = {
  from: TSubstrateChain;
  address: string;
  amount: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AssetClaimForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Polkadot',
      amount: '10000000000000000000',
      address: DEFAULT_ADDRESS,
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      amount: (value) => {
        return Number(value) > 0 ? null : 'Amount must be greater than 0';
      },
    },
  });

  useAutoFillWalletAddress(form, 'address');

  const { useApi } = form.getValues();

  const {
    connectWallet,
    selectedAccount,
    isInitialized,
    isLoadingExtensions,
    setIsUseXcmApiSelected,
  } = useWallet();

  const onConnectWalletClick = () => void connectWallet();

  useEffect(() => {
    setIsUseXcmApiSelected(useApi);
  }, [useApi]);

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <ParachainSelect
            label="Chain"
            placeholder="Pick value"
            data={SUPPORTED_CHAINS}
            data-testid="select-origin"
            {...form.getInputProps('from')}
          />

          <TextInput
            label="Recipient address"
            placeholder="Enter address"
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          <TextInput
            label="Amount"
            placeholder="0"
            required
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          {selectedAccount ? (
            <Button type="submit" loading={loading} data-testid="submit">
              Claim asset
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

export default AssetClaimForm;
