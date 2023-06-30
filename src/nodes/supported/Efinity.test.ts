//Contains test scenario for Parachain to Parachain transfer on Efinity

import { describe, it, vi, expect } from 'vitest'
import { TScenario, XTokensTransferInput } from '../..'
import { createApiInstance, handleAddress } from '../../utils'
import XTokensTransferImpl from '../XTokensTransferImpl'
import Efinity from './Efinity'

describe('Efinity', () => {
  it('transferXTokens - ParaToPara', async () => {
    const api = await createApiInstance('wss://rpc.efinity.io')
    const efinity = new Efinity()
    const currency = 'DOT'
    const currencyID = undefined
    const paraId = 2006
    const amount = 1000
    const scenario: TScenario = 'ParaToPara'
    const addressSelection = handleAddress(scenario, 'polkadotXCM', api, '', 3, paraId, efinity.node)
    const input: XTokensTransferInput = {
      api: undefined as any,
      currency,
      currencyID,
      amount,
      addressSelection,
      fees: 0
    }
    const transferSpy = vi.spyOn(XTokensTransferImpl, 'transferXTokens').mockImplementation(() => {
      return undefined as any
    })
    await efinity.transferXTokens(input)
    expect(transferSpy).toHaveBeenCalledWith(input, { currencyId: [0, currencyID] })
  })
})
