import { Button, Paper, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TSubstrateChain } from '@paraspell/sdk';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { type FC, useEffect } from 'react';

import { DEFAULT_ADDRESS, MAIN_FORM_NAME } from '../../constants';
import { useWallet } from '../../hooks';
import { advancedOptionsParsers } from '../../parsers';
import type { TAdvancedOptions } from '../../types';
import { isValidWalletAddress, validateCustomEndpoint } from '../../utils';
import {
  parseAsAssetClaimChain,
  parseAsRecipientAddress,
} from '../../utils/parsers';
import { AdvancedOptions } from '../AdvancedOptions';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { AddressTooltip, AmountTooltip } from '../Tooltip';

export const ASSET_CLAIM_SUPPORTED_CHAINS: TSubstrateChain[] = [
  'Polkadot',
  'Kusama',
  'AssetHubPolkadot',
  'AssetHubKusama',
];

export type TAssetClaimFormValues = {
  from: TSubstrateChain;
  address: string;
  amount: string;
  useApi: boolean;
} & TAdvancedOptions;

type Props = {
  onSubmit: (values: TAssetClaimFormValues) => void;
  loading: boolean;
};

export const AssetClaimForm: FC<Props> = ({ onSubmit, loading }) => {
  const {
    connectWallet,
    selectedAccount,
    isInitialized,
    isLoadingExtensions,
    setIsUseXcmApiSelected,
  } = useWallet();

  const [queryState, setQueryState] = useQueryStates({
    from: parseAsAssetClaimChain.withDefault('Polkadot'),
    amount: parseAsString.withDefault(''),
    address: parseAsRecipientAddress.withDefault(
      selectedAccount?.address ?? DEFAULT_ADDRESS,
    ),
    useApi: parseAsBoolean.withDefault(false),
    ...advancedOptionsParsers,
  });

  const form = useForm<TAssetClaimFormValues>({
    name: MAIN_FORM_NAME,
    initialValues: queryState,
    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      amount: (value) => {
        return Number(value) > 0 ? null : 'Amount must be greater than 0';
      },
      apiOverrides: { endpoints: { url: validateCustomEndpoint } },
    },
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  const { useApi } = form.getValues();

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
            data={ASSET_CLAIM_SUPPORTED_CHAINS}
            data-testid="select-origin"
            {...form.getInputProps('from')}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            rightSection={<AddressTooltip />}
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          <TextInput
            label="Amount"
            rightSection={<AmountTooltip />}
            placeholder="0"
            required
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          <AdvancedOptions form={form} hideVersionAndPallet />

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
