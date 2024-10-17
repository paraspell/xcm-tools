import { nodes } from '../maps/consts'

/**
 * Retrieves the node instance for a given node.
 *
 * @param node - The node identifier.
 * @returns The node instance
 */
export const getNode = <TApi, TRes, T extends keyof ReturnType<typeof nodes>>(
  node: T
): ReturnType<typeof nodes<TApi, TRes>>[T] => {
  const nodeMap = nodes<TApi, TRes>()
  return nodeMap[node]
}
