import { createContext } from 'react';

import type { TApiType } from '../../types';

type SelectedApiType = {
  selectedApiType?: TApiType;
  setSelectedApiType: (apiType?: TApiType) => void;
};

export const SelectedApiTypeContext = createContext<SelectedApiType | null>(
  null,
);
