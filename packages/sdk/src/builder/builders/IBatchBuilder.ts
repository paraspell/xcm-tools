import type { GeneralBuilder } from './Builder'

export interface IAddToBatchBuilder<TApi, TRes> {
  addToBatch(): GeneralBuilder<TApi, TRes>
}
