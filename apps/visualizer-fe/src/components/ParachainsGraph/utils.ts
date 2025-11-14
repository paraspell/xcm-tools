import type { TRelaychain } from '@paraspell/sdk';
import { Vector3 } from 'three';

import { getChainsByEcosystem } from '../../utils/utils';

export const getParachainPosition = (index: number, ecosystem: TRelaychain) => {
  const radius = 6;
  const totalParachains = getChainsByEcosystem(ecosystem).length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

  const phi = goldenAngle * index; // This spreads out the points along the longitude
  const y = 1 - (2 * index + 1) / totalParachains; // Positions from top to bottom on the Y-axis
  const radiusAtY = radius * Math.sqrt(1 - y * y); // Radius at height y

  return new Vector3(
    radiusAtY * Math.cos(phi), // X coordinate
    radius * y, // Y coordinate
    radiusAtY * Math.sin(phi) // Z coordinate
  );
};
