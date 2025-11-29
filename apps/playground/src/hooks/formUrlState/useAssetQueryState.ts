import { useContext } from 'react';

import { AssetQueryStateContext } from '../../providers/AssetQueryState/AssetQueryStateContext';

export const useAssetQueryState = () => {
  const context = useContext(AssetQueryStateContext);

  if (!context) {
    throw new Error(
      'useAssetQueryState must be used within a AssetQueryStateProvider',
    );
  }

  return context;
};
