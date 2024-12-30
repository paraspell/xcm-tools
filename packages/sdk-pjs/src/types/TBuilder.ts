import type { IFinalBuilderWithOptions as OriginalIFinalBuilderWithOptions } from '@paraspell/sdk-core'
import type { Extrinsic, TPjsApi } from '../types'

export type IFinalBuilderWithOptions = OriginalIFinalBuilderWithOptions<TPjsApi, Extrinsic>
