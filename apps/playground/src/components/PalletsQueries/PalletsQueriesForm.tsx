import { useForm } from '@mantine/form';
import type { FC } from 'react';
import { Button, Paper, Select, Stack } from '@mantine/core';
import type { TNodePolkadotKusama } from '@paraspell/sdk';
import { NODE_NAMES_DOT_KSM } from '@paraspell/sdk';
import type { TPalletsQuery } from '../../types';
import { PALLETS_QUERIES } from '../../consts';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  func: TPalletsQuery;
  node: TNodePolkadotKusama;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const PalletsQueriesForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: 'ALL_PALLETS',
      node: 'Acala',
      useApi: false,
    },
  });

  return (
    <Paper p="xl" shadow="md">
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

          <ParachainSelect
            label="Node"
            placeholder="Pick value"
            data={NODE_NAMES_DOT_KSM}
            data-testid="select-node"
            {...form.getInputProps('node')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          <Button type="submit" loading={loading} data-testid="submit">
            Submit
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default PalletsQueriesForm;
