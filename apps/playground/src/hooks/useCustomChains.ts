import { useLocalStorage } from '@mantine/hooks';
import type {
  TChainAssetsInfo,
  TCustomChainInput,
  TCustomChainsMap,
} from '@paraspell/sdk';
import { useCallback, useMemo } from 'react';

import type { TStoredCustomChains } from '../types/TCustomChain';

const STORAGE_KEY = 'paraspell_playground_custom_chains';

export const useCustomChains = () => {
  const [stored, setStored] = useLocalStorage<TStoredCustomChains>({
    key: STORAGE_KEY,
    defaultValue: {},
  });

  const customChains = useMemo<TCustomChainsMap>(
    () =>
      Object.fromEntries(
        Object.entries(stored).map(([name, entry]) => [name, entry.input]),
      ),
    [stored],
  );

  const customChainAssets = useMemo<Record<string, TChainAssetsInfo>>(
    () =>
      Object.fromEntries(
        Object.entries(stored).map(([name, entry]) => [name, entry.assetsInfo]),
      ),
    [stored],
  );

  const addCustomChain = useCallback(
    (name: string, input: TCustomChainInput, assetsInfo: TChainAssetsInfo) => {
      setStored((current) => ({ ...current, [name]: { input, assetsInfo } }));
    },
    [setStored],
  );

  const removeCustomChain = useCallback(
    (name: string) => {
      setStored((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    },
    [setStored],
  );

  const setAllCustomChains = useCallback(
    (next: TStoredCustomChains) => {
      setStored(next);
    },
    [setStored],
  );

  return {
    storedChains: stored,
    customChains,
    customChainAssets,
    addCustomChain,
    removeCustomChain,
    setAllCustomChains,
  };
};
