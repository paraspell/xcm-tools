import type { TMultiAsset } from '@paraspell/assets'

import type { TCreateTransferXcmOptions } from '../../../types'
import { createBeneficiaryLocation } from '../../location'
import { sortMultiAssets } from '../../multiAsset'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

export const prepareCommonExecuteXcm = <TApi, TRes>(
  options: TCreateTransferXcmOptions<TApi, TRes>,
  multiAssetToDeposit?: TMultiAsset
) => {
  const { api, feeAsset, recipientAddress, version } = options

  const context = prepareExecuteContext(options)

  const { multiAssetLocalized, multiAssetLocalizedToDest, feeMultiAssetLocalized } = context

  const withdrawAssets = sortMultiAssets(
    feeMultiAssetLocalized ? [multiAssetLocalized, feeMultiAssetLocalized] : [multiAssetLocalized]
  )

  const prefix = []

  prefix.push({
    WithdrawAsset: withdrawAssets
  })

  if (feeAsset) {
    prefix.push({
      BuyExecution: {
        fees: feeMultiAssetLocalized ?? multiAssetLocalized,
        weight_limit: {
          Limited: { ref_time: 450n, proof_size: 0n }
        }
      }
    })
  } else {
    prefix.push({
      SetFeesMode: {
        jit_withdraw: true
      }
    })
  }

  const beneficiary = createBeneficiaryLocation({
    api,
    address: recipientAddress,
    version
  })

  const depositInstruction = {
    DepositAsset: {
      assets: createAssetsFilter(multiAssetToDeposit ?? multiAssetLocalizedToDest),
      beneficiary
    }
  }

  return { prefix, depositInstruction }
}
