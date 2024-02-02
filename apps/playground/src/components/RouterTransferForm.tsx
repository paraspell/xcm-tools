import { useForm } from '@mantine/form';
import { EXCHANGE_NODES, TExchangeNode, TransactionType } from '@paraspell/xcm-router';
import { isValidWalletAddress } from '../utils';
import { FC } from 'react';
import { Button, Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { NODES_WITH_RELAY_CHAINS, TNodeWithRelayChains } from '@paraspell/sdk';

export type TAutoSelect = 'Auto select';

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
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const RouterTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Astar',
      to: 'Moonbeam',
      exchange: 'Auto select',
      currencyFrom: 'ASTR',
      currencyTo: 'GLMR',
      amount: '10000000000000000000',
      recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      slippagePct: '1',
      transactionType: 'FULL_TRANSFER',
      useApi: false,
    },

    validate: {
      recipientAddress: (value) => (isValidWalletAddress(value) ? null : 'Invalid address'),
    },
  });

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
          label="Exchange node"
          placeholder="Pick value"
          data={['Auto select', ...EXCHANGE_NODES]}
          searchable
          required
          {...form.getInputProps('exchange')}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps('to')}
        />

        <TextInput
          label="Currency from"
          placeholder="ASTR"
          required
          {...form.getInputProps('currencyFrom')}
        />

        <TextInput
          label="Currency to"
          placeholder="GLMR"
          required
          {...form.getInputProps('currencyTo')}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          {...form.getInputProps('recipientAddress')}
        />

        <TextInput label="Amount" placeholder="0" required {...form.getInputProps('amount')} />

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
            {...form.getInputProps('transactionType')}
          />
        )}

        <TextInput
          label="Slippage percentage (%)"
          placeholder="1"
          required
          {...form.getInputProps('slippagePct')}
        />

        <Checkbox label="Use XCM API" {...form.getInputProps('useApi')} />

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default RouterTransferForm;
