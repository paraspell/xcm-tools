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
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import { type FC, useEffect, useRef } from 'react';

import { ASSET_QUERIES } from '../../consts';
import { useWallet } from '../../hooks/useWallet';
import type { TAssetsQuery } from '../../types';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  func: TAssetsQuery;
  node: TNodeDotKsmWithRelayChains;
  nodeDestination: TNodeWithRelayChains;
  currency: string;
  amount: string;
  address: string;
  ahAddress: string;
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
      ahAddress: '',
      accountDestination: '',
      amount: '',
      useApi: false,
      currencyType: 'symbol',
    },
  });

  const { func, node, currencyType, useApi, nodeDestination } =
    form.getValues();

  const { setIsUseXcmApiSelected } = useWallet();

  const showSymbolInput =
    func === 'ASSET_ID' ||
    func === 'ASSET_MULTILOCATION' ||
    func === 'DECIMALS' ||
    func == 'HAS_SUPPORT' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const supportsCurrencyType =
    func === 'ASSET_MULTILOCATION' ||
    func === 'ASSET_BALANCE' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ORIGIN_FEE_DETAILS';

  const showAddressInput =
    func === 'ASSET_BALANCE' ||
    func === 'ORIGIN_FEE_DETAILS' ||
    func === 'CONVERT_SS58';

  const showAhAddressInput = func === 'ORIGIN_FEE_DETAILS';

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
    func === 'ASSET_BALANCE' ||
    func === 'ORIGIN_FEE_DETAILS';

  const supportsRelayChains =
    func === 'ASSETS_OBJECT' ||
    func === 'NATIVE_ASSETS' ||
    func === 'EXISTENTIAL_DEPOSIT' ||
    func === 'ASSET_BALANCE' ||
    func === 'ORIGIN_FEE_DETAILS' ||
    func === 'HAS_DRY_RUN_SUPPORT';

  const optionalCurrency = func === 'EXISTENTIAL_DEPOSIT';

  const supportsAmount = func === 'ORIGIN_FEE_DETAILS';

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

          {func !== 'ETHEREUM_BRIDGE_STATUS' && (
            <ParachainSelect
              label={isOriginFee ? 'Origin node' : 'Node'}
              placeholder="Pick value"
              data={nodeList}
              required
              data-testid="select-node"
              {...form.getInputProps('node')}
            />
          )}

          {isOriginFee && (
            <ParachainSelect
              label={'Destination node'}
              placeholder="Pick value"
              data={NODES_WITH_RELAY_CHAINS}
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

          {supportsAmount && (
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

          {showAhAddressInput &&
            node === 'Moonbeam' &&
            nodeDestination === 'Ethereum' && (
              <TextInput
                label="AssetHub address"
                placeholder="Enter address"
                required
                data-testid="ah-address-input"
                {...form.getInputProps('ahAddress')}
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
