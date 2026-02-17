import type { TAsset } from '@paraspell/assets'

import { createPayFees } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { sortAssets } from '../../asset'
import { createBeneficiaryLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

export const prepareCommonExecuteXcm = <TApi, TRes, TSigner>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner>,
  assetToDeposit?: TAsset
) => {
  const { api, feeAssetInfo: feeAsset, useJitWithdraw, recipientAddress, version } = options

  const context = prepareExecuteContext(options)

  const { assetLocalized, assetLocalizedToDest, feeAssetLocalized } = context

  const withdrawAssets = sortAssets(
    feeAssetLocalized ? [assetLocalized, feeAssetLocalized] : [assetLocalized]
  )

  const prefix = []

  prefix.push({
    WithdrawAsset: withdrawAssets
  })

  if (feeAsset && !useJitWithdraw) {
    prefix.push(
      ...createPayFees(version, feeAssetLocalized ?? assetLocalized, {
        refTime: 450n,
        proofSize: 0n
      })
    )
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
      assets: createAssetsFilter(assetToDeposit ?? assetLocalizedToDest, version),
      beneficiary
    }
  }

  return { prefix, depositInstruction }
}
