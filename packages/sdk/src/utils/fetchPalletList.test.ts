import { decAnyMetadata, unifyMetadata } from '@polkadot-api/substrate-bindings'
import type { PolkadotClient } from 'polkadot-api'
import { describe, expect, it, vi } from 'vitest'

import { fetchPalletList } from './fetchPalletList'

vi.mock('@polkadot-api/substrate-bindings', () => ({
  decAnyMetadata: vi.fn(),
  unifyMetadata: vi.fn()
}))

describe('fetchPalletList', () => {
  it('maps unified metadata pallets into TPalletEntry records', async () => {
    vi.mocked(decAnyMetadata).mockReturnValue({} as ReturnType<typeof decAnyMetadata>)
    vi.mocked(unifyMetadata).mockReturnValue({
      pallets: [
        { name: 'Balances', index: 10, calls: { type: 1 } },
        { name: 'System', index: 0, calls: undefined }
      ]
    } as unknown as ReturnType<typeof unifyMetadata>)

    const client = {
      getFinalizedBlock: vi.fn().mockResolvedValue({ hash: '0xabc' }),
      getMetadata: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    } as unknown as PolkadotClient

    await expect(fetchPalletList(client)).resolves.toEqual([
      { name: 'Balances', index: 10, hasExtrinsics: true },
      { name: 'System', index: 0, hasExtrinsics: false }
    ])
  })
})
