import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { getParaId } from '../nodes/config'
import { determineRelayChain } from '../utils'
import { createXcmIdentityCall } from './createXcmIdentityCall'

vi.mock('../utils', () => ({
  determineRelayChain: vi.fn(),
  createX1Payload: vi.fn().mockReturnValue({ MockedPayload: true })
}))

vi.mock('../nodes/config', () => ({
  getParaId: vi.fn().mockReturnValue(2000)
}))

describe('createXcmIdentityCall', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockPeopleApi: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mockPeopleApi = {
      init: vi.fn().mockResolvedValue(undefined),
      callTxMethod: vi.fn().mockImplementation(({ _module, _section, _parameters }) => {
        return Promise.resolve('')
      }),
      encodeTx: vi.fn().mockImplementation(async (call: unknown) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `encoded::${await call}`
      }),
      createRaw: vi.fn().mockImplementation((val: string) => ({ Raw: val }))
    } as unknown as IPolkadotApi<unknown, unknown>
    mockApi = {
      init: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockReturnValue(mockPeopleApi),
      callTxMethod: vi.fn().mockResolvedValue('finalTxMethodResult')
    } as unknown as IPolkadotApi<unknown, unknown>
  })

  it('should create XCM identity calls for AssetHubPolkadot to PeoplePolkadot, with xcmFee given', async () => {
    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    const identity = { display: 'Alice', legal: 'Alice Legal', web: 'https://example.com' }

    const initSpy = vi.spyOn(mockApi, 'init')
    const callTxMethodSpy = vi.spyOn(mockApi, 'callTxMethod')
    const peopleInitSpy = vi.spyOn(mockPeopleApi, 'init')
    const peopleCallTxMethodSpy = vi.spyOn(mockPeopleApi, 'callTxMethod')

    const result = await createXcmIdentityCall({
      api: mockApi,
      from: 'AssetHubPolkadot',
      xcmFee: 100_000_000_000n,
      identity,
      regIndex: 1,
      maxRegistrarFee: 500_000_000_000n
    })
    expect(determineRelayChain).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(getParaId).toHaveBeenCalledWith('PeoplePolkadot')
    expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(peopleInitSpy).toHaveBeenCalledWith('PeoplePolkadot')
    expect(callTxMethodSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: 'send',
      parameters: expect.objectContaining({
        dest: expect.objectContaining({
          V4: {
            parents: 1,
            interior: { MockedPayload: true }
          }
        }),
        message: expect.any(Object)
      })
    })
    expect(result).toBe('finalTxMethodResult')
    expect(peopleCallTxMethodSpy).toHaveBeenCalledWith({
      module: 'Identity',
      section: 'set_identity',
      parameters: expect.objectContaining({
        info: {
          display: { Raw: 'Alice' },
          legal: { Raw: 'Alice Legal' },
          web: { Raw: 'https://example.com' },
          matrix: { None: null },
          email: { None: null },
          image: { None: null },
          twitter: { None: null },
          github: { None: null },
          discord: { None: null }
        }
      })
    })
    expect(peopleCallTxMethodSpy).toHaveBeenCalledWith({
      module: 'Identity',
      section: 'request_judgement',
      parameters: {
        reg_index: 1,
        max_fee: 500_000_000_000n
      }
    })
  })

  it('should create XCM identity calls for AssetHubKusama to PeopleKusama, with fallback xcmFee', async () => {
    vi.mocked(determineRelayChain).mockReturnValue('Kusama')

    const spy = vi.spyOn(mockApi, 'callTxMethod')

    const result = await createXcmIdentityCall({
      api: mockApi,
      from: 'AssetHubKusama',
      xcmFee: undefined,
      identity: {},
      regIndex: 10,
      maxRegistrarFee: 123_456_789n
    })
    expect(determineRelayChain).toHaveBeenCalledWith('AssetHubKusama')
    expect(getParaId).toHaveBeenCalledWith('PeopleKusama')
    expect(spy).toHaveBeenCalled()
    expect(result).toBe('finalTxMethodResult')
  })
})
