import type { DomainSnapshotAdapter, MatcherState } from 'vitest'
import { expect, Snapshots } from 'vitest'

const FEE_TOLERANCE_PERCENT = 1n

const FEE_VALUE =
  /("fees": \{\s*"fun": \{\s*(?:"type": "Fungible",\s*"value"|"fungible"): "?)(\d+)/g

const isWithinTolerance = (actual: bigint, expected: bigint) => {
  const diff = actual > expected ? actual - expected : expected - actual
  return diff * 100n <= expected * FEE_TOLERANCE_PERCENT
}

const createAdapter = (
  stringify: MatcherState['utils']['stringify']
): DomainSnapshotAdapter<string, string> => ({
  name: 'feeTolerant',
  capture: received =>
    `\n${stringify(received, Infinity, { printBasicPrototype: false, maxLength: Infinity })}\n`,
  render: captured => captured,
  parseExpected: expected => expected,
  match: (actual, expected) => {
    const expectedFees = [...expected.matchAll(FEE_VALUE)].map(([, , fee]) => BigInt(fee))
    const resolved = actual.replace(FEE_VALUE, (match, prefix: string, fee: string) => {
      const expectedFee = expectedFees.shift()
      return expectedFee !== undefined && isWithinTolerance(BigInt(fee), expectedFee)
        ? `${prefix}${expectedFee}`
        : match
    })
    return { pass: resolved.trim() === expected.trim(), resolved, expected }
  }
})

expect.extend({
  toMatchTxSnapshot(received: unknown) {
    return Snapshots.toMatchDomainSnapshot.call(this, createAdapter(this.utils.stringify), received)
  }
})

export const createTxValidator =
  <TRes, TSigner>(
    serializeTx: (tx: TRes) => unknown,
    signTx?: (tx: TRes, signer: TSigner) => Promise<unknown>
  ) =>
  async (tx: TRes, signer: TSigner) => {
    expect(tx).toBeDefined()
    if (signTx) expect(await signTx(tx, signer)).toBeDefined()
    expect(serializeTx(tx)).toMatchTxSnapshot()
  }

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>> {
    toMatchTxSnapshot: () => R
  }
}
