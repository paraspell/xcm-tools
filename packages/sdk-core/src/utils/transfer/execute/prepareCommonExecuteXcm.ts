import type { TAsset } from '@paraspell/assets'

import { createPayFees } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { sortAssets } from '../../asset'
import { createBeneficiaryLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

export const prepareCommonExecuteXcm = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain>,
  assetToDeposit?: TAsset
) => {
  const {
    api,
    feeAssetInfo: feeAsset,
    useJitWithdraw,
    recipient,
    version,
    forceBuyExecution = false
  } = options

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
      ...createPayFees(
        version,
        feeAssetLocalized ?? assetLocalized,
        {
          refTime: 450n,
          proofSize: 0n
        },
        false,
        forceBuyExecution
      )
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
