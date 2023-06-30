//Contains test scenario for Parachain to Parachain transfer on Crust

import { describe, it, vi, expect } from 'vitest'
import { TScenario, XTokensTransferInput } from '../..'
import { createApiInstance, getFees, handleAddress } from '../../utils'
import XTokensTransferImpl from '../XTokensTransferImpl'
import Crust from './Crust'

describe('Crust', () => {
  it('transferXTokens - ParaToPara', async () => {
    const api = await createApiInstance('wss://crust-parachain.crustapps.net')
    const crust = new Crust()
    const currency = 'CRU'
    const currencyID = undefined
    const paraId = 2006
    const amount = 1000
    const scenario: TScenario = 'ParaToPara'
    const fees = getFees(scenario)
    const addressSelection = handleAddress(scenario, 'polkadotXCM', api, '', 1, paraId, crust.node)
    const input: XTokensTransferInput = {
      api: undefined as any,
      currency,
      currencyID,
      amount,
      addressSelection,
      fees
    }
    const transferSpy = vi.spyOn(XTokensTransferImpl, 'transferXTokens').mockImplementation(() => {
      return undefined as any
    })
    await crust.transferXTokens(input)
    expect(transferSpy).toHaveBeenCalledWith(input, 'SelfReserve', fees)
  })
})
