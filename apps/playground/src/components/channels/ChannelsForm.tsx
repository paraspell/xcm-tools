import { useForm } from '@mantine/form';
import { FC } from 'react';
import { Button, Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { NODE_NAMES, TNode } from '@paraspell/sdk';
import { CHANNELS_QUERIES } from '../../consts';
import { TChannelsQuery } from '../../types';

export type FormValues = {
  func: TChannelsQuery;
  from: TNode;
  to: TNode;
  maxSize: string;
  maxMessageSize: string;
  inbound: string;
  outbound: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const ChannelsForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: 'OPEN_CHANNEL',
      from: 'Acala',
      to: 'AssetHubPolkadot',
      maxSize: '1024',
      maxMessageSize: '1024',
      inbound: '1024',
      outbound: '1024',
      useApi: false,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={[...CHANNELS_QUERIES]}
          searchable
          required
          {...form.getInputProps('func')}
        />

        <Select
          label="From node"
          placeholder="Pick value"
          data={[...NODE_NAMES]}
          searchable
          required
          {...form.getInputProps('from')}
        />

        {form.values.func === 'OPEN_CHANNEL' && (
          <Select
            label="To node"
            placeholder="Pick value"
            data={[...NODE_NAMES]}
            searchable
            required
            {...form.getInputProps('to')}
          />
        )}

        {form.values.func === 'OPEN_CHANNEL' && (
          <TextInput
            label="Max size"
            placeholder="1024"
            required
            {...form.getInputProps('maxSize')}
          />
        )}

        {form.values.func === 'OPEN_CHANNEL' && (
          <TextInput
            label="Max message size"
            placeholder="1024"
            required
            {...form.getInputProps('maxMessageSize')}
          />
        )}

        {form.values.func === 'CLOSE_CHANNEL' && (
          <TextInput
            label="Inbound"
            placeholder="1024"
            required
            {...form.getInputProps('inbound')}
          />
        )}

        {form.values.func === 'CLOSE_CHANNEL' && (
          <TextInput
            label="Outbound"
            placeholder="1024"
            required
            {...form.getInputProps('inbound')}
          />
        )}

        <Checkbox label="Use XCM API" {...form.getInputProps('useApi')} />

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default ChannelsForm;
