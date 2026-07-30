import { ParaSpellError, type TChain } from '@paraspell/sdk-common'

export class MissingExecutionFeeError<TCustomChain extends string = never> extends ParaSpellError {
  readonly chain: TChain | TCustomChain

  constructor(chain: TChain | TCustomChain) {
    super(`Could not determine execution fee for ${chain}`)
    this.chain = chain
  }
}
