import { createChainClient, type TSubstrateChain } from '@paraspell/sdk';
import { useEffect, useState } from 'react';

export type ChainSpecData = {
  name: string;
  genesisHash: string;
  properties: unknown;
};

export const useLedgerChainSpec = (
  sourceChain?: TSubstrateChain,
): ChainSpecData | undefined => {
  const [spec, setSpec] = useState<ChainSpecData | undefined>(undefined);

  useEffect(() => {
    if (!sourceChain) {
      setSpec(undefined);
      return;
    }

    let cancelled = false;
    let client: Awaited<ReturnType<typeof createChainClient>> | null = null;

    const load = async () => {
      try {
        client = await createChainClient(sourceChain, undefined);
        if (cancelled || !client) return;
        const data = await client.getChainSpecData();
        if (cancelled) return;
        setSpec(data as ChainSpecData);
      } catch {
        if (!cancelled) setSpec(undefined);
      } finally {
        if (client && typeof client.destroy === 'function') {
          void client.destroy();
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [sourceChain]);

  return spec;
};
