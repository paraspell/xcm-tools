import { describe, it, vi, expect } from 'vitest'
import { TScenario, XTokensTransferInput } from '../..'
import { createApiInstance, handleAddress } from '../../utils'
import XTokensTransferImpl from '../XTokensTransferImpl'
import Turing from './Turing'

describe('Turing', () => {
  it('transferXTokens - ParaToPara', async () => {
    const api = await createApiInstance('wss://turing-rpc.dwellir.com')
    const turing = new Turing()
    const fees = 0
    const currency = 'KSM'
    const currencyID = undefined
    const paraId = 2006
    const amount = 1000
    const scenario: TScenario = 'ParaToPara'
    const addressSelection = handleAddress(scenario, 'polkadotXCM', api, '', paraId, turing.node)
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
    await turing.transferXTokens(input)
    expect(transferSpy).toHaveBeenCalledWith(input, undefined, fees)
  })
})
