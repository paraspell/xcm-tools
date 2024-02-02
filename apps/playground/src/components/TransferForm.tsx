import { useForm } from '@mantine/form';
import { isValidWalletAddress } from '../utils';
import { FC } from 'react';
import { Button, Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { NODES_WITH_RELAY_CHAINS, TNodeWithRelayChains } from '@paraspell/sdk';

export type FormValues = {
  from: TNodeWithRelayChains;
  to: TNodeWithRelayChains;
  currency: string;
  address: string;
  amount: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Astar',
      to: 'Moonbeam',
      currency: 'GLMR',
      amount: '10000000000000000000',
      address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      useApi: false,
    },

    validate: {
      address: (value) => (isValidWalletAddress(value) ? null : 'Invalid address'),
    },
  });

  const isNotParaToPara =
    form.values.from === 'Polkadot' ||
    form.values.from === 'Kusama' ||
    form.values.to === 'Polkadot' ||
    form.values.to === 'Kusama';

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps('from')}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps('to')}
        />

        {!isNotParaToPara && (
          <TextInput
            label="Currency"
            placeholder="GLMR"
            required
            {...form.getInputProps('currency')}
          />
        )}

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          {...form.getInputProps('address')}
        />

        <TextInput label="Amount" placeholder="0" required {...form.getInputProps('amount')} />

        <Checkbox label="Use XCM API" {...form.getInputProps('useApi')} />

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default TransferForm;
