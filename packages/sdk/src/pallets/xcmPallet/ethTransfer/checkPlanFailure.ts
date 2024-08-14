import { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'

export const checkPlanFailure = (plan: SendValidationResult) => {
  if (plan.failure) {
    throw new Error(
      `Failed to validate send: ${plan.failure.errors.map(e => e.message).join('\n\n')}`
    )
  }
}
