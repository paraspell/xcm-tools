import { NODE_NAMES_DOT_KSM, type TEcosystemType } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getNode } from '../utils'
import { getParaId } from './config'
import { getTNode } from './getTNode'

describe('getTNode', () => {
  it('should return supported assets for all nodes', () => {
    ;(['polkadot', 'kusama'] as TEcosystemType[]).forEach(ecosystem => {
      NODE_NAMES_DOT_KSM.filter(node => getNode(node).type === ecosystem).forEach(node => {
        const paraId = getParaId(node)
        if (paraId === undefined) return
        const nodeName = getTNode(paraId, ecosystem)
        expect(nodeName).toEqual(node)
      })
    })
  })

  it('should return Polkadot for paraId 0', () => {
    const nodeName = getTNode(0, 'polkadot')
    expect(nodeName).toEqual('Polkadot')
  })

  it('should return Kusama for paraId 0', () => {
    const nodeName = getTNode(0, 'kusama')
    expect(nodeName).toEqual('Kusama')
  })

  it('should return Ethereum for paraId 1', () => {
    const nodeName = getTNode(1, 'kusama')
    expect(nodeName).toEqual('Ethereum')
  })

  it('should return null for not existing paraId', () => {
    const nodeName = getTNode(9999, 'kusama')
    expect(nodeName).toBeNull()
  })
})
