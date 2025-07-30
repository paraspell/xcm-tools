import type { TAsset } from '@paraspell/assets'

import type { TCreateTransferXcmOptions } from '../../../types'
import { sortAssets } from '../../asset'
import { createBeneficiaryLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

export const prepareCommonExecuteXcm = <TApi, TRes>(
  options: TCreateTransferXcmOptions<TApi, TRes>,
  assetToDeposit?: TAsset
) => {
  const { api, feeAssetInfo: feeAsset, recipientAddress, version } = options

  const context = prepareExecuteContext(options)

  const { assetLocalized, assetLocalizedToDest, feeAssetLocalized } = context

  const withdrawAssets = sortAssets(
    feeAssetLocalized ? [assetLocalized, feeAssetLocalized] : [assetLocalized]
  )

  const prefix = []

  prefix.push({
    WithdrawAsset: withdrawAssets
  })

  if (feeAsset) {
    prefix.push({
      BuyExecution: {
        fees: feeAssetLocalized ?? assetLocalized,
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
      assets: createAssetsFilter(assetToDeposit ?? assetLocalizedToDest),
      beneficiary
    }
  }

  return { prefix, depositInstruction }
}
