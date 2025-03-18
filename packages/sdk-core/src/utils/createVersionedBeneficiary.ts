import { addXcmVersionHeader } from '../pallets/xcmPallet/utils'
import type { TCreateBeneficiaryOptions } from '../types'
import { createBeneficiaryMultiLocation } from './multiLocation'

export const createVersionedBeneficiary = <TApi, TRes>(
  options: TCreateBeneficiaryOptions<TApi, TRes>
) => {
  const { version } = options
  const multiLocation = createBeneficiaryMultiLocation(options)
  return addXcmVersionHeader(multiLocation, version)
}
