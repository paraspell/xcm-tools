import type { IPolkadotApi } from '../../api'

export const getParaEthTransferFees = async <TApi, TRes>(
  ahApi: IPolkadotApi<TApi, TRes>
): Promise<[bigint, bigint]> => {
  const DEFAULT_FEE = 2_750_872_500_000n

  const feeStorageItem = await ahApi.getFromStorage('0x5fbc5c7ba58845ad1f1a9a7c5bc12fad')
  const leFeeHex = feeStorageItem.replace('0x', '')

  await ahApi.disconnect()

  const bytes = leFeeHex.match(/.{1,2}/g) || []
  const reversedHex = bytes.reverse().join('')

  const validReversedHex = reversedHex === '' ? '0' : reversedHex
  const leFee = BigInt('0x' + validReversedHex)

  const transferBridgeFee = leFee === 0n ? DEFAULT_FEE : BigInt(leFee.toString())

  const transferAssethubExecutionFee = 2200000000n

  const finalBridgeFee = (transferBridgeFee * 110n) / 100n
  const finalAssethubExecutionFee = (transferAssethubExecutionFee * 110n) / 100n
  return [finalBridgeFee, finalAssethubExecutionFee]
}
