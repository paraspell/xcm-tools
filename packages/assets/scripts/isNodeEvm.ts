import type { ApiPromise } from '@polkadot/api'

export const isNodeEvm = (api: ApiPromise) => {
  const types = api.runtimeMetadata.asLatest.lookup.types
  const type = types[0]?.type.path.toJSON() as string[]
  return type.includes('AccountId20')
}
