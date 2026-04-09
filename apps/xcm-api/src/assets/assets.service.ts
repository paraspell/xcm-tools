import { Injectable, NotFoundException } from '@nestjs/common';
import {
  findAssetInfo,
  findAssetInfoOrThrow,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetLocation,
  getAssetReserveChain,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getSupportedDestinations,
  hasSupportForAsset,
  TChain,
  TSubstrateChain,
} from '@paraspell/sdk';

import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetLocationDto } from './dto/AssetLocationDto.js';
import { FindAssetDto } from './dto/FindAssetDto.js';
import { SupportedDestinationsDto } from './dto/SupportedDestinationsDto.js';

@Injectable()
export class AssetsService {
  getAssetsObject(chain: TChain) {
    return getAssetsObject(chain);
  }

  getAssetId(chain: TChain, symbol: string) {
    const id = getAssetId(chain, symbol);
    if (!id) {
      throw new NotFoundException(`Asset id for symbol ${symbol} not found.`);
    }
    return id;
  }

  getAssetLocation(chain: TChain, { currency }: AssetLocationDto) {
    return JSON.stringify(getAssetLocation(chain, currency));
  }

  getAssetReserveChain(chain: TSubstrateChain, { currency }: AssetLocationDto) {
    try {
      const { location } = findAssetInfoOrThrow(chain, currency);
      return getAssetReserveChain(chain, location);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  getAssetInfo(chain: TChain, { currency, destination }: FindAssetDto) {
    return JSON.stringify(
      findAssetInfo(chain, currency, destination as TChain),
    );
  }

  getRelayChainSymbol(chain: TChain) {
    return JSON.stringify(getRelayChainSymbol(chain));
  }

  getNativeAssets(chain: TChain) {
    return getNativeAssets(chain);
  }

  getOtherAssets(chain: TChain) {
    return getOtherAssets(chain);
  }

  getAllAssetsSymbols(chain: TChain) {
    return getAllAssetsSymbols(chain);
  }

  getDecimals(chain: TChain, symbol: string) {
    const decimals = getAssetDecimals(chain, symbol);
    if (decimals === null) {
      throw new NotFoundException(`Decimals for currency ${symbol} not found.`);
    }
    return decimals;
  }

  getFeeAssets(chain: TChain) {
    return getFeeAssets(chain);
  }

  hasSupportForAsset(chain: TChain, symbol: string) {
    return hasSupportForAsset(chain, symbol);
  }

  getSupportedAssets(originChain: TChain, destChain: TChain) {
    return getSupportedAssets(originChain, destChain);
  }

  getSupportedDestinations(chain: TChain, params: SupportedDestinationsDto) {
    const { currency } = params;

    try {
      return getSupportedDestinations(chain, currency);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
