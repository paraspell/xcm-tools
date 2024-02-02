import { Injectable } from '@nestjs/common';
import { TNode, getDefaultPallet, getSupportedPallets } from '@paraspell/sdk';
import { validateNode } from '../utils.js';

@Injectable()
export class PalletsService {
  getDefaultPallet(node: string) {
    validateNode(node);
    return JSON.stringify(getDefaultPallet(node as TNode));
  }

  getPallets(node: string) {
    validateNode(node);
    return getSupportedPallets(node as TNode);
  }
}
