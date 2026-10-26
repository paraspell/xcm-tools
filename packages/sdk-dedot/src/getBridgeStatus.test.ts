// Regression test for C-W4-1: DedotApi.getBridgeStatus must return the string
// status ('Normal' | 'Halted'), like PAPI (returns .type) and PJS (returns
// .toPrimitive()), so the shared Snowbridge guard comparing to 'Normal' works.
// Adapted from the PoC package (w4-crosscutting/poc-cw41); assertions inverted
// to the CORRECT behaviour.
import { describe, it, expect, vi } from 'vitest'
import DedotApi from './DedotApi'
import { getBridgeStatus } from '../../sdk-core/src/transfer/getBridgeStatus'

describe('C-W4-1 regression: Dedot getBridgeStatus returns the string status', () => {
  it('returns the string "Normal" when the bridge is Normal', async () => {
    const dedotApi = new DedotApi()
    const operatingMode = vi
      .fn()
      .mockResolvedValue({ type: 'Normal', value: undefined })
    ;(dedotApi as unknown as { _api: unknown })._api = {
      query: { ethereumOutboundQueue: { operatingMode } },
    }
    const result = await dedotApi.getBridgeStatus()
    expect(operatingMode).toHaveBeenCalled()
    expect(result).toBe('Normal')
    // The shared guard is: if (bridgeStatus !== 'Normal') throw new BridgeHaltedError()
    expect((result as unknown) !== 'Normal').toBe(false)
  })

  it('returns the string "Halted" when the bridge is Halted', async () => {
    const dedotApi = new DedotApi()
    const operatingMode = vi
      .fn()
      .mockResolvedValue({ type: 'Halted', value: undefined })
    ;(dedotApi as unknown as { _api: unknown })._api = {
      query: { ethereumOutboundQueue: { operatingMode } },
    }
    const result = await dedotApi.getBridgeStatus()
    expect(result).toBe('Halted')
    expect((result as unknown) !== 'Normal').toBe(true)
  })

  it('E2E: real core wrapper wired to real Dedot impl -> guard does NOT throw on a Normal bridge', async () => {
    const dedotApi = new DedotApi()
    const operatingMode = vi
      .fn()
      .mockResolvedValue({ type: 'Normal', value: undefined })
    ;(dedotApi as unknown as { _api: unknown })._api = {
      query: { ethereumOutboundQueue: { operatingMode } },
    }
    vi.spyOn(dedotApi, 'init').mockResolvedValue(undefined)
    vi.spyOn(dedotApi, 'disconnect').mockResolvedValue(undefined)
    const status = await getBridgeStatus(dedotApi as never)
    expect(status).toBe('Normal')
    const wouldThrow = (status as unknown) !== 'Normal'
    expect(wouldThrow).toBe(false)
  })
})
