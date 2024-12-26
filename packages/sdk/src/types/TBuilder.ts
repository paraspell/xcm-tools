import type { TPapiApi, TPapiTransaction } from '../types'
import type { IUseKeepAliveFinalBuilder as OriginalIUseKeepAliveFinalBuilder } from '@paraspell/sdk-core'

export type IUseKeepAliveFinalBuilder = OriginalIUseKeepAliveFinalBuilder<
  TPapiApi,
  TPapiTransaction
>
