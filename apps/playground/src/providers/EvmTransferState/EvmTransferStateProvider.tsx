import type { TChain, TEvmChainFrom } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  decodeAmount,
  decodeBoolean,
  decodeChain,
  decodeEvmChain,
  decodeRecipientAddress,
  decodeString,
} from '../../utils/routes/urlFilters';
import { EvmTransferStateContext } from './EvmTransferStateContext';

interface EvmTrasferStateProviderProps {
  children: ReactNode;
}

const EvmTrasferStateProvider = ({
  children,
}: EvmTrasferStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState<TEvmChainFrom>(
    decodeEvmChain(searchParams.get('from')),
  );

  const [to, setTo] = useState<TChain>(
    decodeChain(searchParams.get('to') ?? 'AssetHubPolkadot'),
  );

  const [currencyOptionId, setCurrencyOptionId] = useState<string>(
    decodeString(searchParams.get('currencyOptionId')),
  );

  const [address, setAddress] = useState<string>(
    decodeRecipientAddress(searchParams.get('address')),
  );

  const [ahAddress, setAhAddress] = useState<string>(
    decodeString(searchParams.get('ahAddress')),
  );

  const [amount, setAmount] = useState<string>(
    decodeAmount(searchParams.get('amount')),
  );

  const [useViem, setUseViem] = useState<boolean>(
    decodeBoolean(searchParams.get('useViem')),
  );

  return (
    <EvmTransferStateContext.Provider
      value={{
        from,
        setFrom,
        to,
        setTo,
        currencyOptionId,
        setCurrencyOptionId,
        address,
        setAddress,
        ahAddress,
        setAhAddress,
        amount,
        setAmount,
        useViem,
        setUseViem,
      }}
    >
      {children}
    </EvmTransferStateContext.Provider>
  );
};

export default EvmTrasferStateProvider;
