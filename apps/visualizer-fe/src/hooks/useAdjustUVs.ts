import type { DependencyList, RefObject } from 'react';
import { useEffect } from 'react';
import type { Mesh, SphereGeometry } from 'three';

import { adjustUVs, adjustUVXAxis } from '../utils/adjustUVs';

export const useAdjustUVs = (
  meshRef: RefObject<Mesh<SphereGeometry> | null>,
  scaleX: number,
  scale: number,
  deps: DependencyList = []
) => {
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      const originalUVs = geometry.attributes.uv.array.slice();

      adjustUVXAxis(geometry, scaleX);
      adjustUVs(geometry, scale);

      return () => {
        geometry.attributes.uv.array.set(originalUVs);
        geometry.attributes.uv.needsUpdate = true;
      };
    }
  }, deps);
};
