import type { TCreateBeneficiaryOptions } from '../types'
import { addXcmVersionHeader } from './addXcmVersionHeader'
import { createBeneficiaryMultiLocation } from './multiLocation'

export const createBeneficiary = <TApi, TRes>(options: TCreateBeneficiaryOptions<TApi, TRes>) => {
  return createBeneficiaryMultiLocation(options)
}

export const createVersionedBeneficiary = <TApi, TRes>(
  options: TCreateBeneficiaryOptions<TApi, TRes>
) => {
  const { version } = options
  const multiLocation = createBeneficiary(options)
  return addXcmVersionHeader(multiLocation, version)
}
