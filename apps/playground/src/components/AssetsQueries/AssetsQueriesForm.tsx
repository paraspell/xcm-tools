import { useForm } from '@mantine/form';
import { useEffect, useRef, type FC } from 'react';
import {
  Button,
  JsonInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk';
import {
  getRelayChainSymbol,
  isRelayChain,
  NODE_NAMES,
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import type { TAssetsQuery } from '../../types';
import { ASSET_QUERIES } from '../../consts';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  func: TAssetsQuery;
  node: TNodeDotKsmWithRelayChains;
  nodeDestination: TNodeDotKsmWithRelayChains;
  currency: string;
  amount: string;
  address: string;
  accountDestination: string;
  useApi: boolean;
  currencyType?: 'id' | 'symbol' | 'multilocation';
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
      nodeDestination: 'Astar',
      currency: '',
      address: '',
      accountDestination: '',
      amount: '',
      useApi: false,
      currencyType: 'symbol',
    },
  });

  const { func, node, currencyType } = form.getValues();

  const showSymbolInput =
    func === 'ASSET_ID' ||
    func === 'DECIMALS' ||
    func == 'HAS_SUPPORT' ||
    func === 'BALANCE_NATIVE' ||
    func === 'BALANCE_FOREIGN' ||
    func === 'ASSET_BALANCE' ||
    func === 'MAX_FOREIGN_TRANSFERABLE_AMOUNT' ||
    func === 'MAX_NATIVE_TRANSFERABLE_AMOUNT' ||
    func === 'TRANSFERABLE_AMOUNT' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const supportsCurrencyType =
    func === 'BALANCE_FOREIGN' ||
    func === 'ASSET_BALANCE' ||
    func === 'MAX_FOREIGN_TRANSFERABLE_AMOUNT' ||
    func === 'TRANSFERABLE_AMOUNT' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const showAddressInput =
    func === 'BALANCE_FOREIGN' ||
    func === 'BALANCE_NATIVE' ||
    func === 'ASSET_BALANCE' ||
    func === 'MAX_NATIVE_TRANSFERABLE_AMOUNT' ||
    func === 'MAX_FOREIGN_TRANSFERABLE_AMOUNT' ||
    func === 'TRANSFERABLE_AMOUNT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const onSubmitInternal = (formValues: FormValues) => {
    const { func } = formValues;
    const usesSymbol =
      func === 'ASSET_ID' || func === 'DECIMALS' || func === 'HAS_SUPPORT';
    return onSubmit({
      ...formValues,
      ...(usesSymbol && { symbol: formValues.currency }),
    });
  };

  const notSupportsEthereum =
    func === 'PARA_ID' ||
    func === 'BALANCE_NATIVE' ||
    func === 'BALANCE_FOREIGN' ||
    func === 'ASSET_BALANCE' ||
    func === 'MAX_NATIVE_TRANSFERABLE_AMOUNT' ||
    func === 'MAX_FOREIGN_TRANSFERABLE_AMOUNT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const supportsRelayChains =
    func === 'ASSETS_OBJECT' ||
    func === 'NATIVE_ASSETS' ||
    func === 'BALANCE_NATIVE' ||
    func === 'MAX_NATIVE_TRANSFERABLE_AMOUNT' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'TRANSFERABLE_AMOUNT' ||
    func === 'ASSET_BALANCE' ||
    func === 'ORIGIN_FEE_DETAILS';

  const optionalCurrency =
    func === 'MAX_NATIVE_TRANSFERABLE_AMOUNT' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'BALANCE_NATIVE';

  const getNodeList = () => {
    if (notSupportsEthereum && supportsRelayChains) {
      return NODES_WITH_RELAY_CHAINS_DOT_KSM;
    }

    if (notSupportsEthereum && !supportsRelayChains) {
      return NODE_NAMES_DOT_KSM;
    }

    if (!notSupportsEthereum && supportsRelayChains) {
      return NODES_WITH_RELAY_CHAINS;
    }

    return NODE_NAMES;
  };

  const nodeList = getNodeList();

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

  const isOriginFee = func === 'ORIGIN_FEE_DETAILS';

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

          <ParachainSelect
            label={isOriginFee ? 'Origin node' : 'Node'}
            placeholder="Pick value"
            data={nodeList}
            required
            data-testid="select-node"
            {...form.getInputProps('node')}
          />

          {isOriginFee && (
            <ParachainSelect
              label={'Destination node'}
              placeholder="Pick value"
              data={nodeList}
              required
              data-testid="select-node-destination"
              {...form.getInputProps('nodeDestination')}
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
            </Stack>
          )}

          {isOriginFee && (
            <TextInput
              label="Amount"
              placeholder="0"
              required
              data-testid="input-amount"
              {...form.getInputProps('amount')}
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

          {isOriginFee && (
            <TextInput
              label="Destination address"
              placeholder="Enter address"
              required
              data-testid="address-input"
              {...form.getInputProps('accountDestination')}
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
