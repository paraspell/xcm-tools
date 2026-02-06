import { TLocation } from '@paraspell/sdk-common'
import { TAssetInfo } from '../src'

export type TRuntimeApi = 'dryRunApi' | 'xcmPaymentApi'

export type TAssetInfoNoLoc = Omit<TAssetInfo, 'location'> & { location?: TLocation }
