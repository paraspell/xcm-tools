import { useLocation } from 'react-router';

export const useLocationApiKey = () => {
  const state: unknown = useLocation().state;
  return typeof state === 'object' &&
    state !== null &&
    'apiKey' in state &&
    typeof state.apiKey === 'string'
    ? state.apiKey
    : undefined;
};
