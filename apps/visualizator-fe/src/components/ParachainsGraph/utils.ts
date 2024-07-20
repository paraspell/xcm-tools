import { Vector3 } from 'three';
import { POLKADOT_NODE_NAMES } from '../../consts';

export const getParachainPosition = (index: number) => {
  const radius = 6;
  const totalParachains = POLKADOT_NODE_NAMES.length;
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
