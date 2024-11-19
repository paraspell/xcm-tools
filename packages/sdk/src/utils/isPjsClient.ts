export const isPjsClient = (api: unknown): api is { disconnect: () => Promise<void> } => {
  return (
    typeof api === 'object' &&
    api !== null &&
    'disconnect' in api &&
    typeof api.disconnect === 'function'
  )
}
