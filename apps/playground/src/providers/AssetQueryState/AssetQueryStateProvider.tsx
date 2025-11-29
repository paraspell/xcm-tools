import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type {
  TCurrencyType,
  TCustomCurrencySymbolSpecifier,
} from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TAssetsQuery } from '../../types';
import {
  decodeAssetQuery,
  decodeBoolean,
  decodeCurrencySymbolSpecifier,
  decodeCurrencyType,
  decodeRecipientAddress,
  decodeString,
  decodeSubstrateChain,
} from '../../utils/routes/urlFilters';
import { AssetQueryStateContext } from './AssetQueryStateContext';

interface AssetQueryStateProviderProps {
  children: ReactNode;
}

const AssetQueryStateProvider = ({
  children,
}: AssetQueryStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [func, setFunc] = useState<TAssetsQuery>(
    decodeAssetQuery(searchParams.get('func')),
  );

  const [chain, setChain] = useState<TSubstrateChain>(
    decodeSubstrateChain(searchParams.get('chain') ?? 'Acala'),
  );

  const [destination, setDestination] = useState<TChain>(
    decodeSubstrateChain(searchParams.get('destination') ?? 'Astar'),
  );

  const [currency, setCurrency] = useState<string>(
    decodeString(searchParams.get('currency')),
  );

  const [amount, setAmount] = useState<string>(
    decodeString(searchParams.get('amount')),
  );

  const [address, setAddress] = useState<string>(
    decodeRecipientAddress(searchParams.get('address')),
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  const [currencyType, setCurrencyType] = useState<TCurrencyType>(
    decodeCurrencyType(searchParams.get('currencyType')),
  );

  const [customCurrencySymbolSpecifier, setCustomCurrencySymbolSpecifier] =
    useState<TCustomCurrencySymbolSpecifier | undefined>(
      decodeCurrencySymbolSpecifier(
        searchParams.get('customCurrencySymbolSpecifier'),
      ),
    );

  return (
    <AssetQueryStateContext.Provider
      value={{
        func,
        setFunc,
        chain,
        setChain,
        destination,
        setDestination,
        currency,
        setCurrency,
        amount,
        setAmount,
        address,
        setAddress,
        useApi,
        setUseApi,
        currencyType,
        setCurrencyType,
        customCurrencySymbolSpecifier,
        setCustomCurrencySymbolSpecifier,
      }}
    >
      {children}
    </AssetQueryStateContext.Provider>
  );
};

export default AssetQueryStateProvider;
