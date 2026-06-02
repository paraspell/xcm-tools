import { useLocalStorage } from '@mantine/hooks';
import type {
  TChain,
  TCustomAssetInfo,
  TCustomAssetsMap,
} from '@paraspell/sdk';
import { useCallback } from 'react';

const STORAGE_KEY = 'paraspell_playground_custom_assets';

export const useCustomAssets = () => {
  const [customAssets, setCustomAssets] = useLocalStorage<TCustomAssetsMap>({
    key: STORAGE_KEY,
    defaultValue: {},
  });

  const addCustomAsset = useCallback(
    (chain: TChain, asset: TCustomAssetInfo) => {
      setCustomAssets((current) => ({
        ...current,
        [chain]: [...(current[chain] ?? []), asset],
      }));
    },
    [setCustomAssets],
  );

  const updateCustomAsset = useCallback(
    (chain: TChain, index: number, asset: TCustomAssetInfo) => {
      setCustomAssets((current) => {
        const list = current[chain] ?? [];
        const next = list.map((existing, i) =>
          i === index ? asset : existing,
        );
        return { ...current, [chain]: next };
      });
    },
    [setCustomAssets],
  );

  const removeCustomAsset = useCallback(
    (chain: TChain, index: number) => {
      setCustomAssets((current) => {
        const list = current[chain] ?? [];
        const next = list.filter((_, i) => i !== index);
        const updated = { ...current };
        if (next.length === 0) {
          delete updated[chain];
        } else {
          updated[chain] = next;
        }
        return updated;
      });
    },
    [setCustomAssets],
  );

  const setAllCustomAssets = useCallback(
    (next: TCustomAssetsMap) => {
      setCustomAssets(next);
    },
    [setCustomAssets],
  );

  return {
    customAssets,
    addCustomAsset,
    updateCustomAsset,
    removeCustomAsset,
    setAllCustomAssets,
  };
};
