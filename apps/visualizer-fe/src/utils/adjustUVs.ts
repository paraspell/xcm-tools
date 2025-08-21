import type { SphereGeometry } from 'three';

export const adjustUVs = (geometry: SphereGeometry, scaleFactor: number) => {
  const uvs = geometry.attributes.uv;
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, (uvs.getX(i) - 0.5) * scaleFactor + 0.5);
    uvs.setY(i, (uvs.getY(i) - 0.5) * scaleFactor + 0.5);
  }
  geometry.attributes.uv.needsUpdate = true;
};
