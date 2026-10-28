import type { TAssetInfo, WithAmount } from '@paraspell/assets'

export const calcPreviewMintAmount = (balance: bigint, desired: bigint): bigint | null => {
  if (desired <= 0n) return null
  const missing = desired - balance
  return missing > 0n ? missing : null
}

export const calcSentAssetPreviewMint = (
  asset: WithAmount<TAssetInfo>,
  balance: bigint,
  keepAlive = false
): bigint => {
  const keepAliveBuffer = keepAlive ? BigInt(asset.existentialDeposit) : 0n
  return calcPreviewMintAmount(balance, asset.amount + keepAliveBuffer) ?? 0n
}
