import { getParaId } from '@paraspell/sdk-core'
import { Context } from '@snowbridge/api'
import type { Environment } from '@snowbridge/base-types'
import type { AbstractProvider } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createContext } from './createContext'

vi.mock('@snowbridge/api', () => {
  const Context = vi.fn(
    class {
      setEthProvider = vi.fn()
    }
  )

  return { Context }
})

describe('createContext', () => {
  const mockEnv = {
    name: 'test-env',
    ethChainId: 1
  } as Environment

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Context with execution URL when provider is string', () => {
    const executionUrl = 'http://execution-url.test'

    createContext(executionUrl, mockEnv)

    expect(Context).toHaveBeenCalledOnce()

    const args = vi.mocked(Context).mock.calls[0][0]

    expect(args).toMatchObject({
      ...mockEnv,
      assetOverrides: {
        '3369': [
          {
            token: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
            symbol: 'MYTH',
            decimals: 18,
            isSufficient: true
          }
        ]
      },
      precompiles: {
        '2004': '0x000000000000000000000000000000000000081A'
      },
      ethereumChains: {
        [mockEnv.ethChainId.toString()]: executionUrl,
        [getParaId('Moonbeam')]: 'https://rpc.api.moonbeam.network'
      }
    })
  })

  it('sets provider manually when executionUrl is AbstractProvider', () => {
    const provider = {} as unknown as AbstractProvider

    createContext(provider, mockEnv)

    const mockInstance = vi.mocked(Context).mock.instances[0]

    const spy = vi.spyOn(mockInstance, 'setEthProvider')

    expect(Context).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(mockEnv.ethChainId, provider)
  })
})
