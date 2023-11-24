import { type Version, type TTransferRelayToParaOptions } from '../../types'
import {
  createCurrencySpecification,
  createHeaderPolkadotXCM,
  generateAddressPayload
} from '../../utils'
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
    createCurrencySpecification(amount, 'RelayToPara', version, destination),
    0
  ]
  if (includeFee) {
    parameters.push('Unlimited')
  }
  return parameters
}
