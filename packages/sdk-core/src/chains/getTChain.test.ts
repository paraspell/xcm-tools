import { CHAIN_NAMES_DOT_KSM, type TEcosystemType } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getChain } from '../utils'
import { getParaId } from './config'
import { getTChain } from './getTChain'

describe('getTChain', () => {
  it('should return supported assets for all chains', () => {
    ;(['polkadot', 'kusama'] as TEcosystemType[]).forEach(ecosystem => {
      CHAIN_NAMES_DOT_KSM.filter(chain => getChain(chain).type === ecosystem).forEach(chain => {
        const paraId = getParaId(chain)
        if (paraId === undefined) return
        const tChain = getTChain(paraId, ecosystem)
        expect(tChain).toEqual(chain)
      })
    })
  })

  it('should return Polkadot for paraId 0', () => {
    const chain = getTChain(0, 'polkadot')
    expect(chain).toEqual('Polkadot')
  })

  it('should return Kusama for paraId 0', () => {
    const chain = getTChain(0, 'kusama')
    expect(chain).toEqual('Kusama')
  })

  it('should return Ethereum for paraId 1', () => {
    const chain = getTChain(1, 'kusama')
    expect(chain).toEqual('Ethereum')
  })

  it('should return null for not existing paraId', () => {
    const chain = getTChain(9999, 'kusama')
    expect(chain).toBeNull()
  })
})
