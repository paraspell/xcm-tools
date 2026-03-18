import { getXcmPallet } from '@paraspell/pallets'

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
  recipient,
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

  assertAddressIsString(recipient)

  const transactInstructions = await createTransactInstructions(
    api,
    transactOptions,
    version,
    destChain,
    recipient
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
          address: recipient,
          version
        })
      }
    }
  ]

  return {
    module: getXcmPallet(chain),
    method: 'send',
    params: {
      dest: addXcmVersionHeader(dest, version),
      message: addXcmVersionHeader(message, version)
    }
  }
}
