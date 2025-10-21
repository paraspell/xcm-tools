import {
  Button,
  Center,
  Fieldset,
  Group,
  Menu,
  MultiSelect,
  Paper,
  rem,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  CHAINS,
  findAssetInfo,
  getAssetsObject,
  getRelayChainSymbol,
  parseUnits,
  SUBSTRATE_CHAINS,
  type TAssetInfo,
  type TChain,
  type TLocation,
  type TSubstrateChain,
} from '@paraspell/sdk';
import {
  createExchangeInstance,
  EXCHANGE_CHAINS,
  type TExchangeChain,
  type TExchangeInput,
} from '@paraspell/xcm-router';
import {
  Icon123,
  IconArrowBarDown,
  IconArrowBarUp,
  IconChevronDown,
  IconCoinFilled,
  IconInfoCircle,
  IconLocationCheck,
} from '@tabler/icons-react';
import { ethers } from 'ethers';
import type { PolkadotSigner } from 'polkadot-api';
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
} from 'polkadot-api/pjs-signer';
import type { FC, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useRouterCurrencyOptions,
  useWallet,
} from '../../hooks';
import type {
  Side,
  TCurrencyEntry,
  TRouterSubmitType,
  TWalletAccount,
} from '../../types';
import { isValidWalletAddress } from '../../utils';
import { showErrorNotification } from '../../utils/notifications';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { CurrencyInfo } from '../CurrencyInfo';
import { EstimatedAmountInfo } from '../EstimatedAmountInfo';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import WalletSelectModal from '../WalletSelectModal/WalletSelectModal';
import { RouterCurrencyPicker } from './RouterCurrencySelector';

export type TRouterFormValues = {
  from?: TSubstrateChain;
  exchange?: TExchangeChain[];
  to?: TChain;
  currencyFrom: TCurrencyEntry;
  currencyTo: TCurrencyEntry;
  recipientAddress: string;
  amountFrom: string;
  amountTo: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
};

export type TRouterFormValuesTransformed = Omit<
  TRouterFormValues,
  'exchange' | 'currencyFrom' | 'currencyTo'
> & {
  exchange: TExchangeChain;
  currencyFrom: TAssetInfo;
  currencyTo: TAssetInfo;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
  onQuoteBestAmountValue: (
    formValues: TRouterFormValuesTransformed,
  ) => Promise<number | null>;
};

export const XcmRouterForm: FC<Props> = ({
  onSubmit,
  loading,
  onQuoteBestAmountValue,
}) => {
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();
  const [isAmountToQuoteLocked, setIsAmountToQuoteLocked] = useState(false);
  const [isAmountFromQuoteLocked, setIsAmountFromQuoteLocked] = useState(false);

  const ignoreForwardRef = useRef(false);
  const ignoreReverseRef = useRef(false);

  const quoteDebounceRef = useRef<number | null>(null);
  const lastQuoteKeyRef = useRef<string | null>(null);

  const driverRef = useRef<'from' | 'to' | null>(null);

  const hasCurrencySelection = (entry: TCurrencyEntry) =>
    entry.isCustom
      ? !!(entry.customValue && entry.customType)
      : !!entry.optionId;

  const amountInputPattern = /^\d*(?:\.\d*)?(?:e[+-]?\d*)?$/i;

  const normalizeAmountInput = (raw: string): string | null => {
    const replaced = raw.replace(/,/g, '.');
    if (replaced === '') return '';
    if (!amountInputPattern.test(replaced)) return null;
    return replaced;
  };

  const parseUnitsSafe = (value: string): bigint | null => {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const normalized = normalizeAmountInput(trimmed);
    if (normalized == null || normalized === '') return null;
    try {
      return parseUnits(normalized, 18);
    } catch (_error) {
      return null;
    }
  };

  const isPositiveAmount = (value: string) => {
    const parsed = parseUnitsSafe(value);
    return parsed != null && parsed > 0n;
  };

  const getPositiveAmountError = (value: string) => {
    if (value.trim() === '') {
      return 'Amount is required';
    }
    const parsed = parseUnitsSafe(value);
    if (parsed == null) {
      return 'Enter a valid number';
    }
    if (parsed <= 0n) {
      return 'Amount must be greater than 0';
    }
    return undefined;
  };

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedAccount(account);
    closeAccountsModal();
  };

  useEffect(() => {
    if (!selectedAccount || !injectedExtension) return;

    const account = injectedExtension
      ?.getAccounts()
      .find((account) => account.address === selectedAccount.address);
    if (!account) {
      throw new Error('No selected account');
    }

    form.setFieldValue('evmSigner', account.polkadotSigner);
    form.setFieldValue('evmInjectorAddress', selectedAccount.address);
  }, [selectedAccount, injectedExtension]);

  const form = useForm<TRouterFormValues>({
    initialValues: {
      from: 'Astar',
      exchange: undefined,
      to: 'Hydration',
      currencyFrom: {
        optionId: '',
        isCustom: false,
        customValue: '',
      },
      currencyTo: {
        optionId: '',
        isCustom: false,
        customValue: '',
      },
      amountFrom: '10',
      amountTo: '',
      recipientAddress: DEFAULT_ADDRESS,
      slippagePct: '1',
      useApi: false,
    },

    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!isValidWalletAddress(values.recipientAddress)) {
        errors.recipientAddress = 'Invalid address';
      }

      if (!hasCurrencySelection(values.currencyFrom)) {
        const fromErrorKey = values.currencyFrom.isCustom
          ? 'currencyFrom.customValue'
          : 'currencyFrom.optionId';
        errors[fromErrorKey] = 'Currency from selection is required';
      }

      if (!hasCurrencySelection(values.currencyTo)) {
        const toErrorKey = values.currencyTo.isCustom
          ? 'currencyTo.customValue'
          : 'currencyTo.optionId';
        errors[toErrorKey] = 'Currency to selection is required';
      }

      if (values.exchange === undefined && !values.from) {
        errors.exchange = 'Origin must be set to use Auto select';
      }

      const driver = driverRef.current;

      if (driver === 'from') {
        const amountError = getPositiveAmountError(values.amountFrom);
        if (amountError) {
          errors.amountFrom = amountError;
        }
      } else if (driver === 'to') {
        const amountError = getPositiveAmountError(values.amountTo);
        if (amountError) {
          errors.amountTo = amountError;
        }
      } else {
        const amountError = getPositiveAmountError(values.amountFrom);
        if (amountError) {
          errors.amountFrom = amountError;
        }
      }

      return errors;
    },
    validateInputOnChange: ['exchange'],
  });

  useAutoFillWalletAddress(form, 'recipientAddress');

  const { from, to, exchange } = form.getValues();

  const initEvmExtensions = () => {
    const ext = getInjectedExtensions();
    if (!ext.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      return;
    }
    setExtensions(ext);
    openWalletSelectModal();
  };

  const onConnectEvmWallet = () => {
    try {
      initEvmExtensions();
    } catch (_e) {
      showErrorNotification('Failed to connect EVM wallet');
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue('evmSigner', undefined);
    form.setFieldValue('evmInjectorAddress', undefined);
    closeAccountsModal();
  };

  const selectProvider = async (walletName: string) => {
    try {
      const extension = await connectInjectedExtension(walletName);
      setInjectedExtension(extension);

      const allAccounts = extension.getAccounts();
      const evmAccounts = allAccounts.filter((acc) =>
        ethers.isAddress(acc.address),
      );
      if (!evmAccounts.length) {
        showErrorNotification('No EVM accounts found in the selected wallet');
        return;
      }

      setAccounts(
        evmAccounts.map((acc) => ({
          address: acc.address,
          meta: {
            name: acc.name,
            source: extension.name,
          },
        })),
      );

      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to connect to wallet');
    }
  };

  const onProviderSelect = (walletName: string) => {
    void selectProvider(walletName);
  };

  const getExchange = (exchange: TExchangeChain[] | undefined) => {
    if (!exchange || exchange.length === 0) {
      return undefined;
    }

    if (exchange.length === 1) {
      return exchange[0];
    }

    return exchange;
  };

  const { currencyFrom, currencyTo } = form.values;
  const currencyFromOptionId = currencyFrom.optionId;
  const currencyToOptionId = currencyTo.optionId;

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
    adjacency,
  } = useRouterCurrencyOptions(
    from,
    getExchange(exchange) as TExchangeInput,
    to,
    currencyFromOptionId,
    currencyToOptionId,
  );

  const pairKey = (asset?: { location?: object; symbol?: string }) =>
    asset?.location ? JSON.stringify(asset.location) : asset?.symbol;

  const originRelaySymbol = useMemo(() => {
    const origin = form.values.from;
    if (!origin) return null;
    try {
      return getRelayChainSymbol(origin);
    } catch {
      return null;
    }
  }, [form.values.from]);

  const destinationRelaySymbol = useMemo(() => {
    const destination = form.values.to;
    if (!destination) return null;
    try {
      return getRelayChainSymbol(destination);
    } catch {
      return null;
    }
  }, [form.values.to]);

  const isCrossRelay = useMemo(() => {
    if (!originRelaySymbol || !destinationRelaySymbol) return false;
    return originRelaySymbol !== destinationRelaySymbol;
  }, [originRelaySymbol, destinationRelaySymbol]);

  const exchangeBaseParachain = useMemo(() => {
    if (!exchange) return undefined;
    const exchnageChain = Array.isArray(exchange)
      ? exchange[exchange.length - 1]
      : exchange;
    return createExchangeInstance(exchnageChain).chain;
  }, [exchange]);

  const hasFromAsset = (v: TRouterFormValues) =>
    hasCurrencySelection(v.currencyFrom);

  const hasToAsset = (v: TRouterFormValues) =>
    hasCurrencySelection(v.currencyTo);

  const isReadyStandard = (v: TRouterFormValues) =>
    !!v.from && !!v.to && isPositiveAmount(v.amountFrom) && hasFromAsset(v);

  const isReadyReverse = (v: TRouterFormValues) =>
    !!v.from &&
    !!v.to &&
    isPositiveAmount(v.amountTo) &&
    hasFromAsset(v) &&
    hasToAsset(v);

  const makeAssetInfo = (
    side: Side,
    v: TRouterFormValues,
  ): TAssetInfo | undefined => {
    const entry = side === 'from' ? v.currencyFrom : v.currencyTo;

    if (entry.isCustom) {
      const { customType, customValue } = entry;
      if (!customType || !customValue) return undefined;

      if (customType === 'id') {
        return { assetId: customValue } as unknown as TAssetInfo;
      }

      if (customType === 'symbol') {
        return { symbol: customValue } as TAssetInfo;
      }

      if (customType === 'location') {
        try {
          return {
            location: JSON.parse(customValue) as TLocation,
          } as unknown as TAssetInfo;
        } catch {
          return undefined;
        }
      }

      return undefined;
    }

    const optionId = entry.optionId;
    if (!optionId) return undefined;

    if (side === 'from') {
      const assetInfo = currencyFromMap[optionId];
      return assetInfo ? { ...assetInfo } : undefined;
    }

    const routerAsset = currencyToMap[optionId];
    if (!routerAsset) return undefined;

    const { location, assetId, symbol, decimals } = routerAsset;

    if (exchangeBaseParachain) {
      if (location) {
        const sdkAsset = findAssetInfo(
          exchangeBaseParachain,
          { location },
          null,
        );
        if (sdkAsset) return sdkAsset;
      }

      if (assetId != null) {
        const sdkAsset = findAssetInfo(
          exchangeBaseParachain,
          { id: assetId },
          null,
        );
        if (sdkAsset) return sdkAsset;
      }

      if (symbol) {
        const assets = getAssetsObject(exchangeBaseParachain);
        const allAssets = [
          ...(assets.nativeAssets ?? []),
          ...(assets.otherAssets ?? []),
        ];
        const matches = allAssets.filter(
          (asset) => asset.symbol?.toUpperCase() === symbol.toUpperCase(),
        );
        if (matches.length === 1) {
          return matches[0] as TAssetInfo;
        }
      }
    }

    if (location) {
      return {
        location,
        ...(symbol ? { symbol } : {}),
        decimals,
      } as TAssetInfo;
    }

    if (assetId != null) {
      return {
        assetId: String(assetId),
        ...(symbol ? { symbol } : {}),
        decimals,
      } as TAssetInfo;
    }

    if (symbol) {
      return {
        symbol,
        decimals,
      } as TAssetInfo;
    }

    return undefined;
  };

  const buildTransformedStandard = (
    v: TRouterFormValues,
  ): TRouterFormValuesTransformed | null => {
    const fromAsset = makeAssetInfo('from', v);
    const toAsset = makeAssetInfo('to', v);

    if (!fromAsset || !toAsset) return null;

    const exchangeValue = getExchange(v.exchange) as TExchangeChain;

    return {
      ...v,
      exchange: exchangeValue,
      currencyFrom: fromAsset,
      currencyTo: toAsset,
    };
  };

  useEffect(() => {
    const v = form.values;
    const mode: 'forward' | 'reverse' =
      driverRef.current === 'to' ? 'reverse' : 'forward';

    if (mode === 'forward') {
      if (ignoreForwardRef.current) {
        ignoreForwardRef.current = false;
        return;
      }
      if (!isReadyStandard(v)) return;
    } else {
      if (ignoreReverseRef.current) {
        ignoreReverseRef.current = false;
        return;
      }
      const hasAmount = v.amountTo.trim() !== '';
      if (!hasAmount) return;
      if (!hasFromAsset(v)) {
        const fromAsset = makeAssetInfo('from', v);
        const toAsset = makeAssetInfo('to', v);
        if (!fromAsset || !toAsset) return;
      }
      if (!isReadyReverse(v)) return;
    }

    if (isCrossRelay) return;

    const transformed = buildTransformedStandard(v);
    if (!transformed) return;

    const key = JSON.stringify({
      mode,
      from: v.from,
      to: v.to,
      amountFrom: v.amountFrom.trim(),
      amountTo: v.amountTo.trim(),
      exchange: v.exchange,
      useApi: v.useApi,
      currencyFrom: {
        optionId: v.currencyFrom.optionId,
        isCustom: v.currencyFrom.isCustom,
        customType: v.currencyFrom.customType,
        customValue: v.currencyFrom.customValue,
        customSymbolSpecifier: v.currencyFrom.customSymbolSpecifier,
      },
      currencyTo: {
        optionId: v.currencyTo.optionId,
        isCustom: v.currencyTo.isCustom,
        customType: v.currencyTo.customType,
        customValue: v.currencyTo.customValue,
        customSymbolSpecifier: v.currencyTo.customSymbolSpecifier,
      },
    });

    if (key === lastQuoteKeyRef.current) return;

    if (quoteDebounceRef.current) {
      window.clearTimeout(quoteDebounceRef.current);
      quoteDebounceRef.current = null;
    }

    quoteDebounceRef.current = window.setTimeout(() => {
      void (async () => {
        lastQuoteKeyRef.current = key;
        try {
          if (mode === 'forward') {
            const amount = await onQuoteBestAmountValue(transformed);
            if (lastQuoteKeyRef.current !== key) return;

            if (typeof amount === 'number' && Number.isFinite(amount)) {
              ignoreReverseRef.current = true;
              ignoreForwardRef.current = true;
              setIsAmountToQuoteLocked(false);
              form.setFieldValue('amountTo', amount.toString());
            } else {
              setIsAmountToQuoteLocked(false);
              setIsAmountFromQuoteLocked(false);
            }
          } else {
            const reversedBase: TRouterFormValuesTransformed = {
              ...transformed,
              currencyFrom: transformed.currencyTo,
              currencyTo: transformed.currencyFrom,
              amountFrom: v.amountTo,
            };

            const amount = await onQuoteBestAmountValue(reversedBase);
            if (lastQuoteKeyRef.current !== key) return;

            if (typeof amount === 'number' && Number.isFinite(amount)) {
              ignoreForwardRef.current = true;
              ignoreReverseRef.current = true;
              setIsAmountFromQuoteLocked(false);
              form.setFieldValue('amountFrom', amount.toString());
            } else {
              setIsAmountToQuoteLocked(false);
              setIsAmountFromQuoteLocked(false);
            }
          }
        } catch (_error) {
          setIsAmountToQuoteLocked(false);
          setIsAmountFromQuoteLocked(false);
        } finally {
          quoteDebounceRef.current = null;
        }
      })();
    }, 150);

    return () => {
      if (quoteDebounceRef.current) {
        window.clearTimeout(quoteDebounceRef.current);
        quoteDebounceRef.current = null;
      }
    };
  }, [
    form.values.from,
    form.values.to,
    form.values.amountFrom,
    form.values.amountTo,
    form.values.currencyFrom.optionId,
    form.values.currencyFrom.isCustom,
    form.values.currencyFrom.customType,
    form.values.currencyFrom.customValue,
    form.values.currencyFrom.customSymbolSpecifier,
    form.values.currencyTo.optionId,
    form.values.currencyTo.isCustom,
    form.values.currencyTo.customType,
    form.values.currencyTo.customValue,
    form.values.currencyTo.customSymbolSpecifier,
    form.values.exchange,
    form.values.useApi,
    isCrossRelay,
  ]);

  const wasCrossRelayRef = useRef(isCrossRelay);

  useEffect(() => {
    const wasCrossRelay = wasCrossRelayRef.current;
    if (isCrossRelay && !wasCrossRelay) {
      form.setFieldValue('amountTo', '');
    }
    wasCrossRelayRef.current = isCrossRelay;
  }, [isCrossRelay, form]);

  useEffect(() => {
    if (!currencyFromOptionId) return;

    const fromAsset = currencyFromMap[currencyFromOptionId];
    const toAsset =
      currencyToOptionId && currencyToMap[currencyToOptionId]
        ? currencyToMap[currencyToOptionId]
        : undefined;

    const fromKey = pairKey(fromAsset);
    const toKey = pairKey(toAsset);

    if (fromKey && toAsset && toKey && !adjacency.get(fromKey)?.has(toKey)) {
      form.setFieldValue('currencyTo.optionId', '');
      return;
    }

    if (!toAsset && currencyToOptionId) {
      const neighborKeys = fromKey
        ? Array.from(adjacency.get(fromKey) ?? [])
        : [];
      const candidateMatches = currencyToOptions.some(({ value }) => {
        const asset = currencyToMap[value];
        if (!asset) return false;
        const assetKey = pairKey(asset);
        if (!assetKey) return false;
        if (neighborKeys.length === 0) return true;
        return neighborKeys.includes(assetKey);
      });

      if (!candidateMatches) {
        form.setFieldValue('currencyTo.optionId', '');
      }
    }
  }, [
    currencyFromOptionId,
    currencyToOptionId,
    currencyFromMap,
    currencyToMap,
    currencyToOptions,
    adjacency,
    form,
  ]);

  useEffect(() => {
    if (currencyFromOptionId && !currencyFromMap[currencyFromOptionId]) {
      form.setFieldValue('currencyFrom.optionId', '');
      form.setFieldValue('currencyTo.optionId', '');
    }
    if (currencyToOptionId && !currencyToMap[currencyToOptionId]) {
      form.setFieldValue('currencyTo.optionId', '');
    }
  }, [
    currencyFromMap,
    currencyToMap,
    currencyFromOptionId,
    currencyToOptionId,
    form,
  ]);

  const onSubmitInternal = (
    values: TRouterFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TRouterSubmitType = 'default',
  ) => {
    const currencyFrom = makeAssetInfo('from', values);
    const currencyTo = makeAssetInfo('to', values);

    if (!currencyFrom || !currencyTo) {
      return;
    }

    const transformedValues: TRouterFormValuesTransformed = {
      ...values,
      exchange: getExchange(values.exchange) as TExchangeChain,
      currencyFrom,
      currencyTo,
    };

    onSubmit(transformedValues, submitType);
  };

  const isAmountToReadOnly = form.values.to === 'Ethereum' || isCrossRelay;

  const infoEvmWallet = (
    <Tooltip
      label="You need to connect your Polkadot EVM wallet when choosing EVM chain as origin"
      position="top-end"
      withArrow
      transitionProps={{ transition: 'pop-bottom-right' }}
    >
      <Text component="div" style={{ cursor: 'help' }}>
        <Center>
          <IconInfoCircle
            style={{ width: rem(18), height: rem(18) }}
            stroke={1.5}
          />
        </Center>
      </Text>
    </Tooltip>
  );

  useEffect(() => {
    form.validateField('exchange');
  }, [form.values.from]);

  useEffect(() => {
    if (isFromNotParaToPara) {
      form.setFieldValue(
        'currencyFrom.optionId',
        Object.keys(currencyFromMap)[0],
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue('currencyTo.optionId', Object.keys(currencyToMap)[0]);
    }
  }, [isToNotParaToPara, currencyToMap]);

  useEffect(() => {
    setIsAmountFromQuoteLocked(false);
    setIsAmountToQuoteLocked(false);
  }, [
    form.values.currencyFrom.optionId,
    form.values.currencyTo.optionId,
    form.values.currencyFrom.isCustom,
    form.values.currencyFrom.customType,
    form.values.currencyFrom.customValue,
    form.values.currencyFrom.customSymbolSpecifier,
    form.values.currencyTo.isCustom,
    form.values.currencyTo.customType,
    form.values.currencyTo.customValue,
    form.values.currencyTo.customSymbolSpecifier,
    form.values.from,
    form.values.to,
    form.values.exchange,
  ]);

  const {
    connectWallet,
    selectedAccount: selectedAccountPolkadot,
    isInitialized,
    isLoadingExtensions,
  } = useWallet();

  const onSubmitInternalBestAmount = () => {
    const results = [
      form.validateField('from'),
      form.validateField('exchange'),
      form.validateField('to'),
      form.validateField('currencyFrom.optionId'),
      form.validateField('currencyFrom.customValue'),
      form.validateField('currencyTo.optionId'),
      form.validateField('currencyTo.customValue'),
      form.validateField('amountFrom'),
    ];
    const isValid = results.every((result) => !result.hasError);
    if (isValid) {
      onSubmitInternal(form.getValues(), undefined, 'getBestAmountOut');
    }
  };

  const onSubmitGetXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getXcmFee');
    }
  };

  const onSubmitGetTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getTransferableAmount');
    }
  };

  const onSubmitGetMinTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getMinTransferableAmount');
    }
  };

  const onSubmitDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'dryRun');
    }
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <WalletSelectModal
            isOpen={walletSelectModalOpened}
            onClose={closeWalletSelectModal}
            providers={extensions}
            onProviderSelect={onProviderSelect}
          />

          <AccountSelectModal
            isOpen={accountsModalOpened}
            onClose={closeAccountsModal}
            accounts={accounts}
            onAccountSelect={onAccountSelect}
            title="Select EVM account"
            onDisconnect={onAccountDisconnect}
          />

          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the chain you're sending from"
            data={SUBSTRATE_CHAINS}
            allowDeselect={true}
            required={false}
            clearable
            data-testid="select-from"
            {...form.getInputProps('from')}
          />

          <MultiSelect
            label="Exchange"
            placeholder={exchange?.length ? 'Pick value' : 'Auto select'}
            data={EXCHANGE_CHAINS}
            searchable
            clearable
            required
            withAsterisk={false}
            data-testid="select-exchange"
            description="Select the chain where the asset swap will take place"
            {...form.getInputProps('exchange')}
          />

          <ParachainSelect
            label="Destination"
            placeholder="Pick value"
            data={CHAINS}
            data-testid="select-to"
            description="Select the chain that will receive the swapped assets"
            allowDeselect={true}
            required={false}
            clearable
            {...form.getInputProps('to')}
          />

          <Fieldset legend="Currency" radius="md">
            <SimpleGrid spacing="md">
              <RouterCurrencyPicker
                form={form}
                side="from"
                currencyOptions={currencyFromOptions}
              />

              <TextInput
                label="Amount From"
                placeholder="0"
                type="text"
                inputMode="decimal"
                required
                rightSection={<CurrencyInfo />}
                data-testid={'input-amount-from'}
                readOnly={isAmountFromQuoteLocked}
                {...form.getInputProps('amountFrom')}
                onChange={(e) => {
                  driverRef.current = 'from';
                  setIsAmountToQuoteLocked(false);
                  setIsAmountFromQuoteLocked(false);
                  lastQuoteKeyRef.current = null;
                  ignoreForwardRef.current = false;
                  ignoreReverseRef.current = false;
                  const normalized = normalizeAmountInput(
                    e.currentTarget.value,
                  );
                  if (normalized !== null) {
                    form.setFieldValue('amountFrom', normalized);
                  }
                }}
                onFocus={() => {
                  setIsAmountFromQuoteLocked(false);
                }}
                onBlur={() => {
                  driverRef.current = null;
                }}
              />

              <RouterCurrencyPicker
                form={form}
                side="to"
                currencyOptions={currencyToOptions}
              />

              <TextInput
                label="Amount To"
                placeholder="0"
                type="text"
                inputMode="decimal"
                rightSection={<EstimatedAmountInfo />}
                data-testid={'input-amount-to'}
                disabled={isAmountToReadOnly || isAmountToQuoteLocked}
                {...form.getInputProps('amountTo')}
                onChange={(e) => {
                  if (isAmountToReadOnly) return;
                  driverRef.current = 'to';
                  setIsAmountFromQuoteLocked(false);
                  setIsAmountToQuoteLocked(false);
                  lastQuoteKeyRef.current = null;
                  ignoreForwardRef.current = false;
                  ignoreReverseRef.current = false;
                  const normalized = normalizeAmountInput(
                    e.currentTarget.value,
                  );
                  if (normalized !== null) {
                    form.setFieldValue('amountTo', normalized);
                  }
                }}
                onBlur={() => {
                  if (isAmountToReadOnly) return;
                  driverRef.current = null;
                }}
              />
            </SimpleGrid>
          </Fieldset>

          <TextInput
            label="Slippage percentage (%)"
            placeholder="1"
            required
            data-testid="input-slippage-pct"
            {...form.getInputProps('slippagePct')}
          />

          <Group justify="space-between">
            <XcmApiCheckbox
              {...form.getInputProps('useApi', { type: 'checkbox' })}
            />

            <Button.Group orientation="vertical">
              <Button
                size="xs"
                variant="outline"
                onClick={onConnectEvmWallet}
                rightSection={infoEvmWallet}
                data-testid="connect-evm-wallet"
              >
                {selectedAccount
                  ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
                  : 'Connect EVM wallet'}
              </Button>
            </Button.Group>
          </Group>

          {selectedAccountPolkadot ? (
            <Button.Group>
              <Button
                type="submit"
                loading={loading}
                flex={1}
                data-testid="submit"
              >
                Submit transaction
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
                    leftSection={<Icon123 size={16} />}
                    onClick={onSubmitInternalBestAmount}
                  >
                    Get best amount out
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconCoinFilled size={16} />}
                    onClick={onSubmitGetXcmFee}
                  >
                    Get XCM fees
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconArrowBarDown size={16} />}
                    onClick={onSubmitGetMinTransferableAmount}
                  >
                    Get min transferable amount
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconArrowBarUp size={16} />}
                    onClick={onSubmitGetTransferableAmount}
                  >
                    Get transferable amount
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconLocationCheck size={16} />}
                    onClick={onSubmitDryRun}
                  >
                    Dry run
                  </Menu.Item>
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
