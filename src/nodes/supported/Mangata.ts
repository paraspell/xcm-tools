// Contains detailed structure of XCM call construction for Mangata Parachain

import { WsProvider, ApiPromise } from '@polkadot/api'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'
import { type ApiOptions } from '@polkadot/api/types'
import { mTypes, mRpc } from '@mangata-finance/type-definitions'

const options = ({ types = {}, rpc = {}, ...otherOptions }: ApiOptions = {}): ApiOptions => ({
  types: {
    ...mTypes,
    ...types
  },
  rpc: {
    ...mRpc,
    ...rpc
  },
  ...otherOptions
})

class Mangata extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Mangata', 'mangata', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }

  async createApiInstance(): Promise<ApiPromise> {
    const provider = new WsProvider(this.getProvider())
    return await ApiPromise.create(
      options({
        provider,
        throwOnConnect: true,
        throwOnUnknown: true,
        noInitWarn: true
      })
    )
  }
}

export default Mangata
