// Contains detailed structure of XCM call construction for Darwinia Parachain

import type { TNodePolkadotKusama } from '../../types'
import {
  Version,
  type TSerializedApiCallV2,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TScenario,
  Parents,
  type TSelfReserveAsset,
  type TForeignAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import { NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../xTokens'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { getAllNodeProviders } from '../../utils'

class Darwinia<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    const currencySelection: TSelfReserveAsset | TForeignAsset =
      input.currency === this.getNativeAssetSymbol()
        ? 'SelfReserve'
        : { ForeignAsset: currencyID ? BigInt(currencyID) : undefined }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    currencyId?: string,
    overridedMultiLocation?: TMultiLocation
  ) {
    if (scenario === 'ParaToPara') {
      const interior = {
        X1: {
          PalletInstance: 5
        }
      }
      return createCurrencySpec(amount, version, Parents.ZERO, overridedMultiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[2]
  }
}

export default Darwinia
