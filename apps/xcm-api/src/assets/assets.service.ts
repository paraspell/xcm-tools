import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CHAINS,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetLocation,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOriginFeeDetails,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getSupportedDestinations,
  hasSupportForAsset,
  SUBSTRATE_CHAINS,
  TChain,
  TSubstrateChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetLocationDto } from './dto/AssetLocationDto.js';
import { OriginFeeDetailsDto } from './dto/OriginFeeDetailsDto.js';
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

  async getOriginFeeDetails(params: OriginFeeDetailsDto) {
    const { origin, destination } = params;
    validateChain(origin, SUBSTRATE_CHAINS);
    validateChain(destination, CHAINS);

    try {
      return await getOriginFeeDetails({
        ...params,
        origin: origin as TSubstrateChain,
        destination: destination as TChain,
      });
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
