import type { PolkadotApi } from '@paraspell/sdk-core'
import { isDestinationReachable } from '@paraspell/sdk-core'
import { decodeFunctionData } from 'viem'
import { describe, expect, it } from 'vitest'

import { buildEvmTransfer } from '../buildEvmTransfer'
import abi from './abi.json' with { type: 'json' }

// accountToHex(hexAddress, false) strips the 0x prefix, like the PAPI / PJS / Dedot implementations
const api = {
  accountToHex: (a: string, isPrefixed = true) => (isPrefixed ? a : a.slice(2)),
  config: undefined
} as unknown as PolkadotApi<unknown, unknown, unknown>

const build = (to: string) =>
  buildEvmTransfer({
    api,
    from: 'Darwinia',
    to: to as never,
    currency: { symbol: 'DOT', amount: '1' },
    recipient: '0x' + 'ab'.repeat(32),
    sender: '0x1111111111111111111111111111111111111111'
  } as never)

const destOf = (data: `0x${string}`) => decodeFunctionData({ abi, data }).args?.[2]
describe('Darwinia EVM transfer to a Kusama-ecosystem chain', () => {
  for (const [kusamaChain, polkadotTwin] of [
    ['Karura', 'Acala'],
    ['AssetHubKusama', 'AssetHubPolkadot'],
    ['Kusama', 'Polkadot']
  ] as const) {
    it(`Darwinia -> ${kusamaChain} is rejected like the substrate path`, async () => {
      // the substrate path treats this route as unsupported
      expect(isDestinationReachable('Darwinia', kusamaChain)).toBe(false)

      const tx = await build(kusamaChain).catch((e: Error) => e)

      // expected: rejected like the substrate path ("must share the same relay chain")
      expect(tx).toBeInstanceOf(Error)
      expect((tx as Error).message).toContain('must share the same relay chain')
    })

    it(`Darwinia -> ${polkadotTwin} (Polkadot twin) still builds`, async () => {
      const tx = await build(polkadotTwin)
      expect(destOf(tx.data as `0x${string}`)).toBeDefined()
    })
  }
})
