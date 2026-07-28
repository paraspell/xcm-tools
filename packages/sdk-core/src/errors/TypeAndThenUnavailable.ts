import { ParaSpellError } from '@paraspell/sdk-common'

export class TypeAndThenUnavailableError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
