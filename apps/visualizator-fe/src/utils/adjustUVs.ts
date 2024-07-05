import { SphereGeometry } from 'three';
import { getLogoScaleFactor } from '../components/Parachain/utils';

export const adjustUVs = (geometry: SphereGeometry, node: string) => {
  const uvs = geometry.attributes.uv;
  const scaleFactor = getLogoScaleFactor(node);
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, (uvs.getX(i) - 0.5) * scaleFactor + 0.5);
    uvs.setY(i, (uvs.getY(i) - 0.5) * scaleFactor + 0.5);
  }
  geometry.attributes.uv.needsUpdate = true;
};
