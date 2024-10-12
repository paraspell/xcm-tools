import { nodes } from '../maps/consts'
import type { TNode } from '../types'

/**
 * Retrieves the node instance for a given node.
 *
 * @param node - The node identifier.
 * @returns The node instance
 */
export const getNode = <T extends TNode>(node: T): (typeof nodes)[T] => nodes[node]
