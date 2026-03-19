import { Button, Paper, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import {
  CHAINS,
  EXTERNAL_CHAINS,
  isRelayChain,
  PARACHAINS,
  SUBSTRATE_CHAINS,
} from '@paraspell/sdk';
import { parseAsBoolean, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { type FC, useEffect } from 'react';

import {
  ASSET_QUERIES,
  DEFAULT_ADDRESS,
  DEFAULT_CURRENCY_ENTRY_BASE,
  MAIN_FORM_NAME,
} from '../../constants';
import { useAssetCurrencyOptions, useWallet } from '../../hooks';
import { parseAsWalletAddress } from '../../parsers';
import type {
  TAssetsQuery,
  TCurrencyEntryBase,
  TCurrencyEntryBaseTransformed,
} from '../../types';
import { resolveCurrencyAsset } from '../../utils';
import { CurrencySelection } from '../common/CurrencySelection';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

type FormValues = {
  func: TAssetsQuery;
  chain: TSubstrateChain;
  destination: TChain;
  currency: TCurrencyEntryBase;
  address: string;
  useApi: boolean;
};

export type FormValuesResolved = Omit<FormValues, 'currency'> & {
  currency: TCurrencyEntryBaseTransformed;
};

type Props = {
  onSubmit: (values: FormValuesResolved) => void;
  loading: boolean;
};

export const AssetsQueriesForm: FC<Props> = ({ onSubmit, loading }) => {
  const { selectedAccount } = useWallet();

  const [queryState, setQueryState] = useQueryStates({
    func: parseAsStringLiteral(ASSET_QUERIES).withDefault('ASSETS_OBJECT'),
    chain: parseAsStringLiteral(SUBSTRATE_CHAINS).withDefault('Acala'),
    destination: parseAsStringLiteral(CHAINS).withDefault('Astar'),
    address: parseAsWalletAddress.withDefault(
      selectedAccount?.address ?? DEFAULT_ADDRESS,
    ),
    useApi: parseAsBoolean.withDefault(false),
  });

  const form = useForm<FormValues>({
    name: MAIN_FORM_NAME,
    initialValues: {
      ...queryState,
      currency: DEFAULT_CURRENCY_ENTRY_BASE,
    },
  });

  useEffect(() => {
    const { currency: _currency, ...rest } = form.values;
    void setQueryState(rest);
  }, [form.values, setQueryState]);

  const { func, chain } = form.getValues();
  const currency = form.values.currency;

  const { currencyOptions, currencyMap } = useAssetCurrencyOptions(chain);

  const showCurrency =
    func === 'ASSET_LOCATION' ||
    func === 'ASSET_RESERVE_CHAIN' ||
    func === 'ASSET_INFO' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'SUPPORTED_DESTINATIONS';

  const showAddressInput = func === 'ASSET_BALANCE' || func === 'CONVERT_SS58';

  const supportsRelayChains =
    func === 'ASSETS_OBJECT' ||
    func === 'NATIVE_ASSETS' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ASSET_BALANCE' ||
    func === 'ASSET_INFO' ||
    func === 'ASSET_RESERVE_CHAIN' ||
    func === 'HAS_DRY_RUN_SUPPORT' ||
    func === 'ALL_SYMBOLS';

  const optionalCurrency = func === 'EXISTENTIAL_DEPOSIT';

  const shouldHideChain =
    func === 'ETHEREUM_BRIDGE_STATUS' || func === 'PARA_ETH_FEES';

  const chainList = supportsRelayChains
    ? CHAINS
    : [...PARACHAINS, ...EXTERNAL_CHAINS];

  useEffect(() => {
    if (!chainList.includes(chain as (typeof chainList)[0])) {
      form.setFieldValue('chain', 'Acala');
    }
  }, [chainList, chain]);

  const onSelectFunctionClick = () => {
    if (showCurrency) {
      form.setFieldValue('currency', DEFAULT_CURRENCY_ENTRY_BASE);
    }
  };

  const isRelay = isRelayChain(chain);

  const onSubmitInternal = (values: FormValues) => {
    const resolved = resolveCurrencyAsset(values.currency, currencyMap);
    onSubmit({ ...values, currency: resolved });
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack>
          <Select
            label="Function"
            placeholder="Pick value"
            data={ASSET_QUERIES}
            searchable
            required
            allowDeselect={false}
            data-testid="select-func"
            onSelect={onSelectFunctionClick}
            {...form.getInputProps('func')}
          />

          {!shouldHideChain && (
            <ParachainSelect
              label={'Chain'}
              placeholder="Pick value"
              data={chainList}
              required
              data-testid="select-chain"
              {...form.getInputProps('chain')}
            />
          )}

          {(func === 'SUPPORTED_ASSETS' || func === 'ASSET_INFO') && (
            <ParachainSelect
              label={'Destination'}
              placeholder="Pick value"
              data={CHAINS}
              required={func === 'SUPPORTED_ASSETS'}
              clearable={func === 'ASSET_INFO'}
              data-testid="select-destination"
              {...form.getInputProps('destination')}
            />
          )}

          {showCurrency && (
            <CurrencySelection
              key={`${func}-${chain}`}
              form={form}
              fieldPath="currency"
              fieldValue={currency}
              currencyOptions={currencyOptions}
              required={!optionalCurrency}
              disabled={isRelay}
              label={`Currency${optionalCurrency ? ' (optional)' : ''}`}
              onClear={
                optionalCurrency
                  ? () =>
                      form.setFieldValue(
                        'currency',
                        DEFAULT_CURRENCY_ENTRY_BASE,
                      )
                  : undefined
              }
            />
          )}

          {showAddressInput && (
            <TextInput
              label="Address"
              placeholder="Enter address"
              required
              data-testid="address-input"
              {...form.getInputProps('address')}
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
