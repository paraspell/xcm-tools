import { useContext } from 'react';

import { DeviceTypeContext } from './DeviceTypeContext';

export const useDeviceType = () => {
  const context = useContext(DeviceTypeContext);

  if (!context) {
    throw new Error('useDeviceType must be used within DeviceTypeProvider');
  }

  return context;
};
