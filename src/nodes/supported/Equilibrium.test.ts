import { describe, it, vi, expect } from 'vitest'
import { PolkadotXCMTransferInput, TScenario } from '../..'
import {
  createApiInstance,
  createCurrencySpecification,
  createHeaderPolkadotXCM,
  handleAddress
} from '../../utils'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import Equilibrium from './Equilibrium'

describe('Equilibrium', () => {
  it('transferPolkadotXCM - ParaToRelay', async () => {
    const api = await createApiInstance('wss://node.pol.equilibrium.io/')
    const equilibrium = new Equilibrium()
    const currency = 'DOT'
    const paraId = 2006
    const amount = 1000
    const scenario: TScenario = 'ParaToRelay'
    const addressSelection = handleAddress(
      scenario,
      'polkadotXCM',
      api,
      '',
      paraId,
      equilibrium.node
    )
    const header = createHeaderPolkadotXCM(scenario, paraId, equilibrium.node)
    const currencySelection = createCurrencySpecification(
      amount,
      scenario,
      equilibrium.node,
      currency
    )
    const input: PolkadotXCMTransferInput = {
      api: undefined as any,
      header,
      addressSelection,
      currencySelection,
      scenario
    }
    const transferSpy = vi
      .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
      .mockImplementation(() => {
        return undefined as any
      })
    await equilibrium.transferPolkadotXCM(input)
    expect(transferSpy).toHaveBeenCalledWith(input, 'reserveTransferAssets')
  })
})
