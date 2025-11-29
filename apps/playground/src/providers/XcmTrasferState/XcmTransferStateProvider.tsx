import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import { type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { TCurrencyEntry } from '../../components/XcmUtils/XcmUtilsForm';
import {
  decodeBoolean,
  decodeChain,
  decodeCurrencyList,
  decodeFeeAsset,
  decodeRecipientAddress,
  decodeString,
  decodeSubstrateChain,
} from '../../utils/routes/urlFilters';
import { XcmTransferStateContext } from './XcmTrasferStateContext';

interface XcmTransferStateProviderProps {
  children: ReactNode;
}

const XcmTransferStateProvider = ({
  children,
}: XcmTransferStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState<TSubstrateChain>(
    decodeSubstrateChain(searchParams.get('from')),
  );

  const [to, setTo] = useState<TChain>(decodeChain(searchParams.get('to')));

  const [currencies, setCurrencies] = useState<TCurrencyEntry[]>(
    decodeCurrencyList(searchParams.get('currencies')),
  );

  const [feeAsset, setFeeAsset] = useState<
    Omit<TCurrencyEntry, 'amount' | 'isMax'>
  >(decodeFeeAsset(searchParams.get('feeAsset')));

  const [address, setAddress] = useState<string>(
    decodeRecipientAddress(searchParams.get('address')),
  );

  const [ahAddress, setAhAddress] = useState<string>(
    decodeString(searchParams.get('ahAddress')),
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  const [useXcmFormatCheck, setUseXcmFormatCheck] = useState<boolean>(
    decodeBoolean(searchParams.get('useXcmFormatCheck')),
  );

  return (
    <XcmTransferStateContext.Provider
      value={{
        from,
        setFrom,
        to,
        setTo,
        currencies,
        setCurrencies,
        feeAsset,
        setFeeAsset,
        address,
        setAddress,
        ahAddress,
        setAhAddress,
        useApi,
        setUseApi,
        useXcmFormatCheck,
        setUseXcmFormatCheck,
      }}
    >
      {children}
    </XcmTransferStateContext.Provider>
  );
};

export default XcmTransferStateProvider;
