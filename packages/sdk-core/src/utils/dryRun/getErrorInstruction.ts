import type { TDryRunError } from '../../types'

export const getErrorInstruction = (message: unknown, index?: number): object | undefined => {
  if (index === undefined || typeof message !== 'object' || message === null) {
    return undefined
  }

  let instructions: unknown = message
  if (!Array.isArray(instructions)) {
    instructions =
      'value' in message && Array.isArray(message.value) ? message.value : Object.values(message)[0]
  }

  if (!Array.isArray(instructions)) return undefined

  const instruction: unknown = instructions[index]
  return typeof instruction === 'object' && instruction !== null ? instruction : undefined
}

export const buildDryRunError = (error: TDryRunError, message: unknown): TDryRunError => ({
  ...error,
  instruction: getErrorInstruction(message, error.instructionIndex)
})
