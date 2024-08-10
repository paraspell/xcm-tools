import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  getOtherAssets,
  getParaId,
  InvalidCurrencyError,
  NODE_NAMES,
  TNode,
} from '@paraspell/sdk';
import { isValidPolkadotAddress } from '../utils.js';
import { XTransferEthDto } from './dto/x-transfer-eth.dto.js';
import { toPolkadot, environment, contextFactory } from '@snowbridge/api';

@Injectable()
export class XTransferEthService {
  async generateEthCall({
    to,
    amount,
    address,
    destAddress,
    currency,
  }: XTransferEthDto) {
    const toNode = to as TNode;

    if (!NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!isValidPolkadotAddress(destAddress)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const ethAssets = getOtherAssets('Ethereum');
    const ethAsset = ethAssets.find((asset) => asset.symbol === currency);
    if (!ethAsset) {
      throw new InvalidCurrencyError(
        `Currency ${currency} is not supported for Ethereum transfers`,
      );
    }

    const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet'];
    const { config } = env;

    const EXECUTION_URL = 'https://eth.llamarpc.com';

    const context = await contextFactory({
      ethereum: {
        execution_url: EXECUTION_URL,
        beacon_url: config.BEACON_HTTP_API,
      },
      polkadot: {
        url: {
          bridgeHub: config.BRIDGE_HUB_URL,
          assetHub: config.ASSET_HUB_URL,
          relaychain: config.RELAY_CHAIN_URL,
          parachains: config.PARACHAINS,
        },
      },
      appContracts: {
        gateway: config.GATEWAY_CONTRACT,
        beefy: config.BEEFY_CONTRACT,
      },
    });
    const destParaId = getParaId(toNode);

    const signer = {
      getAddress: () => Promise.resolve(address),
    };

    try {
      const plan = await toPolkadot.validateSend(
        context,
        signer,
        destAddress,
        ethAsset.assetId,
        destParaId,
        BigInt(amount),
        BigInt(0),
      );

      if (plan.failure) {
        throw new Error(
          `Failed to validate send: ${plan.failure.errors.map((e) => e.message).join('\n\n')}`,
        );
      }

      return {
        token: plan.success.token,
        destinationParaId: plan.success.destinationParaId,
        destinationFee: plan.success.destinationFee,
        amount: plan.success.amount,
      };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new InternalServerErrorException(e.message);
    }
  }
}
