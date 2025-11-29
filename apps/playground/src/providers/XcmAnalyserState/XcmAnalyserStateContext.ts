import { createContext } from 'react';

type XcmAnalyserState = {
  input: string;
  setInput: (input: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
};

export const XcmAnalyserStateContext = createContext<XcmAnalyserState | null>(
  null,
);
