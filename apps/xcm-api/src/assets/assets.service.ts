import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CHAINS,
  findAssetInfo,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetLocation,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getSupportedDestinations,
  hasSupportForAsset,
  TChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetLocationDto } from './dto/AssetLocationDto.js';
import { FindAssetDto } from './dto/FindAssetDto.js';
import { SupportedDestinationsDto } from './dto/SupportedDestinationsDto.js';

@Injectable()
export class AssetsService {
  getAssetsObject(chain: string) {
    validateChain(chain, CHAINS);
    return getAssetsObject(chain as TChain);
  }

  getAssetId(chain: string, symbol: string) {
    validateChain(chain, CHAINS);
    const id = getAssetId(chain as TChain, symbol);
    if (!id) {
      throw new NotFoundException(`Asset id for symbol ${symbol} not found.`);
    }
    return id;
  }

  getAssetLocation(chain: string, { currency }: AssetLocationDto) {
    validateChain(chain, CHAINS);
    return JSON.stringify(getAssetLocation(chain as TChain, currency));
  }

  getAssetInfo(chain: string, { currency, destination }: FindAssetDto) {
    validateChain(chain, CHAINS);
    if (destination) validateChain(destination, CHAINS);
    return JSON.stringify(
      findAssetInfo(chain as TChain, currency, destination as TChain),
    );
  }

  getRelayChainSymbol(chain: string) {
    validateChain(chain, CHAINS);
    return JSON.stringify(getRelayChainSymbol(chain as TChain));
  }

  getNativeAssets(chain: string) {
    validateChain(chain, CHAINS);
    return getNativeAssets(chain as TChain);
  }

  getOtherAssets(chain: string) {
    validateChain(chain, CHAINS);
    return getOtherAssets(chain as TChain);
  }

  getAllAssetsSymbols(chain: string) {
    validateChain(chain, CHAINS);
    return getAllAssetsSymbols(chain as TChain);
  }

  getDecimals(chain: string, symbol: string) {
    validateChain(chain, CHAINS);
    const decimals = getAssetDecimals(chain as TChain, symbol);
    if (decimals === null) {
      throw new NotFoundException(`Decimals for currency ${symbol} not found.`);
    }
    return decimals;
  }

  getFeeAssets(chain: string) {
    validateChain(chain, CHAINS);
    return getFeeAssets(chain as TChain);
  }

  hasSupportForAsset(chain: string, symbol: string) {
    validateChain(chain, CHAINS);
    return hasSupportForAsset(chain as TChain, symbol);
  }

  getSupportedAssets(originChain: string, destChain: string) {
    validateChain(originChain, CHAINS);
    validateChain(destChain, CHAINS);
    return getSupportedAssets(originChain as TChain, destChain as TChain);
  }

  getSupportedDestinations(chain: string, params: SupportedDestinationsDto) {
    const { currency } = params;
    validateChain(chain, CHAINS);

    try {
      return getSupportedDestinations(chain as TChain, currency);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
