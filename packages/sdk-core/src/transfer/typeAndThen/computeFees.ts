import { hasXcmPaymentApiSupport, type TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { addXcmVersionHeader } from '../../utils'
import { padFeeBy } from '../fees'
import type { createCustomXcm } from './createCustomXcm'
import type { createRefundInstruction } from './utils'

const FEE_PADDING_PERCENTAGE = 20
const FEE_PADDING_HYDRATION = 150

const computeInstructionFee = async <TApi, TRes>(
  { chain, api }: TChainWithApi<TApi, TRes>,
  version: Version,
  xcm: unknown
) =>
  padFeeBy(
    await api.getXcmPaymentApiFee(
      chain,
      addXcmVersionHeader(xcm, version),
      { multiLocation: DOT_MULTILOCATION } as TAsset,
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
