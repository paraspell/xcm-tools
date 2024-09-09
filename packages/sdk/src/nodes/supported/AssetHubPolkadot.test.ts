/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi } from 'vitest'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import { Extrinsic, PolkadotXCMTransferInput } from '../../types'
import { ApiPromise } from '@polkadot/api'
import { getNode } from '../../utils'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
}))

vi.mock('../polkadotXcm', async importOriginal => {
  const actual: any = await importOriginal()
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

vi.mock('../../pallets/assets', () => ({
  getOtherAssets: vi.fn(),
  getParaId: vi.fn()
}))

const mockInput = {
  api: {
    createType: vi.fn().mockReturnValue({
      toHex: vi.fn().mockReturnValue('0x123')
    })
  } as unknown as ApiPromise,
  currencySymbol: 'DOT',
  currencySelection: {},
  currencyId: '0',
  scenario: 'ParaToRelay',
  header: {},
  addressSelection: {},
  paraIdTo: 1001,
  amount: '1000',
  address: 'address'
} as PolkadotXCMTransferInput

describe('handleBridgeTransfer', () => {
  it('should process a valid DOT transfer to Polkadot', async () => {
    const assetHub = getNode('AssetHubPolkadot')

    const mockResult = {} as Extrinsic

    vi.mocked(PolkadotXCMTransferImpl.transferPolkadotXCM).mockResolvedValue(mockResult)

    await expect(assetHub.handleBridgeTransfer(mockInput, 'Polkadot')).resolves.toStrictEqual({})
    expect(PolkadotXCMTransferImpl.transferPolkadotXCM).toHaveBeenCalledTimes(1)
  })

  it('throws an error for unsupported currency', () => {
    const assetHub = getNode('AssetHubPolkadot')
    const input = {
      ...mockInput,
      currencySymbol: 'UNKNOWN'
    }
    expect(() => assetHub.handleBridgeTransfer(input, 'Kusama')).toThrowError(InvalidCurrencyError)
  })
})

describe('transferPolkadotXCM', () => {
  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubPolkadot')
    const input = {
      ...mockInput,
      currencySymbol: 'DOT',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Acala'
    } as PolkadotXCMTransferInput

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubPolkadot')
    const input = {
      ...mockInput,
      currencySymbol: 'KSM',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Acala'
    } as PolkadotXCMTransferInput

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })
})
