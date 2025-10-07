import type { ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';

import type { LiveXcmMsg } from '../../types';
import { connectSocket, disconnectSocket, setSocketHandler } from '../../utils/websocket';

interface LiveDataContextType {
  liveData: LiveXcmMsg[];
  clearLiveData: () => void;
  dequeueOne: () => LiveXcmMsg | undefined;
  liveDataEnabled: boolean;
  setLiveDataEnabled: (enabled: boolean) => void;
  getQueueForConnection: (key: string) => LiveXcmMsg[];
  makeConnKey: (ecosystem: string, a: number, b: number) => string;
}

export const LiveDataContext = createContext<LiveDataContextType | null>(null);

export const makeConnKey = (ecosystem: string, a: number, b: number) =>
  `${ecosystem.toLowerCase()}:${Math.min(a, b)}-${Math.max(a, b)}`;

export default function LiveDataProvider({ children }: { children: ReactNode }) {
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);
  const [liveData, setLiveData] = useState<LiveXcmMsg[]>([]);

  const maxQueue = 100;
  const perKeyRef = useRef<Map<string, LiveXcmMsg[]>>(new Map());

  const getQueueForConnection = (key: string) => {
    const arr = perKeyRef.current.get(key);
    return arr ?? [];
  };

  const clearLiveData = () => setLiveData([]);
  const dequeueOne = () => {
    let out: LiveXcmMsg | undefined;
    setLiveData(prev => {
      if (!prev.length) return prev;
      [out, ...prev] = prev;
      return prev;
    });
    return out;
  };

  // register socket handler
  useEffect(() => {
    setSocketHandler((msg: LiveXcmMsg) => {
      setLiveData(prev => {
        // update existing messages
        const idx = prev.findIndex(x => x.hash === msg.hash);
        if (idx !== -1) {
          const current = prev[idx];
          const next = prev.slice();
          next[idx] = { ...current, ...msg };
          return next;
        }

        if (prev.length >= maxQueue) {
          return [...prev.slice(1), msg];
        }
        return [...prev, msg];
      });

      // Per-connection queue
      const key = makeConnKey(String(msg.ecosystem), Number(msg.from), Number(msg.to));
      const m = perKeyRef.current;
      const arr = m.get(key) ?? [];
      arr.push(msg);
      if (arr.length > maxQueue) arr.shift();
      m.set(key, arr);
    });
  }, []);

  // handle connection on toggle
  useEffect(() => {
    if (liveDataEnabled) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [liveDataEnabled]);

  return (
    <LiveDataContext.Provider
      value={{
        liveDataEnabled,
        setLiveDataEnabled,
        liveData,
        clearLiveData,
        dequeueOne,
        getQueueForConnection,
        makeConnKey
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
}
