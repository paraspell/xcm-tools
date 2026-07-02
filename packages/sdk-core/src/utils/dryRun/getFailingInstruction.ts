export const getFailingInstruction = (
  message: unknown,
  failureIndex?: number
): object | undefined => {
  if (failureIndex === undefined || typeof message !== 'object' || message === null) {
    return undefined
  }

  let instructions: unknown = message
  if (!Array.isArray(instructions)) {
    instructions =
      'value' in message && Array.isArray(message.value) ? message.value : Object.values(message)[0]
  }

  if (!Array.isArray(instructions)) return undefined

  const instruction: unknown = instructions[failureIndex]
  return typeof instruction === 'object' && instruction !== null ? instruction : undefined
}
