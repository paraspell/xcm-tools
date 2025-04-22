import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

const isAssetHub = (chain: TNodeDotKsmWithRelayChains) =>
  chain === 'AssetHubPolkadot' || chain === 'AssetHubKusama'

const isBridgeHub = (chain: TNodeDotKsmWithRelayChains) =>
  chain === 'BridgeHubPolkadot' || chain === 'BridgeHubKusama'

const isPeople = (chain: TNodeDotKsmWithRelayChains) =>
  chain === 'PeoplePolkadot' || chain === 'PeopleKusama'

const isSystemPara = (chain: TNodeDotKsmWithRelayChains) =>
  isAssetHub(chain) || isBridgeHub(chain) || isPeople(chain)

const mul = (v: bigint, num: bigint, den: bigint = 1n): bigint => (v * num) / den

export const padFee = (
  raw: bigint,
  origin: TNodeDotKsmWithRelayChains,
  dest: TNodeDotKsmWithRelayChains,
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
  if (paraToPara) return mul(raw, 130n, 100n)

  // apply default 30% padding
  return mul(raw, 130n, 100n)
}
