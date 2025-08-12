import { PARACHAINS, RELAYCHAINS } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getChain } from '../utils'
import { getParaId } from './config'
import { getTChain } from './getTChain'

describe('getTChain', () => {
  it('should return supported assets for all chains', () => {
    RELAYCHAINS.forEach(ecosystem => {
      PARACHAINS.filter(chain => getChain(chain).ecosystem === ecosystem).forEach(chain => {
        const paraId = getParaId(chain)
        if (paraId === undefined) return
        const tChain = getTChain(paraId, ecosystem)
        expect(tChain).toEqual(chain)
      })
    })
  })

  RELAYCHAINS.forEach(relaychain => {
    it(`should return ${relaychain} for paraId 0`, () => {
      const chain = getTChain(0, relaychain)
      expect(chain).toEqual(relaychain)
    })
  })

  it('should return Ethereum for paraId 1', () => {
    const chain = getTChain(1, 'Ethereum')
    expect(chain).toEqual('Ethereum')
  })

  it('should return null for not existing paraId', () => {
    const chain = getTChain(9999, 'Polkadot')
    expect(chain).toBeNull()
  })
})
