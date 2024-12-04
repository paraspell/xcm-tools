import type { TPapiApi, TPapiTransaction } from '../types'
import type { IUseKeepAliveFinalBuilder as OriginalIUseKeepAliveFinalBuilder } from '../../types'

export type IUseKeepAliveFinalBuilder = OriginalIUseKeepAliveFinalBuilder<
  TPapiApi,
  TPapiTransaction
>
