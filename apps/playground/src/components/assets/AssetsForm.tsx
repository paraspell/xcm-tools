import { useForm } from '@mantine/form';
import { FC } from 'react';
import { Button, Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { NODE_NAMES, TNode } from '@paraspell/sdk';
import { TAssetsQuery } from '../../types';
import { ASSET_QUERIES } from '../../consts';

export type FormValues = {
  func: TAssetsQuery;
  node: TNode;
  symbol: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AssetsForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: 'ASSETS_OBJECT',
      node: 'Acala',
      symbol: 'GLMR',
      useApi: false,
    },
  });

  const funcVal = form.values.func;

  const showSymbolInput =
    funcVal === 'ASSET_ID' || funcVal === 'DECIMALS' || funcVal == 'HAS_SUPPORT';

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={[...ASSET_QUERIES]}
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

        {showSymbolInput && (
          <TextInput label="Symbol" placeholder="GLMR" required {...form.getInputProps('symbol')} />
        )}

        <Checkbox label="Use XCM API" {...form.getInputProps('useApi')} />

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default AssetsForm;
