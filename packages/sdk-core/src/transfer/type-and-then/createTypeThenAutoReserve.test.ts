import { hasDryRunSupport } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TDryRunResult, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { getRelayChainOf } from '../../utils/chain/getRelayChainOf'
import { dryRunInternal } from '../dry-run'
import { createTypeAndThenCall } from './createTypeAndThenCall'
import { createTypeThenAutoReserve } from './createTypeThenAutoReserve'

vi.mock('@paraspell/assets')
vi.mock('../../utils/chain/getRelayChainOf')
vi.mock('./createTypeAndThenCall')
vi.mock('../dry-run/dryRunInternal')
vi.mock('../../utils/assertions')

const mkApi = () => {
  const callTxMethod = vi.fn((_s: TSerializedApiCall) => ({ tx: 'ok' }))
  return { callTxMethod } as unknown as IPolkadotApi<unknown, unknown>
}

describe('createTypeThenAutoReserve', () => {
  const origin = 'Acala'
  const options = {
    api: mkApi(),
    destChain: 'Acala',
    destination: 'Acala',
    address: 'Alice',
    senderAddress: 'Bob',
    currency: { symbol: 'DOT' }
  } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

  const ahCall: TSerializedApiCall = {
    module: 'XcmPallet',
    method: 'transfer_assets_using_type_and_then',
    parameters: { reserve: 'AssetHubPolkadot' }
  }

  const relayCall: TSerializedApiCall = {
    module: 'XcmPallet',
    method: 'transfer_assets_using_type_and_then',
    parameters: { reserve: 'Polkadot' }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
  })

  it('prefers AssetHub when AH dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValueOnce(true).mockReturnValueOnce(true)
    vi.mocked(createTypeAndThenCall).mockResolvedValueOnce(ahCall).mockResolvedValueOnce(relayCall)
    vi.mocked(dryRunInternal).mockResolvedValue({} as TDryRunResult)

    const res = await createTypeThenAutoReserve(origin, options)
    expect(res).toEqual(ahCall)
    expect(createTypeAndThenCall).toHaveBeenCalledWith(origin, options, 'AssetHubPolkadot')
    expect(dryRunInternal).toHaveBeenCalledTimes(1)
  })

  it('uses relay when AH fails but relay succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValueOnce(true).mockReturnValueOnce(true)
    vi.mocked(createTypeAndThenCall).mockResolvedValueOnce(ahCall).mockResolvedValueOnce(relayCall)
    vi.mocked(dryRunInternal)
      .mockResolvedValueOnce({ failureReason: 'Fail' } as TDryRunResult)
      .mockResolvedValueOnce({} as TDryRunResult)

    const res = await createTypeThenAutoReserve(origin, options)
    expect(res).toEqual(relayCall)
    expect(createTypeAndThenCall).toHaveBeenNthCalledWith(1, origin, options, 'AssetHubPolkadot')
    expect(createTypeAndThenCall).toHaveBeenNthCalledWith(2, origin, options, 'Polkadot')
  })

  it('returns AH call when both AH and relay fail dry-run', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValueOnce(true).mockReturnValueOnce(true)
    vi.mocked(createTypeAndThenCall).mockResolvedValueOnce(ahCall).mockResolvedValueOnce(relayCall)
    vi.mocked(dryRunInternal)
      .mockResolvedValueOnce({ failureReason: 'Fail' } as TDryRunResult)
      .mockResolvedValueOnce({ failureReason: 'Fail again' } as TDryRunResult)

    const res = await createTypeThenAutoReserve(origin, options)
    expect(res).toEqual(ahCall)
  })

  it('when dry-run unsupported, return default call', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValueOnce(true).mockReturnValueOnce(false)
    vi.mocked(createTypeAndThenCall).mockResolvedValue(relayCall)

    const res = await createTypeThenAutoReserve(origin, options)
    expect(res).toEqual(relayCall)
    expect(createTypeAndThenCall).toHaveBeenCalledWith(origin, options)
  })

  it('when dry-run unsupported and no reserve, uses default createTypeAndThenCall', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValueOnce(true).mockReturnValueOnce(false)
    const defaultCall: TSerializedApiCall = {
      module: 'XcmPallet',
      method: 'default',
      parameters: {}
    }
    vi.mocked(createTypeAndThenCall).mockResolvedValue(defaultCall)

    const res = await createTypeThenAutoReserve(origin, options)
    expect(res).toEqual(defaultCall)
    expect(createTypeAndThenCall).toHaveBeenCalledWith(origin, options)
  })
})
