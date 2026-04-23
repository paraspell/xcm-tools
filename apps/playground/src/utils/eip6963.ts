import { createStore } from 'mipd';

const store = typeof window === 'undefined' ? undefined : createStore();

export const requestEip6963Providers = () => store?.getProviders() ?? [];
