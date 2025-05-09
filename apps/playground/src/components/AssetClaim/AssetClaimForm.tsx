import { Button, Paper, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk';
import { type FC, useEffect } from 'react';

import { useWallet } from '../../hooks/useWallet';
import { isValidWalletAddress } from '../../utils';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

const SUPPORTED_NODES: TNodeDotKsmWithRelayChains[] = [
  'Polkadot',
  'Kusama',
  'AssetHubPolkadot',
  'AssetHubKusama',
];

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
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
      address: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
    },
  });

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
            label="Node"
            placeholder="Pick value"
            data={SUPPORTED_NODES}
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
