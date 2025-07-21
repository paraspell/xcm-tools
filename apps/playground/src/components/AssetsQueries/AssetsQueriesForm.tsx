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
import type {
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import {
  getRelayChainSymbol,
  isRelayChain,
  NODE_NAMES,
  NODES_WITH_RELAY_CHAINS,
} from '@paraspell/sdk';
import { type FC, useEffect, useRef } from 'react';

import { ASSET_QUERIES } from '../../consts';
import { useAutoFillWalletAddress, useWallet } from '../../hooks';
import type { TAssetsQuery } from '../../types';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  func: TAssetsQuery;
  node: TNodeDotKsmWithRelayChains;
  destination: TNodeWithRelayChains;
  currency: string;
  amount: string;
  address: string;
  useApi: boolean;
  currencyType?: 'id' | 'symbol' | 'multilocation';
  customCurrencySymbolSpecifier?:
    | 'auto'
    | 'native'
    | 'foreign'
    | 'foreignAbstract';
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

export const AssetsQueriesForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: 'ASSETS_OBJECT',
      node: 'Acala',
      destination: 'Astar',
      currency: '',
      address: '',
      amount: '',
      useApi: false,
      currencyType: 'symbol',
    },
  });

  useAutoFillWalletAddress(form, 'address');

  const { func, node, currencyType, useApi } = form.getValues();

  const { setIsUseXcmApiSelected } = useWallet();

  const showSymbolInput =
    func === 'ASSET_ID' ||
    func === 'ASSET_MULTILOCATION' ||
    func === 'DECIMALS' ||
    func == 'HAS_SUPPORT' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'SUPPORTED_DESTINATIONS';

  const supportsCurrencyType =
    func === 'ASSET_MULTILOCATION' ||
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
    func === 'HAS_DRY_RUN_SUPPORT';

  const optionalCurrency = func === 'EXISTENTIAL_DEPOSIT';

  const shouldHideNode =
    func === 'ETHEREUM_BRIDGE_STATUS' || func === 'PARA_ETH_FEES';

  const nodeList = supportsRelayChains ? NODES_WITH_RELAY_CHAINS : NODE_NAMES;

  useEffect(() => {
    if (!nodeList.includes(node as (typeof nodeList)[0])) {
      form.setFieldValue('node', 'Acala');
    }
  }, [nodeList, node]);

  useEffect(() => {
    if (showSymbolInput) {
      form.setFieldValue('currency', '');
      form.setFieldValue('currencyType', 'symbol');
    }
  }, [func]);

  const onSelectCurrencyTypeClick = () => {
    form.setFieldValue('currency', '');
  };

  const isRelay = isRelayChain(node);

  const previousNodeRef = useRef<TNodeDotKsmWithRelayChains>(node);

  useEffect(() => {
    const prevNode = previousNodeRef.current;
    const wasRelay = isRelayChain(prevNode);

    const isNowRelay = isRelayChain(node);

    if (isNowRelay) {
      form.setFieldValue('currency', getRelayChainSymbol(node));
    } else if (wasRelay && !isNowRelay) {
      form.setFieldValue('currency', '');
    }

    previousNodeRef.current = node;
  }, [node, func]);

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
            {...form.getInputProps('func')}
          />

          {!shouldHideNode && (
            <ParachainSelect
              label={'Node'}
              placeholder="Pick value"
              data={nodeList}
              required
              data-testid="select-node"
              {...form.getInputProps('node')}
            />
          )}

          {func === 'SUPPORTED_ASSETS' && (
            <ParachainSelect
              label={'Destination'}
              placeholder="Pick value"
              data={NODES_WITH_RELAY_CHAINS}
              required
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

              {currencyType === 'multilocation' && (
                <JsonInput
                  placeholder="Input Multi-Location JSON or interior junctions JSON to search for and identify the asset"
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
                    { label: 'Multi-location', value: 'multilocation' },
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
