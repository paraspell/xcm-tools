import { Skeleton, Text } from '@mantine/core';
import { useShallowEffect } from '@mantine/hooks';
import type { TApiType, TChain, TCurrencyCore } from '@paraspell/sdk';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { BALANCE_FETCH_DEBOUNCE_MS } from '../../constants';
import { formatBalance } from '../../utils/formatBalance';
import { importSdk } from '../../utils/importSdk';

type Props = {
  chain: TChain;
  address: string;
  currency: TCurrencyCore;
  decimals: number;
  symbol: string;
  apiType: TApiType;
};

type GetBalanceFn = Awaited<ReturnType<typeof importSdk>>['getBalance'];

export const CurrencyBalance: FC<Props> = ({
  chain,
  address,
  currency,
  decimals,
  symbol,
  apiType,
}) => {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [getBalance, setGetBalance] = useState<GetBalanceFn | null>(null);

  useEffect(() => {
    let cancelled = false;
    void importSdk(apiType).then((sdk) => {
      if (!cancelled) setGetBalance(() => sdk.getBalance);
    });
    return () => {
      cancelled = true;
    };
  }, [apiType]);

  useShallowEffect(() => {
    if (!getBalance) return;

    let cancelled = false;
    setBalance(null);
    setLoading(true);

    const handle = window.setTimeout(() => {
      const run = async () => {
        try {
          const result = await getBalance({ address, chain, currency });
          if (!cancelled) setBalance(result);
        } catch {
          if (!cancelled) setBalance(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      void run();
    }, BALANCE_FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [getBalance, address, chain, currency]);

  if (!loading && balance === null) {
    return null;
  }

  return (
    <Skeleton visible={loading} width="fit-content" radius="sm">
      <Text size="xs" c="dimmed" data-testid="currency-balance">
        Balance: {balance === null ? '' : formatBalance(balance, decimals)}{' '}
        {symbol}
      </Text>
    </Skeleton>
  );
};
