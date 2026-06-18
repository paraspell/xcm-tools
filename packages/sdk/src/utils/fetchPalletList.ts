import type { TPalletEntry } from '@paraspell/sdk-core'
import { decAnyMetadata, unifyMetadata } from '@polkadot-api/substrate-bindings'
import type { PolkadotClient } from 'polkadot-api'

export const fetchPalletList = async (client: PolkadotClient): Promise<TPalletEntry[]> => {
  const { hash } = await client.getFinalizedBlock()
  const bytes = await client.getMetadata(hash)
  const meta = unifyMetadata(decAnyMetadata(bytes))
  return meta.pallets.map(p => ({
    name: p.name,
    index: p.index,
    hasExtrinsics: p.calls !== undefined
  }))
}
