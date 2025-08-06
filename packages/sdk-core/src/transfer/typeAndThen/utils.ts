import type { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { createBeneficiaryLocation } from '../../utils'

export const createRefundInstruction = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  senderAddress: string,
  version: Version
) => ({
  SetAppendix: [
    {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: createBeneficiaryLocation({
          api,
          address: senderAddress,
          version
        })
      }
    }
  ]
})
