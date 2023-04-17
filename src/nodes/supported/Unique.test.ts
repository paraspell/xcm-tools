import { describe, it, vi, expect } from 'vitest'
import { TScenario, XTokensTransferInput } from '../..'
import { createApiInstance, handleAddress } from '../../utils'
import XTokensTransferImpl from '../XTokensTransferImpl'
import Unique from './Unique'

describe('Unique', () => {
  it('transferXTokens - ParaToPara', async () => {
    const api = await createApiInstance('wss://unique.api.onfinality.io/public-ws')
    const unique = new Unique()
    const currency = 'DOT'
    const currencyID = 1
    const paraId = 2006
    const amount = 1000
    const scenario: TScenario = 'ParaToPara'
    const addressSelection = handleAddress(scenario, 'polkadotXCM', api, '', paraId, unique.node)
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
    await unique.transferXTokens(input)
    expect(transferSpy).toHaveBeenCalledWith(input, { ForeignAssetId: currencyID })
  })
})
