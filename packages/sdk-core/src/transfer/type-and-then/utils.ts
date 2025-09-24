import type { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { createBeneficiaryLocation } from '../../utils'

export const createRefundInstruction = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  senderAddress: string,
  version: Version,
  assetCount: number
) => ({
  SetAppendix: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: assetCount } },
        beneficiary: createBeneficiaryLocation({
          api,
          address: senderAddress,
          version
        })
      }
    }
  ]
})
