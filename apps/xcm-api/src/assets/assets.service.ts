import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NODE_NAMES,
  TNode,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetsObject,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  getTNode,
  hasSupportForAsset,
} from '@paraspell/sdk';
import { validateNode } from '../utils.js';

@Injectable()
export class AssetsService {
  getNodeNames() {
    return NODE_NAMES;
  }

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

  getParaId(node: string) {
    validateNode(node);
    return getParaId(node as TNode);
  }

  getNodeByParaId(paraId: number, ecosystem: string | undefined) {
    if (ecosystem !== 'polkadot' && ecosystem !== 'kusama') {
      throw new BadRequestException(
        "Invalid ecosystem provided. Available options are 'polkadot' and 'kusama'.",
      );
    }
    const node = getTNode(paraId, ecosystem);
    if (!node) {
      throw new NotFoundException(
        `Node with parachain id ${paraId} not found.`,
      );
    }
    return JSON.stringify(node);
  }
}
