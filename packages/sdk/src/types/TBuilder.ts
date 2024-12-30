import type { IFinalBuilderWithOptions as OriginalIFinalBuilderWithOptions } from '@paraspell/sdk-core'
import type { TPapiApi, TPapiTransaction } from '../types'

export type IFinalBuilderWithOptions = OriginalIFinalBuilderWithOptions<TPapiApi, TPapiTransaction>
