import type { TChainWithRelayChains } from '@paraspell/sdk-common'
import { isRelayChain, type TChainDotKsmWithRelayChains } from '@paraspell/sdk-common'

const isAssetHub = (chain: TChainWithRelayChains) =>
  chain === 'AssetHubPolkadot' || chain === 'AssetHubKusama'

const isBridgeHub = (chain: TChainWithRelayChains) =>
  chain === 'BridgeHubPolkadot' || chain === 'BridgeHubKusama'

const isPeople = (chain: TChainWithRelayChains) =>
  chain === 'PeoplePolkadot' || chain === 'PeopleKusama'

const isSystemPara = (chain: TChainWithRelayChains) =>
  isAssetHub(chain) || isBridgeHub(chain) || isPeople(chain)

const mul = (v: bigint, num: bigint, den: bigint = 1n): bigint => (v * num) / den

export const padFee = (
  raw: bigint,
  origin: TChainDotKsmWithRelayChains,
  dest: TChainWithRelayChains,
  side: 'origin' | 'destination'
): bigint => {
  const relayOrigin = isRelayChain(origin)
  const relayDest = isRelayChain(dest)
  const sysParaOrigin = isSystemPara(origin)
  const sysParaDest = isSystemPara(dest)
  const relayToPara = relayOrigin && !relayDest
  const sysParaToPara = sysParaOrigin && !sysParaDest
  const paraToPara = !relayOrigin && !sysParaOrigin

  if (sysParaToPara) return raw * 40n
  if (relayToPara) return side === 'origin' ? mul(raw, 320n, 100n) : mul(raw, 3000n, 100n)

  if (paraToPara && side == 'origin' && origin === 'Mythos' && dest !== 'Ethereum') {
    return 150000000000000000n
  }

  if (paraToPara) return mul(raw, 130n, 100n)

  // apply default 30% padding
  return mul(raw, 130n, 100n)
}

export const padFeeBy = (amount: bigint, percent: number): bigint => {
  return mul(amount, BigInt(100 + percent), 100n)
}
