import { useForm } from '@mantine/form';
import type { FC } from 'react';
import { Button, Paper, Select, Stack, Switch, TextInput } from '@mantine/core';
import type { TAsset, TNodePolkadotKusama } from '@paraspell/sdk';
import { NODES_WITH_RELAY_CHAINS_DOT_KSM } from '@paraspell/sdk';
import { isValidPolkadotAddress } from '../../utils';
import useCurrencyOptions from '../../hooks/useCurrencyOptions';
import { XcmApiCheckbox } from '../XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  from: 'Ethereum' | 'Moonbeam';
  to: TNodePolkadotKusama;
  currencyOptionId: string;
  address: string;
  amount: string;
  useApi: boolean;
  useViem: boolean;
};

export type FormValuesTransformed = FormValues & {
  currency?: TAsset;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const EvmTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      currencyOptionId: '',
      amount: '1000000000',
      address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      useApi: false,
      useViem: false,
    },

    validate: {
      address: (value) =>
        isValidPolkadotAddress(value) ? null : 'Invalid address',
    },
  });

  const { currencyOptions, currencyMap } = useCurrencyOptions(
    form.values.from,
    form.values.to,
  );

  const onSubmitInternal = (values: FormValues) => {
    const currency = currencyMap[values.currencyOptionId];

    if (!currency) {
      return;
    }

    const transformedValues = { ...values, currency: currency };

    onSubmit(transformedValues);
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack>
          <Switch
            label="Use viem?"
            data-testid="switch-api"
            {...form.getInputProps('useViem')}
          />

          <ParachainSelect
            label="From"
            placeholder="Pick value"
            data={['Ethereum', 'Moonbeam', 'Moonriver']}
            data-testid="select-source"
            {...form.getInputProps('from')}
          />

          <ParachainSelect
            label="To"
            placeholder="Pick value"
            data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
            data-testid="select-destination"
            {...form.getInputProps('to')}
          />

          <Select
            key={form.values.from + form.values.to}
            label="Currency"
            placeholder="Pick value"
            data={currencyOptions}
            allowDeselect={false}
            searchable
            required
            data-testid="select-currency"
            {...form.getInputProps('currencyOptionId')}
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

          <XcmApiCheckbox {...form.getInputProps('useApi')} />

          <Button type="submit" loading={loading} data-testid="submit">
            Submit transaction
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default EvmTransferForm;
