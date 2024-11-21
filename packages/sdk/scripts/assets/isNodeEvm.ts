import type { TPjsApi } from '../../src/pjs'

export const isNodeEvm = (api: TPjsApi) => {
  const types = api.runtimeMetadata.asLatest.lookup.types
  const type = types[0]?.type.path.toJSON() as string[]
  return type.includes('AccountId20')
}
