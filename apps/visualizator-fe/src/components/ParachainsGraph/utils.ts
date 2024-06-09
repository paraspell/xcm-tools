import { Vector3 } from 'three';
import { POLKADOT_NODE_NAMES } from '../../consts';

export const getParachainPosition = (index: number) => {
  const radius = 5;
  const totalParachains = POLKADOT_NODE_NAMES.length;
  // Calculate phi and theta as before
  const phi = Math.PI - Math.acos(-1 + (2 * index) / totalParachains);
  const theta = Math.sqrt(totalParachains * Math.PI) * phi;

  // Rotate the sphere so the top aligns with the Y-axis
  return new Vector3(
    radius * Math.sin(phi) * Math.cos(theta), // X coordinate
    radius * Math.cos(phi), // Y coordinate, becomes the 'top'
    radius * Math.sin(phi) * Math.sin(theta) // Z coordinate
  );
};
