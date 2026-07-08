import { getParaId, isSubstrateChain } from '@paraspell/sdk';

export const resolveParaId = (label?: string, total?: string): number | undefined => {
  if (!label || (total && label.includes(total)) || !isSubstrateChain(label)) return undefined;
  return getParaId(label);
};
