import type { IPolkadotApi } from '../../api'

export const calculateFee = async <TApi, TRes>(ahApi: IPolkadotApi<TApi, TRes>) => {
  const DEFAULT_FEE = 2_750_872_500_000n

  const feeStorageItem = await ahApi.getFromStorage('0x5fbc5c7ba58845ad1f1a9a7c5bc12fad')
  const leFeeHex = feeStorageItem.replace('0x', '')

  await ahApi.disconnect()

  const leFee = BigInt('0x' + leFeeHex.split('').reverse().join(''))

  const transfer_bridge_fee = leFee === 0n ? DEFAULT_FEE : BigInt(leFee.toString())

  const transfer_assethub_execution_fee = 2200000000n
  return (transfer_bridge_fee + transfer_assethub_execution_fee).toString()
}
