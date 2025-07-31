import { Injectable, NotFoundException } from '@nestjs/common';
import {
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
  TChain,
  TChainDotKsmWithRelayChains,
  TChainWithRelayChains,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetLocationDto } from './dto/AssetLocationDto.js';
import { OriginFeeDetailsDto } from './dto/OriginFeeDetailsDto.js';
import { SupportedDestinationsDto } from './dto/SupportedDestinationsDto.js';

@Injectable()
export class AssetsService {
  getAssetsObject(chain: string) {
    validateChain(chain);
    return getAssetsObject(chain as TChain);
  }

  getAssetId(chain: string, symbol: string) {
    validateChain(chain);
    const id = getAssetId(chain as TChain, symbol);
    if (!id) {
      throw new NotFoundException(`Asset id for symbol ${symbol} not found.`);
    }
    return id;
  }

  getAssetLocation(chain: string, { currency }: AssetLocationDto) {
    validateChain(chain, { withRelayChains: true });
    return JSON.stringify(
      getAssetLocation(chain as TChainWithRelayChains, currency),
    );
  }

  getRelayChainSymbol(chain: string) {
    validateChain(chain);
    return JSON.stringify(getRelayChainSymbol(chain as TChain));
  }

  getNativeAssets(chain: string) {
    validateChain(chain);
    return getNativeAssets(chain as TChain);
  }

  getOtherAssets(chain: string) {
    validateChain(chain);
    return getOtherAssets(chain as TChain);
  }

  getAllAssetsSymbols(chain: string) {
    validateChain(chain);
    return getAllAssetsSymbols(chain as TChain);
  }

  getDecimals(chain: string, symbol: string) {
    validateChain(chain);
    const decimals = getAssetDecimals(chain as TChain, symbol);
    if (decimals === null) {
      throw new NotFoundException(`Decimals for currency ${symbol} not found.`);
    }
    return decimals;
  }

  getFeeAssets(chain: string) {
    validateChain(chain, { excludeEthereum: true, withRelayChains: true });
    return getFeeAssets(chain as TChainDotKsmWithRelayChains);
  }

  hasSupportForAsset(chain: string, symbol: string) {
    validateChain(chain);
    return hasSupportForAsset(chain as TChain, symbol);
  }

  getSupportedAssets(originChain: string, destChain: string) {
    validateChain(originChain, { withRelayChains: true });
    validateChain(destChain, { withRelayChains: true });
    return getSupportedAssets(originChain as TChain, destChain as TChain);
  }

  getSupportedDestinations(chain: string, params: SupportedDestinationsDto) {
    const { currency } = params;
    validateChain(chain, { withRelayChains: true });

    try {
      return getSupportedDestinations(
        chain as TChainDotKsmWithRelayChains,
        currency,
      );
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getOriginFeeDetails(params: OriginFeeDetailsDto) {
    const { origin, destination } = params;
    validateChain(origin, { withRelayChains: true, excludeEthereum: true });
    validateChain(destination, { withRelayChains: true });

    try {
      return await getOriginFeeDetails({
        ...params,
        origin: origin as TChainDotKsmWithRelayChains,
        destination: destination as TChainDotKsmWithRelayChains,
      });
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
