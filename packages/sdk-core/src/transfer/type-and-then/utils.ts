import type { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { createBeneficiaryLocation } from '../../utils'

export const createRefundInstruction = <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  address: string,
  version: Version,
  assetCount: number
) => ({
  SetAppendix: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: assetCount } },
        beneficiary: createBeneficiaryLocation({
          api,
          address,
          version
        })
      }
    }
  ]
})
