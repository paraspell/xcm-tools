import { Extrinsic, PolkadotXCMTransferInput } from '../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM(
    { api, header, addressSelection, currencySelection }: PolkadotXCMTransferInput,
    method: string,
    fees: 'Unlimited' | undefined = undefined
  ): Extrinsic {
    return fees
      ? api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0, fees)
      : api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0)
  }
}

export default PolkadotXCMTransferImpl
