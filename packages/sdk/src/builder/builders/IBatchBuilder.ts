import type { Extrinsic, TBatchOptions } from '../../types'
import type { GeneralBuilder } from './Builder'

export interface IAddToBatchBuilder {
  addToBatch(): GeneralBuilder
}

export interface IBuildBatchBuilder {
  buildBatch(options?: TBatchOptions): Promise<Extrinsic>
}
