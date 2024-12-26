// Contains detailed structure of XCM call construction for CoretimeKusama Parachain

import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class CoretimeKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('CoretimeKusama', 'kusamaCoretime', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    // TESTED block hash on Rococo: 0x78ace0f1bf7cac9a42e56143321b617d98327e2750f795efb0abb833025c9082
    const { scenario } = input
    const section =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited'))
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }
}

export default CoretimeKusama
