import { isRelayChain } from '@paraspell/sdk-common'

import { UnsupportedOperationError } from '../../errors'
import type { TPolkadotXCMTransferOptions, TSerializedExtrinsics } from '../../types'
import {
  addXcmVersionHeader,
  assertAddressIsString,
  createBeneficiaryLocation,
  createDestination
} from '../../utils'
import { createPayFees } from './createPayFees'
import { createTransactInstructions } from './createTransact'

export const handleTransactUsingSend = async <TApi, TRes, TSigner>({
  api,
  version,
  chain,
  destination,
  destChain,
  address,
  paraIdTo,
  asset,
  transactOptions
}: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TSerializedExtrinsics> => {
  const dest = createDestination(version, chain, destination, paraIdTo)

  if (!transactOptions?.call) {
    throw new UnsupportedOperationError(
      'Cannot use handleTransactUsingSend without transactOptions.call defined'
    )
  }

  if (!destChain) {
    throw new UnsupportedOperationError(
      'destChain must be provided when using handleTransactUsingSend'
    )
  }

  assertAddressIsString(address)

  const transactInstructions = await createTransactInstructions(
    api,
    transactOptions,
    version,
    destChain,
    address
  )

  const message = [
    {
      WithdrawAsset: [asset]
    },
    ...createPayFees(version, asset),
    ...transactInstructions,
    {
      RefundSurplus: undefined
    },
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: createBeneficiaryLocation({
          api,
          address,
          version
        })
      }
    }
  ]

  return {
    module: isRelayChain(chain) ? 'XcmPallet' : 'PolkadotXcm',
    method: 'send',
    params: {
      dest: addXcmVersionHeader(dest, version),
      message: addXcmVersionHeader(message, version)
    }
  }
}
