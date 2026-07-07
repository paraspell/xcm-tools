import type { TAsset } from '@paraspell/assets'

import { createBuyExecution } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { sortAssets } from '../../asset'
import { createBeneficiaryLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

export const prepareCommonExecuteXcm = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain>,
  assetToDeposit?: TAsset
) => {
  const { api, useJitWithdraw, recipient, version } = options

  const context = prepareExecuteContext(options)

  const { assetLocalized, assetLocalizedToDest, feeAssetLocalized } = context

  const withdrawAssets = sortAssets(
    feeAssetLocalized ? [assetLocalized, feeAssetLocalized] : [assetLocalized]
  )

  const prefix = []

  prefix.push({
    WithdrawAsset: withdrawAssets
  })

  if (feeAssetLocalized && !useJitWithdraw) {
    prefix.push(...createBuyExecution(feeAssetLocalized))
  } else {
    prefix.push({
      SetFeesMode: {
        jit_withdraw: true
      }
    })
  }

  const beneficiary = createBeneficiaryLocation({
    api,
    address: recipient,
    version
  })

  const depositInstruction = {
    DepositAsset: {
      assets: createAssetsFilter(assetToDeposit ?? assetLocalizedToDest, version),
      beneficiary
    }
  }

  return { prefix, depositInstruction }
}
