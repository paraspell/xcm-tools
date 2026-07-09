import { Injectable } from '@nestjs/common';
import {
  findAssetInfo,
  findAssetInfoOrThrow,
  getAllAssetsSymbols,
  getAssetLocation,
  getAssetReserveChain,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getSupportedDestinations,
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
    return JSON.stringify(findAssetInfo(chain, currency, destination));
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

  getFeeAssets(chain: TChain) {
    return getFeeAssets(chain);
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
