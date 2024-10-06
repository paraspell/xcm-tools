import { nodes } from '../maps/consts'
import type { TNode } from '../types'

export const getNode = <T extends TNode>(node: T): (typeof nodes)[T] => nodes[node]
