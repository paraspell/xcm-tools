import { useForm } from '@mantine/form';
import { isValidWalletAddress } from '../../utils';
import type { FC, FormEvent } from 'react';
import { useEffect } from 'react';
import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  Menu,
  Paper,
  Stack,
  TextInput,
  useComputedColorScheme,
} from '@mantine/core';
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import {
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import useCurrencyOptions from '../../hooks/useCurrencyOptions';
import { CurrencySelection } from '../common/CurrencySelection';
import {
  IconChevronDown,
  IconLocationCheck,
  IconPlus,
  IconTransfer,
  IconTrash,
} from '@tabler/icons-react';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { useWallet } from '../../hooks/useWallet';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import type { TSubmitType } from '../../types';

export type TCurrencyEntry = {
  currencyOptionId: string;
  customCurrency: string;
  amount: string;
  isFeeAsset: boolean;
  isCustomCurrency: boolean;
  customCurrencyType?:
    | 'id'
    | 'symbol'
    | 'multilocation'
    | 'overridenMultilocation';
  customCurrencySymbolSpecifier?:
    | 'auto'
    | 'native'
    | 'foreign'
    | 'foreignAbstract';
};

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeWithRelayChains;
  currencies: TCurrencyEntry[];
  address: string;
  useApi: boolean;
};

export type TCurrencyEntryTransformed = TCurrencyEntry & { currency?: TAsset };

export type FormValuesTransformed = FormValues & {
  currencies: TCurrencyEntryTransformed[];
};

type Props = {
  onSubmit: (values: FormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  isBatchMode: boolean;
  initialValues?: FormValues;
  isVisible?: boolean;
};

const XcmTransferForm: FC<Props> = ({
  onSubmit,
  loading,
  isBatchMode,
  initialValues,
  isVisible = true,
}) => {
  const form = useForm<FormValues>({
    initialValues: initialValues ?? {
      from: 'Astar',
      to: 'Hydration',
      currencies: [
        {
          currencyOptionId: '',
          customCurrency: '',
          amount: '10000000000000000000',
          isFeeAsset: false,
          isCustomCurrency: false,
          customCurrencyType: 'id',
          customCurrencySymbolSpecifier: 'auto',
        },
      ],
      address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      currencies: {
        currencyOptionId: (value, values, path) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return values.currencies[index].customCurrency
              ? null
              : 'Custom currency is required';
          } else {
            return value ? null : 'Currency selection is required';
          }
        },
        customCurrency: (value, values, path) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return value ? null : 'Custom currency is required';
          }
          return null;
        },
      },
    },
  });

  const { from, to, currencies } = form.getValues();

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const onSubmitInternal = (
    values: FormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TSubmitType = 'default',
  ) => {
    // Transform each currency entry
    const transformedCurrencies = values.currencies.map((currEntry) => {
      if (currEntry.isCustomCurrency) {
        // Custom currency doesn't map to currencyMap
        return { ...currEntry };
      }

      const currency = currencyMap[currEntry.currencyOptionId];

      if (!currency) {
        return { ...currEntry };
      }

      return { ...currEntry, currency };
    });

    const transformedValues: FormValuesTransformed = {
      ...values,
      currencies: transformedCurrencies,
    };

    if (submitType === 'dryRun' || submitType === 'delete') {
      onSubmit(transformedValues, submitType);
      return;
    }

    onSubmit(transformedValues, initialValues ? 'update' : submitType);
  };

  const onSubmitInternalDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'dryRun');
    }
  };

  const onSubmitInternalAddToBatch = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'addToBatch');
    }
  };

  useEffect(() => {
    if (isNotParaToPara && Object.keys(currencyMap).length === 1) {
      form.setFieldValue(
        'currencies.0.currencyOptionId',
        Object.keys(currencyMap)[0],
      );
    }
  }, [isNotParaToPara, currencyMap]);

  const onSwap = () => {
    const { from, to } = form.getValues();
    if (to !== 'Ethereum') {
      form.setFieldValue('from', to);
      form.setFieldValue('to', from);
    }
  };

  const { connectWallet, selectedAccount, isInitialized, isLoadingExtensions } =
    useWallet();

  const onConnectWalletClick = () => void connectWallet();

  const getSubmitLabel = () => {
    if (initialValues) return 'Update transaction';
    return isBatchMode ? 'Submit batch' : 'Submit transaction';
  };

  const colorScheme = useComputedColorScheme();

  if (!isVisible) {
    return null;
  }

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the origin chain"
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
            label="Destination"
            placeholder="Pick value"
            description="Select the destination chain"
            data={NODES_WITH_RELAY_CHAINS}
            data-testid="select-destination"
            {...form.getInputProps('to')}
          />

          <Stack gap="md">
            {currencies.map((_, index) => (
              <Fieldset
                key={index}
                legend={
                  currencies.length > 1 ? `Asset ${index + 1}` : undefined
                }
                pos="relative"
              >
                <Group>
                  <Stack gap="xs" flex={1}>
                    <CurrencySelection
                      form={form}
                      index={index}
                      currencyOptions={currencyOptions}
                    />
                    <TextInput
                      label="Amount"
                      placeholder="0"
                      size={currencies.length > 1 ? 'xs' : 'sm'}
                      required
                      data-testid={`input-amount-${index}`}
                      {...form.getInputProps(`currencies.${index}.amount`)}
                    />
                  </Stack>
                  {form.values.currencies.length > 1 && (
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      bg={colorScheme === 'light' ? 'white' : 'dark.7'}
                      pos="absolute"
                      right={20}
                      top={-25}
                      onClick={() => form.removeListItem('currencies', index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Fieldset>
            ))}

            <Button
              variant="transparent"
              size="compact-xs"
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                form.insertListItem('currencies', {
                  currencyOptionId: '',
                  customCurrency: '',
                  amount: '10000000000000000000',
                  isCustomCurrency: false,
                  customCurrencyType: 'id',
                })
              }
            >
              Add another asset
            </Button>
          </Stack>

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          {selectedAccount ? (
            <Button.Group>
              <Button
                type="submit"
                loading={loading}
                flex={1}
                data-testid="submit"
              >
                {getSubmitLabel()}
              </Button>

              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Button
                    style={{
                      borderLeft: '1px solid #ff93c0',
                    }}
                  >
                    <IconChevronDown />
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconLocationCheck size={16} />}
                    onClick={onSubmitInternalDryRun}
                  >
                    Dry run
                  </Menu.Item>

                  {!initialValues && (
                    <Menu.Item
                      leftSection={<IconPlus size={16} />}
                      onClick={onSubmitInternalAddToBatch}
                    >
                      Add to batch
                    </Menu.Item>
                  )}

                  {initialValues && (
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      onClick={() =>
                        onSubmitInternal(form.getValues(), undefined, 'delete')
                      }
                    >
                      Delete from batch
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Button.Group>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!isInitialized || isLoadingExtensions}
            >
              Connect wallet
            </Button>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default XcmTransferForm;
