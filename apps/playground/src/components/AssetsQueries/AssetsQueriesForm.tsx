import {
  Button,
  JsonInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import {
  CHAINS,
  EXTERNAL_CHAINS,
  getRelayChainSymbol,
  isRelayChain,
  PARACHAINS,
} from '@paraspell/sdk';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { type FC, useEffect, useRef } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import { ASSET_QUERIES } from '../../consts';
import { useAutoFillWalletAddress, useWallet } from '../../hooks';
import type { TAssetsQuery } from '../../types';
import {
  parseAsAssetQuery,
  parseAsChain,
  parseAsCurrencyType,
  parseAsCustomCurrencySymbolSpecifier,
  parseAsRecipientAddress,
  parseAsSubstrateChain,
} from '../../utils/routes/parsers';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type TCustomCurrencySymbolSpecifier =
  | 'auto'
  | 'native'
  | 'foreign'
  | 'foreignAbstract';

export type TCurrencyType = 'id' | 'symbol' | 'location';

export type FormValues = {
  func: TAssetsQuery;
  chain: TSubstrateChain;
  destination: TChain;
  currency: string;
  amount: string;
  address: string;
  useApi: boolean;
  currencyType?: TCurrencyType;
  customCurrencySymbolSpecifier?: TCustomCurrencySymbolSpecifier;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

export const AssetsQueriesForm: FC<Props> = ({ onSubmit, loading }) => {
  const [queryState, setQueryState] = useQueryStates({
    func: parseAsAssetQuery.withDefault('ASSETS_OBJECT'),
    chain: parseAsSubstrateChain.withDefault('Acala'),
    destination: parseAsChain.withDefault('Astar'),
    currency: parseAsString.withDefault(''),
    address: parseAsRecipientAddress.withDefault(DEFAULT_ADDRESS),
    amount: parseAsString.withDefault(''),
    useApi: parseAsBoolean.withDefault(false),
    currencyType: parseAsCurrencyType.withDefault('symbol' as TCurrencyType),
    customCurrencySymbolSpecifier:
      parseAsCustomCurrencySymbolSpecifier.withDefault('auto'),
  });

  const form = useForm<FormValues>({
    initialValues: queryState,
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  useAutoFillWalletAddress(form, 'address');

  const { func, chain, currencyType, useApi } = form.getValues();

  const { setIsUseXcmApiSelected } = useWallet();

  const showSymbolInput =
    func === 'ASSET_ID' ||
    func === 'ASSET_LOCATION' ||
    func === 'ASSET_INFO' ||
    func === 'DECIMALS' ||
    func == 'HAS_SUPPORT' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'SUPPORTED_DESTINATIONS';

  const supportsCurrencyType =
    func === 'ASSET_LOCATION' ||
    func === 'ASSET_INFO' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'SUPPORTED_DESTINATIONS';

  const showAddressInput = func === 'ASSET_BALANCE' || func === 'CONVERT_SS58';

  const onSubmitInternal = (formValues: FormValues) => {
    const { func } = formValues;
    const usesSymbol =
      func === 'ASSET_ID' || func === 'DECIMALS' || func === 'HAS_SUPPORT';
    return onSubmit({
      ...formValues,
      ...(usesSymbol && { symbol: formValues.currency }),
    });
  };

  const supportsRelayChains =
    func === 'ASSETS_OBJECT' ||
    func === 'NATIVE_ASSETS' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ASSET_BALANCE' ||
    func === 'ASSET_INFO' ||
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

  const onSelectCurrencyTypeClick = () => {
    form.setFieldValue('currency', '');
  };

  const onSelectFunctionClick = () => {
    if (showSymbolInput) {
      form.setFieldValue('currency', '');
      form.setFieldValue('currencyType', 'symbol');
    }
  };

  const isRelay = isRelayChain(chain);

  const previousChainRef = useRef<TSubstrateChain>(chain);

  useEffect(() => {
    const prevChain = previousChainRef.current;
    const wasRelay = isRelayChain(prevChain);

    const isNowRelay = isRelayChain(chain);

    if (isNowRelay) {
      form.setFieldValue('currency', getRelayChainSymbol(chain));
    } else if (wasRelay && !isNowRelay) {
      form.setFieldValue('currency', '');
    }

    previousChainRef.current = chain;
  }, [chain, func]);

  const symbolSpecifierOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Native', value: 'native' },
    { label: 'Foreign', value: 'foreign' },
    { label: 'Foreign abstract', value: 'foreignAbstract' },
  ];

  useEffect(() => {
    setIsUseXcmApiSelected(useApi);
  }, [useApi]);

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

          {showSymbolInput && (
            <Stack gap="xs">
              {(currencyType === 'id' || currencyType === 'symbol') && (
                <TextInput
                  flex={1}
                  label={
                    supportsCurrencyType
                      ? `Currency ${optionalCurrency ? '(optional)' : ''}`
                      : `Symbol ${optionalCurrency ? '(optional)' : ''}`
                  }
                  placeholder={
                    supportsCurrencyType
                      ? 'GLMR'
                      : currencyType === 'id'
                        ? 'Asset ID'
                        : 'Symbol'
                  }
                  required={!optionalCurrency}
                  disabled={isRelay}
                  data-testid="input-currency"
                  {...form.getInputProps('currency')}
                />
              )}

              {currencyType === 'location' && (
                <JsonInput
                  placeholder="Input JSON location or interior junctions to search for and identify the asset"
                  formatOnBlur
                  autosize
                  minRows={10}
                  {...form.getInputProps('currency')}
                />
              )}

              {supportsCurrencyType && !isRelay && (
                <SegmentedControl
                  size="xs"
                  data={[
                    { label: 'Asset ID', value: 'id' },
                    { label: 'Symbol', value: 'symbol' },
                    { label: 'Location', value: 'location' },
                  ]}
                  onClick={onSelectCurrencyTypeClick}
                  data-testid="currency-type"
                  {...form.getInputProps('currencyType')}
                />
              )}
              {supportsCurrencyType && !isRelay && currencyType == 'symbol' && (
                <SegmentedControl
                  size="xs"
                  w="100%"
                  data={symbolSpecifierOptions}
                  {...form.getInputProps(`customCurrencySymbolSpecifier`)}
                />
              )}
            </Stack>
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
