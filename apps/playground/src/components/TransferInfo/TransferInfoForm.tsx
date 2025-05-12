import {
  ActionIcon,
  Button,
  JsonInput,
  Paper,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk';
import {
  getRelayChainSymbol,
  isRelayChain,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import { IconTransfer } from '@tabler/icons-react';
import { type FC, useEffect } from 'react';

import { useWallet } from '../../hooks/useWallet';
import { isValidWalletAddress } from '../../utils';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeDotKsmWithRelayChains;
  currency: string;
  address: string;
  destinationAddress: string;
  amount: string;
  useApi: boolean;
  customCurrencyType?: 'id' | 'symbol' | 'multilocation';
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

const TransferInfoForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Acala',
      to: 'Astar',
      currency: '',
      amount: '10000000000000000000',
      address: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      destinationAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      customCurrencyType: 'symbol',
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
    },
  });

  const { from, to, customCurrencyType, useApi } = form.getValues();

  const { setIsUseXcmApiSelected } = useWallet();

  const isNotParaToPara = isRelayChain(from) || isRelayChain(to);

  const onSelectCurrencyTypeClick = () => {
    form.setFieldValue('currency', '');
  };

  useEffect(() => {
    if (isNotParaToPara) {
      form.setFieldValue('customCurrencyType', 'symbol');
      if (isRelayChain(from)) {
        form.setFieldValue('currency', getRelayChainSymbol(from));
      }
      if (isRelayChain(to)) {
        form.setFieldValue('currency', getRelayChainSymbol(to));
      }
    }
  }, [from, to]);

  const onSwap = () => {
    const { from, to } = form.getValues();
    form.setFieldValue('from', to);
    form.setFieldValue('to', from);
  };

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
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <ParachainSelect
            label="Origin node"
            placeholder="Pick value"
            data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
            data-testid="select-origin"
            {...form.getInputProps('from')}
          />

          <ActionIcon
            variant="outline"
            style={{ margin: '0 auto', marginBottom: -12 }}
          >
            <IconTransfer
              size={24}
              style={{ rotate: '90deg' }}
              onClick={onSwap}
            />
          </ActionIcon>

          <ParachainSelect
            label="Destination node"
            placeholder="Pick value"
            data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
            data-testid="select-destination"
            {...form.getInputProps('to')}
          />

          <Stack gap="xs">
            {(customCurrencyType === 'id' ||
              customCurrencyType === 'symbol') && (
              <TextInput
                disabled={isNotParaToPara}
                flex={1}
                label="Currency"
                placeholder={
                  customCurrencyType === 'id' ? 'Asset ID' : 'Symbol'
                }
                required
                data-testid="input-currency"
                {...form.getInputProps('currency')}
              />
            )}

            {customCurrencyType === 'multilocation' && (
              <JsonInput
                placeholder="Input Multi-Location JSON or interior junctions JSON to search for and identify the asset"
                formatOnBlur
                autosize
                minRows={10}
                {...form.getInputProps('currency')}
              />
            )}

            <SegmentedControl
              disabled={isNotParaToPara}
              onClick={onSelectCurrencyTypeClick}
              size="xs"
              data={[
                { label: 'Asset ID', value: 'id' },
                { label: 'Symbol', value: 'symbol' },
                { label: 'Multi-location', value: 'multilocation' },
              ]}
              {...form.getInputProps('customCurrencyType')}
            />
            {customCurrencyType === 'symbol' && (
              <SegmentedControl
                size="xs"
                w="100%"
                data={symbolSpecifierOptions}
                {...form.getInputProps(`customCurrencySymbolSpecifier`)}
              />
            )}
          </Stack>

          <TextInput
            label="Address"
            placeholder="Enter address"
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          <TextInput
            label="Destination Address"
            placeholder="Enter address"
            required
            data-testid="input-destination-address"
            {...form.getInputProps('destinationAddress')}
          />

          <TextInput
            label="Amount"
            placeholder="0"
            required
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          <Button type="submit" loading={loading} data-testid="submit">
            Show Transfer Info
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default TransferInfoForm;
