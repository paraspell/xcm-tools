import type { TApiType } from '../../types'
import type { GeneralBuilder } from './Builder'

export interface IAddToBatchBuilder<TApi extends TApiType> {
  addToBatch(): GeneralBuilder<TApi>
}
