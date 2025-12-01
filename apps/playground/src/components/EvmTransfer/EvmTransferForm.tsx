import {
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TAssetInfo, TChain, TEvmChainFrom } from '@paraspell/sdk';
import { CHAINS, getTokenBalance } from '@paraspell/sdk-pjs';
import { type BrowserProvider, ethers, formatEther } from 'ethers';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { type FC, type FormEvent, useEffect, useState } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useCurrencyOptions,
  useWallet,
} from '../../hooks';
import type { TEvmSubmitType } from '../../types';
import { isValidPolkadotAddress } from '../../utils';
import {
  parseAsChain,
  parseAsEvmChain,
  parseAsRecipientAddress,
} from '../../utils/routes/parsers';
import { CurrencyInfo } from '../CurrencyInfo';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type FormValues = {
  from: TEvmChainFrom;
  to: TChain;
  currencyOptionId: string;
  address: string;
  ahAddress: string;
  amount: string;
  useViem: boolean;
};

export type FormValuesTransformed = FormValues & {
  currency?: TAssetInfo;
};

type Props = {
  onSubmit: (values: FormValues, submitType: TEvmSubmitType) => void;
  loading: boolean;
  provider: BrowserProvider | null;
};

const EvmTransferForm: FC<Props> = ({ onSubmit, loading, provider }) => {
  const [queryState, setQueryState] = useQueryStates({
    from: parseAsEvmChain.withDefault('Ethereum'),
    to: parseAsChain.withDefault('AssetHubPolkadot'),
    currencyOptionId: parseAsString.withDefault(''),
    amount: parseAsString.withDefault('10'),
    address: parseAsRecipientAddress.withDefault(DEFAULT_ADDRESS),
    ahAddress: parseAsString.withDefault(''),
    useViem: parseAsBoolean.withDefault(false),
  });

  const form = useForm<FormValues>({
    initialValues: queryState,

    validate: {
      address: (value) =>
        isValidPolkadotAddress(value) || ethers.isAddress(value)
          ? null
          : 'Invalid address',
      ahAddress: (value, values) =>
        values.from === 'Moonbeam' && values.to === 'Ethereum' && !value,
      amount: (value) => {
        return Number(value) > 0 ? null : 'Amount must be greater than 0';
      },
    },
  });

  useAutoFillWalletAddress(form, 'address');
  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  const { from } = form.getValues();

  const { currencyOptions, currencyMap } = useCurrencyOptions(
    form.values.from,
    form.values.to,
  );

  const [balance, setBalance] = useState<string>('0.0');

  useEffect(() => {
    const fetchBalance = async () => {
      const currency = currencyMap[form.values.currencyOptionId];
      try {
        if (!provider) {
          return;
        }
        const signer = await provider.getSigner();
        if (currency && signer) {
          const bal = await getTokenBalance(signer, currency.symbol);
          setBalance(formatEther(bal));
        } else {
          setBalance('0');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setBalance('Error');
      }
    };
    void fetchBalance();
  }, [form.values.currencyOptionId, currencyMap]);

  const onSubmitInternal = (
    values: FormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TEvmSubmitType = 'default',
  ) => {
    const currency = currencyMap[values.currencyOptionId];

    if (!currency) {
      return;
    }

    const transformedValues = { ...values, currency: currency };

    onSubmit(transformedValues, submitType);
  };

  const selectedCurrencySymbol =
    currencyMap[form.values.currencyOptionId]?.symbol;

  const onSubmitDeposit = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'deposit');
    }
  };

  const onSubmitApprove = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'approve');
    }
  };

  const { apiType } = useWallet();

  useEffect(() => {
    if (apiType === 'PAPI') {
      form.setFieldValue('useViem', true);
    }
  }, [apiType]);

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack>
          <Switch
            label="Use viem?"
            data-testid="switch-api"
            disabled={apiType !== 'PJS'}
            {...form.getInputProps('useViem', { type: 'checkbox' })}
          />

          <ParachainSelect
            label="From"
            placeholder="Pick value"
            data={['Ethereum', 'Moonbeam', 'Moonriver', 'Darwinia']}
            data-testid="select-source"
            {...form.getInputProps('from')}
          />

          <ParachainSelect
            label="To"
            placeholder="Pick value"
            data={CHAINS}
            data-testid="select-destination"
            {...form.getInputProps('to')}
          />

          <Select
            key={form.values.from + form.values.to}
            label="Currency"
            placeholder="Pick value"
            data={currencyOptions}
            allowDeselect={false}
            searchable
            required
            data-testid="select-currency"
            {...form.getInputProps('currencyOptionId')}
          />

          <TextInput
            label="Recipient address"
            placeholder="Enter address"
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          {form.values.from === 'Moonbeam' && form.values.to === 'Ethereum' && (
            <TextInput
              label="AssetHub address"
              placeholder="Enter address"
              data-testid="input-ah-address"
              {...form.getInputProps('ahAddress')}
            />
          )}

          <TextInput
            label="Amount"
            rightSection={<CurrencyInfo />}
            placeholder="0"
            required
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

          {selectedCurrencySymbol && provider && from === 'Ethereum' && (
            <Stack justify="center" ta="center">
              <Text size="xs">
                {selectedCurrencySymbol} balance: {balance}
              </Text>
              <Group>
                <Button
                  size="xs"
                  flex={1}
                  variant="light"
                  onClick={onSubmitDeposit}
                >
                  Deposit {selectedCurrencySymbol}
                </Button>
                <Button
                  data-testid="btn-currency-approve"
                  size="xs"
                  flex={1}
                  variant="light"
                  onClick={onSubmitApprove}
                >
                  Approve {selectedCurrencySymbol}
                </Button>
              </Group>
            </Stack>
          )}

          <Button type="submit" loading={loading} data-testid="submit">
            Submit transaction
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default EvmTransferForm;
