import type { TCustomAssetsMap } from '@paraspell/sdk';

import type { TStoredCustomChains } from '../types/TCustomChain';

const CONFIG_VERSION = 1;

export type TCustomConfigFile = {
  version: number;
  customChains: TStoredCustomChains;
  customAssets: TCustomAssetsMap;
};

export const buildCustomConfig = (
  customChains: TStoredCustomChains,
  customAssets: TCustomAssetsMap,
): TCustomConfigFile => ({
  version: CONFIG_VERSION,
  customChains,
  customAssets,
});

export const downloadCustomConfig = (config: TCustomConfigFile) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'paraspell-custom-config.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseCustomConfig = (text: string): TCustomConfigFile => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Config must be a JSON object.');
  }

  const { customChains, customAssets } = parsed;

  if (customChains !== undefined && !isRecord(customChains)) {
    throw new Error('"customChains" must be an object.');
  }

  if (customAssets !== undefined && !isRecord(customAssets)) {
    throw new Error('"customAssets" must be an object.');
  }

  if (customChains === undefined && customAssets === undefined) {
    throw new Error(
      'Config must contain "customChains" and/or "customAssets".',
    );
  }

  return {
    version:
      typeof parsed.version === 'number' ? parsed.version : CONFIG_VERSION,
    customChains: (customChains ?? {}) as TStoredCustomChains,
    customAssets: customAssets ?? {},
  };
};
