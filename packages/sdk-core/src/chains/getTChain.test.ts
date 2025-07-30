import { PARACHAINS, RELAYCHAINS, type TEcosystemType } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getChain } from '../utils'
import { getParaId } from './config'
import { getTChain } from './getTChain'

describe('getTChain', () => {
  it('should return supported assets for all chains', () => {
    ;(['polkadot', 'kusama', 'westend', 'paseo'] as TEcosystemType[]).forEach(ecosystem => {
      PARACHAINS.filter(chain => getChain(chain).type === ecosystem).forEach(chain => {
        const paraId = getParaId(chain)
        if (paraId === undefined) return
        const tChain = getTChain(paraId, ecosystem)
        expect(tChain).toEqual(chain)
      })
    })
  })

  RELAYCHAINS.forEach(relaychain => {
    it(`should return ${relaychain} for paraId 0`, () => {
      const chain = getTChain(0, relaychain.toLowerCase() as TEcosystemType)
      expect(chain).toEqual(relaychain)
    })
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
