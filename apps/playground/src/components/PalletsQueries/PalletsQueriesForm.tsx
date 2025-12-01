import { Button, Paper, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TSubstrateChain } from '@paraspell/sdk';
import { PALLETS, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { type FC, useEffect } from 'react';

import { PALLETS_QUERIES } from '../../consts';
import { useWallet } from '../../hooks';
import type { TPalletsQuery } from '../../types';
import {
  parseAsPalletsQuery,
  parseAsSubstrateChain,
} from '../../utils/routes/parsers';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  func: TPalletsQuery;
  chain: TSubstrateChain;
  pallet: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const PalletsQueriesForm: FC<Props> = ({ onSubmit, loading }) => {
  const [queryState, setQueryState] = useQueryStates({
    func: parseAsPalletsQuery.withDefault('ALL_PALLETS'),
    chain: parseAsSubstrateChain.withDefault('Acala'),
    pallet: parseAsString.withDefault('XTokens'),
    useApi: parseAsBoolean.withDefault(false),
  });

  const form = useForm<FormValues>({
    initialValues: queryState,
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  const { useApi, func } = form.getValues();

  const { setIsUseXcmApiSelected } = useWallet();

  useEffect(() => {
    setIsUseXcmApiSelected(useApi);
  }, [useApi]);

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
            label="Chain"
            placeholder="Pick value"
            data={SUBSTRATE_CHAINS}
            data-testid="select-chain"
            {...form.getInputProps('chain')}
          />

          {func === 'PALLET_INDEX' && (
            <Select
              label="Pallet"
              placeholder="Pick value"
              data={PALLETS}
              searchable
              required
              allowDeselect={false}
              data-testid="select-pallet"
              {...form.getInputProps('pallet')}
            />
          )}

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
