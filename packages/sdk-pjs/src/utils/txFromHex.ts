/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import { compactToU8a, u8aConcat, u8aEq } from '@polkadot/util'

import type { Extrinsic, TPjsApi } from '../types'

export const txFromHex = (api: TPjsApi, hex: string): Extrinsic => {
  // Try as full extrinsic
  try {
    const tx = api.tx(hex)
    if (tx.toHex() === hex) return tx
  } catch {
    // Not a valid extrinsic, try other formats
  }

  // Try as Call
  try {
    const call: any = api.createType('Call', hex)
    const callHex = call.toHex()

    if (callHex === hex) {
      const { method, section } = api.registry.findMetaCall(call.callIndex)
      return api.tx[section][method](...call.args)
    }

    if (hex.startsWith(callHex)) {
      // Try as un-prefixed ExtrinsicPayload
      const prefixed = u8aConcat(compactToU8a(call.encodedLength), hex)
      const payload: any = api.createType('ExtrinsicPayload', prefixed)

      if (u8aEq(payload.toU8a(), prefixed)) {
        const payloadCall: any = api.createType('Call', payload.method.toHex())
        const { method, section } = api.registry.findMetaCall(payloadCall.callIndex)
        return api.tx[section][method](...payloadCall.args)
      }
    }
  } catch {
    // Not a valid call, try as payload
  }

  // Final attempt: try as prefixed ExtrinsicPayload
  const payload: any = api.createType('ExtrinsicPayload', hex)

  if (payload.toHex() !== hex) {
    throw new UnsupportedOperationError(
      'Unable to decode hex as Extrinsic, Call, or ExtrinsicPayload'
    )
  }

  const call: any = api.createType('Call', payload.method.toHex())
  const { method, section } = api.registry.findMetaCall(call.callIndex)
  return api.tx[section][method](...call.args)
}
