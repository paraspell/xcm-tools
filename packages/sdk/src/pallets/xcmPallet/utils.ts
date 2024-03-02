import { type BN } from '@polkadot/util'
import {
  Version,
  Parents,
  type PolkadotXCMHeader,
  type TScenario,
  type Extrinsic,
  type TRelayToParaInternalOptions
} from '../../types'
import { generateAddressPayload } from '../../utils'
import { getParaId } from '../assets'

export const constructRelayToParaParameters = (
  { api, destination, address, amount, paraIdTo }: TRelayToParaInternalOptions,
  version: Version,
  includeFee = false
): any[] => {
  const paraId = paraIdTo ?? getParaId(destination)
  const parameters = [
    createPolkadotXcmHeader('RelayToPara', version, paraId),
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

export const createPolkadotXcmHeader = (
  scenario: TScenario,
  version: Version,
  nodeId?: number
): PolkadotXCMHeader => {
  const parents = scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : {
          X1: {
            Parachain: nodeId
          }
        }
  return {
    [scenario === 'RelayToPara' ? Version.V3 : version]: {
      parents,
      interior
    }
  }
}

export const calculateTransactionFee = async (tx: Extrinsic, address: string): Promise<BN> => {
  const { partialFee } = await tx.paymentInfo(address)
  return partialFee.toBn()
}
