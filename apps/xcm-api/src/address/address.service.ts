import { Injectable } from '@nestjs/common';
import { convertSs58, TSubstrateChain } from '@paraspell/sdk';

import { handleXcmApiError } from '../utils/error-handler.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, chain: TSubstrateChain) {
    try {
      return convertSs58(address, chain);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
