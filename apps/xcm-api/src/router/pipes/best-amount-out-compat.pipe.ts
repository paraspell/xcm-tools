import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

// Backwards-compat for the legacy (v5-style) request body shape used by older clients.
// It normalizes the legacy shape into the current RouterBestAmountOutSchema shape,
// so the ZodValidationPipe can do strict validation and return clean 400s.
@Injectable()
export class BestAmountOutCompatPipe implements PipeTransform {
  transform(value: unknown) {
    if (!value || typeof value !== 'object') return value;

    const v = value as Record<string, unknown>;

    const isLegacyShape =
      'fromChain' in v || 'toChain' in v || 'fromAsset' in v || 'toAsset' in v;
    const alreadyNewShape = 'currencyFrom' in v || 'currencyTo' in v;

    if (!isLegacyShape || alreadyNewShape) return value;

    const fromChainRaw = v.fromChain;
    const toChainRaw = v.toChain;
    const fromAsset = v.fromAsset;
    const toAsset = v.toAsset;
    const amount = v.amount;
    const exchange = v.exchange;
    const options = v.options;

    const from =
      typeof fromChainRaw === 'string' ? normalizeChainAlias(fromChainRaw) : undefined;
    const to =
      typeof toChainRaw === 'string' ? normalizeChainAlias(toChainRaw) : undefined;

    return {
      ...v,
      from,
      to,
      exchange,
      currencyFrom: legacyAssetToCurrencyCore(fromAsset, 'fromAsset'),
      currencyTo: legacyAssetToCurrencyCore(toAsset, 'toAsset'),
      amount,
      options,
    };
  }
}

const normalizeChainAlias = (chain: string) => {
  // Keep this conservative: only map well-known historical aliases to current SDK chain names.
  // Source of truth for the canonical names: @paraspell/sdk-common PARACHAINS list.
  const key = chain.trim().toLowerCase();
  switch (key) {
    case 'statemint':
      return 'AssetHubPolkadot';
    case 'statemine':
      return 'AssetHubKusama';
    case 'westmint':
      return 'AssetHubWestend';
    case 'paseomint':
      return 'AssetHubPaseo';
    default:
      return chain;
  }
};

const legacyAssetToCurrencyCore = (asset: unknown, fieldName: string) => {
  if (typeof asset === 'string') {
    const symbol = asset.trim();
    if (symbol) return { symbol };
  }

  if (!asset || typeof asset !== 'object') {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  const a = asset as Record<string, unknown>;
  if ('symbol' in a) return { symbol: a.symbol };
  if ('id' in a) return { id: a.id };
  if ('location' in a) return { location: a.location };

  throw new BadRequestException(
    `${fieldName} must be a symbol string, or an object with symbol/id/location.`,
  );
};
