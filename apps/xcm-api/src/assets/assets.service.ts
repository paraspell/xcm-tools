import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TNode,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetMultiLocation,
  getAssetsObject,
  getNativeAssets,
  getOriginFeeDetails,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  hasSupportForAsset,
} from '@paraspell/sdk';
import { validateNode } from '../utils.js';
import { OriginFeeDetailsDto } from './dto/OriginFeeDetailsDto.js';
import { AssetMultiLocationDto } from './dto/AssetMultiLocationDto.js';

@Injectable()
export class AssetsService {
  getAssetsObject(node: string) {
    validateNode(node);
    return getAssetsObject(node as TNode);
  }

  getAssetId(node: string, symbol: string) {
    validateNode(node);
    const id = getAssetId(node as TNode, symbol);
    if (!id) {
      throw new NotFoundException(`Asset id for symbol ${symbol} not found.`);
    }
    return id;
  }

  getAssetMultiLocation(node: string, { currency }: AssetMultiLocationDto) {
    validateNode(node, { withRelayChains: true });
    return JSON.stringify(
      getAssetMultiLocation(node as TNodeWithRelayChains, currency),
    );
  }

  getRelayChainSymbol(node: string) {
    validateNode(node);
    return JSON.stringify(getRelayChainSymbol(node as TNode));
  }

  getNativeAssets(node: string) {
    validateNode(node);
    return getNativeAssets(node as TNode);
  }

  getOtherAssets(node: string) {
    validateNode(node);
    return getOtherAssets(node as TNode);
  }

  getAllAssetsSymbols(node: string) {
    validateNode(node);
    return getAllAssetsSymbols(node as TNode);
  }

  getDecimals(node: string, symbol: string) {
    validateNode(node);
    const decimals = getAssetDecimals(node as TNode, symbol);
    if (decimals === null) {
      throw new NotFoundException(`Decimals for currency ${symbol} not found.`);
    }
    return decimals;
  }

  hasSupportForAsset(node: string, symbol: string) {
    validateNode(node);
    return hasSupportForAsset(node as TNode, symbol);
  }

  getSupportedAssets(nodeOrigin: string, nodeDestination: string) {
    validateNode(nodeOrigin, { withRelayChains: true });
    validateNode(nodeDestination, { withRelayChains: true });
    return getSupportedAssets(nodeOrigin as TNode, nodeDestination as TNode);
  }

  getOriginFeeDetails(params: OriginFeeDetailsDto) {
    const { origin, destination } = params;
    validateNode(origin, { withRelayChains: true, excludeEthereum: true });
    validateNode(destination, { withRelayChains: true, excludeEthereum: true });

    return getOriginFeeDetails({
      ...params,
      origin: origin as TNodeDotKsmWithRelayChains,
      destination: destination as TNodeDotKsmWithRelayChains,
    });
  }
}
