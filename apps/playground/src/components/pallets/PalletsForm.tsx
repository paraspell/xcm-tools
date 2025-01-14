import { useForm } from '@mantine/form';
import type { FC } from 'react';
import { Button, Checkbox, Select, Stack } from '@mantine/core';
import type { TNodePolkadotKusama } from '@paraspell/sdk';
import { NODE_NAMES_DOT_KSM } from '@paraspell/sdk';
import type { TPalletsQuery } from '../../types';
import { PALLETS_QUERIES } from '../../consts';

export type FormValues = {
  func: TPalletsQuery;
  node: TNodePolkadotKusama;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const PalletsForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: 'ALL_PALLETS',
      node: 'Acala',
      useApi: false,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={PALLETS_QUERIES}
          searchable
          required
          allowDeselect={false}
          data-testid="select-func"
          {...form.getInputProps('func')}
        />

        <Select
          label="Node"
          placeholder="Pick value"
          data={NODE_NAMES_DOT_KSM}
          searchable
          required
          allowDeselect={false}
          data-testid="select-node"
          {...form.getInputProps('node')}
        />

        <Checkbox
          label="Use XCM API"
          {...form.getInputProps('useApi')}
          data-testid="checkbox-api"
        />

        <Button type="submit" loading={loading} data-testid="submit">
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default PalletsForm;
