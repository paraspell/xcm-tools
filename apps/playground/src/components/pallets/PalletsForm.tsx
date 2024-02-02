import { useForm } from '@mantine/form';
import { FC } from 'react';
import { Button, Checkbox, Select, Stack } from '@mantine/core';
import { NODE_NAMES, TNode } from '@paraspell/sdk';
import { TPalletsQuery } from '../../types';
import { PALLETS_QUERIES } from '../../consts';

export type FormValues = {
  func: TPalletsQuery;
  node: TNode;
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
          data={[...PALLETS_QUERIES]}
          searchable
          required
          {...form.getInputProps('func')}
        />

        <Select
          label="Node"
          placeholder="Pick value"
          data={[...NODE_NAMES]}
          searchable
          required
          {...form.getInputProps('node')}
        />

        <Checkbox label="Use XCM API" {...form.getInputProps('useApi')} />

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default PalletsForm;
