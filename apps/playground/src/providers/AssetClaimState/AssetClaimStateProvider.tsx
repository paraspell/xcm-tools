import type { TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  decodeAmount,
  decodeAssetClaimChain,
  decodeBoolean,
  decodeRecipientAddress,
} from '../../utils/routes/urlFilters';
import { AssetClaimStateContext } from './AssetClaimStateContext';

interface AssetClaimStateProviderProps {
  children: ReactNode;
}

const AssetClaimStateProvider = ({
  children,
}: AssetClaimStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState<TSubstrateChain>(
    decodeAssetClaimChain(searchParams.get('from')),
  );

  const [address, setAddress] = useState<string>(
    decodeRecipientAddress(searchParams.get('address')),
  );

  const [amount, setAmount] = useState<string>(
    decodeAmount(searchParams.get('amount')),
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  return (
    <AssetClaimStateContext.Provider
      value={{
        from,
        setFrom,
        address,
        setAddress,
        amount,
        setAmount,
        useApi,
        setUseApi,
      }}
    >
      {children}
    </AssetClaimStateContext.Provider>
  );
};

export default AssetClaimStateProvider;
