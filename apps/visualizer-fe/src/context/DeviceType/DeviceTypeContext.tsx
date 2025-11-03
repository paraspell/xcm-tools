import { useMediaQuery, useOs } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { createContext } from 'react';

import type { TDeviceInfo } from '../../types';
import { DeviceType } from '../../types';

interface DeviceTypeContextType {
  deviceInfo: TDeviceInfo;
  isMobile: boolean;
  isTouch: boolean;
}

export const DeviceTypeContext = createContext<DeviceTypeContextType | null>(null);

export default function DeviceTypeProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 1024px)', false, { getInitialValueInEffect: false });
  const os = useOs();

  const device = isMobile ? DeviceType.Mobile : DeviceType.Desktop;
  const deviceInfo: TDeviceInfo = { device, os };

  const isTouch = isMobile || os === 'ios' || os === 'android';

  return (
    <DeviceTypeContext.Provider value={{ deviceInfo, isMobile, isTouch }}>
      {children}
    </DeviceTypeContext.Provider>
  );
}
