import {
  findAssetInfoByLoc,
  getOtherAssets,
  hasXcmPaymentApiSupport,
  type TAssetInfo
} from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { addXcmVersionHeader, padValueBy } from '../../utils'
import type { createCustomXcm } from './createCustomXcm'
import type { createRefundInstruction } from './utils'

const FEE_PADDING_PERCENTAGE = 20
const FEE_ETH_ASSET_PADDING_PERCENTAGE = 100
const FEE_PADDING_HYDRATION = 500

const getPadding = <TApi, TRes>(
  chain: TSubstrateChain,
  { assetInfo, dest }: TTypeAndThenCallContext<TApi, TRes>
) => {
  const isEthAsset =
    assetInfo.location && findAssetInfoByLoc(getOtherAssets('Ethereum'), assetInfo.location)
  if (chain === 'Hydration') return FEE_PADDING_HYDRATION
  if (isEthAsset && dest.chain.startsWith('AssetHub')) return FEE_ETH_ASSET_PADDING_PERCENTAGE
  return FEE_PADDING_PERCENTAGE
}

const computeInstructionFee = async <TApi, TRes>(
  { chain, api }: TChainWithApi<TApi, TRes>,
  version: Version,
  xcm: unknown,
  context: TTypeAndThenCallContext<TApi, TRes>
) => {
  const padding = getPadding(chain, context)
  return padValueBy(
    await api.getXcmPaymentApiFee(
      chain,
      addXcmVersionHeader(xcm, version),
      [],
      { location: DOT_LOCATION } as TAssetInfo,
      true
    ),
    padding
  )
}

export const computeAllFees = async <TApi, TRes>(
  context: TTypeAndThenCallContext<TApi, TRes>,
  customXcm: ReturnType<typeof createCustomXcm>,
  isDotAsset: boolean,
  refundInstruction: ReturnType<typeof createRefundInstruction> | null
): Promise<TTypeAndThenFees> => {
  const {
    reserve,
    dest,
    options: { version }
  } = context
  return customXcm.some(x => 'DepositReserveAsset' in x || 'InitiateTeleport' in x)
    ? {
        reserveFee: await computeInstructionFee(reserve, version, customXcm, context),
        refundFee: refundInstruction
          ? await computeInstructionFee(reserve, version, [refundInstruction], context)
          : 0n,
        destFee: await computeInstructionFee(
          hasXcmPaymentApiSupport(dest.chain) ? dest : reserve,
          version,
          (() => {
            const instr = customXcm.find(
              j => 'DepositReserveAsset' in j || 'InitiateTeleport' in j
            ) as
              | { DepositReserveAsset: { xcm: unknown } }
              | { InitiateTeleport: { xcm: unknown } }
              | undefined
            return instr
              ? 'DepositReserveAsset' in instr
                ? instr.DepositReserveAsset.xcm
                : instr.InitiateTeleport.xcm
              : undefined
          })(),
          context
        )
      }
    : {
        reserveFee: 0n,
        destFee: !isDotAsset
          ? await computeInstructionFee(
              hasXcmPaymentApiSupport(dest.chain) ? dest : reserve,
              version,
              customXcm,
              context
            )
          : 0n,
        refundFee: !isDotAsset
          ? await computeInstructionFee(
              hasXcmPaymentApiSupport(reserve.chain) ? reserve : dest,
              version,
              [refundInstruction],
              context
            )
          : 0n
      }
}
