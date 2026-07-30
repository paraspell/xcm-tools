import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { createBuyExecution } from '../../../pallets/polkadotXcm'
import type { TCreateExecutionProgramOptions, TSetAppendixInstruction } from '../../../types'

const isSetAppendix = (instruction: unknown): instruction is TSetAppendixInstruction =>
  typeof instruction === 'object' &&
  instruction !== null &&
  'SetAppendix' in instruction &&
  Array.isArray(instruction.SetAppendix)

const isDepositAsset = (instruction: unknown) =>
  typeof instruction === 'object' && instruction !== null && 'DepositAsset' in instruction

const createRefundDeposit = (beneficiary: TLocation) => ({
  DepositAsset: {
    assets: { Wild: 'All' },
    beneficiary
  }
})

export const withV5RefundAppendix = (version: Version, xcm: unknown[], beneficiary: TLocation) => {
  if (version < Version.V5) return xcm

  let existingAppendix: unknown[] = []
  const xcmWithoutAppendix: unknown[] = []

  for (const instruction of xcm) {
    if (isSetAppendix(instruction)) {
      existingAppendix = instruction.SetAppendix
    } else {
      xcmWithoutAppendix.push(instruction)
    }
  }

  const appendix = [...existingAppendix]
  const firstDepositIndex = appendix.findIndex(isDepositAsset)
  const refund = { RefundSurplus: undefined }

  if (firstDepositIndex === -1) {
    appendix.push(refund, createRefundDeposit(beneficiary))
  } else {
    appendix.splice(firstDepositIndex, 0, refund)
  }

  return [{ SetAppendix: appendix }, ...xcmWithoutAppendix]
}

export const createExecutionProgram = ({
  version,
  feeAsset,
  executionFee,
  legacyFeeAsset = feeAsset,
  xcm,
  refundBeneficiary
}: TCreateExecutionProgramOptions) => {
  if (!feeAsset) return xcm

  if (version < Version.V5) {
    return [...createBuyExecution(legacyFeeAsset ?? feeAsset), ...xcm]
  }

  if (executionFee === undefined) {
    return [
      ...createBuyExecution(legacyFeeAsset ?? feeAsset),
      ...withV5RefundAppendix(version, xcm, refundBeneficiary)
    ]
  }

  const paidAsset = {
    ...feeAsset,
    fun: {
      Fungible: executionFee
    }
  }

  return [
    {
      PayFees: {
        asset: paidAsset
      }
    },
    ...withV5RefundAppendix(version, xcm, refundBeneficiary)
  ]
}
