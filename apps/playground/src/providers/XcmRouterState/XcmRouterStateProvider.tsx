import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import type { TExchangeChain } from '@paraspell/xcm-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  decodeAmount,
  decodeBoolean,
  decodeChain,
  decodeExchanges,
  decodePercentage,
  decodeRecipientAddress,
  decodeString,
  decodeSubstrateChain,
} from '../../utils/routes/urlFilters';
import { XcmRouterStateContext } from './XcmRouterStateContext';

interface XcmRouterStateProviderProps {
  children: ReactNode;
}

const XcmRouterStateProvider = ({ children }: XcmRouterStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState<TSubstrateChain>(
    decodeSubstrateChain(searchParams.get('from')),
  );

  const [exchange, setExchange] = useState<TExchangeChain[] | undefined>(
    decodeExchanges(searchParams.get('exchange')),
  );

  const [to, setTo] = useState<TChain>(
    decodeChain(searchParams.get('to') ?? 'Hydration'),
  );

  const [currencyFromOptionId, setCurrencyFromOptionId] = useState<string>(
    decodeString(searchParams.get('currencyFromOptionId')),
  );

  const [currencyToOptionId, setCurrencyToOptionId] = useState<string>(
    decodeString(searchParams.get('currencyToOptionId')),
  );

  const [amount, setAmount] = useState<string>(
    decodeAmount(searchParams.get('amount')),
  );

  const [recipientAddress, setRecipientAddress] = useState<string>(
    decodeRecipientAddress(searchParams.get('recipientAddress')),
  );

  const [slippagePct, setSlippagePct] = useState<string>(
    decodePercentage(searchParams.get('slippagePct')),
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  return (
    <XcmRouterStateContext.Provider
      value={{
        from,
        setFrom,
        exchange,
        setExchange,
        to,
        setTo,
        currencyFromOptionId,
        setCurrencyFromOptionId,
        currencyToOptionId,
        setCurrencyToOptionId,
        amount,
        setAmount,
        recipientAddress,
        setRecipientAddress,
        slippagePct,
        setSlippagePct,
        useApi,
        setUseApi,
      }}
    >
      {children}
    </XcmRouterStateContext.Provider>
  );
};

export default XcmRouterStateProvider;
