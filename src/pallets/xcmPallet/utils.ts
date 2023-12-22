import { type Version, type TTransferRelayToParaOptions, Parents } from '../../types'
import { createHeaderPolkadotXCM, generateAddressPayload } from '../../utils'
import { getParaId } from '../assets'

export const constructRelayToParaParameters = (
  { api, destination, address, amount }: TTransferRelayToParaOptions,
  version: Version,
  includeFee = false
): any[] => {
  const paraId = getParaId(destination)
  const parameters = [
    createHeaderPolkadotXCM('RelayToPara', version, paraId),
    generateAddressPayload(api, 'RelayToPara', null, address, version, paraId),
    createCurrencySpec(amount, version, Parents.ZERO),
    0
  ]
  if (includeFee) {
    parameters.push('Unlimited')
  }
  return parameters
}

export const createCurrencySpec = (
  amount: string,
  version: Version,
  parents: Parents,
  interior: any = 'Here'
): any => ({
  [version]: [
    {
      id: {
        Concrete: {
          parents,
          interior
        }
      },
      fun: {
        Fungible: amount
      }
    }
  ]
})
