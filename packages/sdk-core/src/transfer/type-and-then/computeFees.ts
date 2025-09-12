import { hasXcmPaymentApiSupport, type TAssetInfo } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { addXcmVersionHeader, padFeeBy } from '../../utils'
import type { createCustomXcm } from './createCustomXcm'
import type { createRefundInstruction } from './utils'

const FEE_PADDING_PERCENTAGE = 20
const FEE_PADDING_HYDRATION = 500

const computeInstructionFee = async <TApi, TRes>(
  { chain, api }: TChainWithApi<TApi, TRes>,
  version: Version,
  xcm: unknown
) =>
  padFeeBy(
    await api.getXcmPaymentApiFee(
      chain,
      addXcmVersionHeader(xcm, version),
      { location: DOT_LOCATION } as TAssetInfo,
      true
    ),
    chain === 'Hydration' ? FEE_PADDING_HYDRATION : FEE_PADDING_PERCENTAGE
  )

export const computeAllFees = async <TApi, TRes>(
  { reserve, dest, options: { version } }: TTypeAndThenCallContext<TApi, TRes>,
  customXcm: ReturnType<typeof createCustomXcm>,
  isDotAsset: boolean,
  refundInstruction: ReturnType<typeof createRefundInstruction> | null
): Promise<TTypeAndThenFees> =>
  'DepositReserveAsset' in customXcm
    ? {
        reserveFee: await computeInstructionFee(reserve, version, [customXcm]),
        refundFee: refundInstruction
          ? await computeInstructionFee(reserve, version, [refundInstruction])
          : 0n,
        destFee: await computeInstructionFee(
          hasXcmPaymentApiSupport(dest.chain) ? dest : reserve,
          version,
          customXcm.DepositReserveAsset.xcm
        )
      }
    : {
        reserveFee: 0n,
        destFee: !isDotAsset
          ? await computeInstructionFee(
              hasXcmPaymentApiSupport(dest.chain) ? dest : reserve,
              version,
              [customXcm]
            )
          : 0n,
        refundFee: !isDotAsset
          ? await computeInstructionFee(
              hasXcmPaymentApiSupport(reserve.chain) ? reserve : dest,
              version,
              [refundInstruction]
            )
          : 0n
      }
