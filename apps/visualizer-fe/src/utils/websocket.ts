import { io } from 'socket.io-client';

import type { LiveXcmMsg } from '../types';

const URL = import.meta.env.VITE_SOCKET_URL as string;

const socket = io(URL, {
  path: '/socket.io',
  transports: ['websocket'],
  autoConnect: false
});

let currentHandler: ((data: LiveXcmMsg) => void) | null = null;
const EVENT = 'liveXcmData';

export const setSocketHandler = (handler: (data: LiveXcmMsg) => void) => {
  if (currentHandler) socket.off(EVENT, currentHandler);
  currentHandler = handler;
  socket.on(EVENT, currentHandler);
};

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const isSocketConnected = () => {
  return socket.connected;
};
