import type { InstancedMesh, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { LineCurve3, TubeGeometry } from 'three';

import type { Message } from './LineBetween.types';

export const MIN_SPHERE_SIZE = 0.05;
export const MAX_SPHERE_SIZE = 1;
export const MAX_LINE_WIDTH = 0.5;
export const BASE_SPAWN_RATE = 0.05;
export const SPAWN_RATE_MULTIPLIER = 2;
export const MIN_MSG_SPEED = 0.1;
export const MAX_MSG_SPEED = 0.4;
export const MAX_INSTANCES = 1000;
export const CURVE_SEGMENTS = 12;
export const TUBE_RADIAL_SEGMENTS = 6;

export function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b);
}

export function computeSphereSize(lineWidth: number) {
  return clamp(lineWidth * 0.6, MIN_SPHERE_SIZE, MAX_SPHERE_SIZE);
}

export function computeMessageSpeed(lineWidth: number) {
  return MIN_MSG_SPEED + (lineWidth / MAX_LINE_WIDTH) * (MAX_MSG_SPEED - MIN_MSG_SPEED);
}

export function pickLineColor(
  isHighlighted: boolean,
  isSelected: boolean,
  isSecondary: boolean,
  colors: { primary?: string; highlighted?: string; secondary?: string; selected?: string }
) {
  if (isSelected) return colors.selected ?? '#F03E3E';
  if (isHighlighted) return colors.highlighted ?? '#364FC7';
  if (isSecondary) return colors.secondary ?? '#C2255C';
  return colors.primary ?? '#2B8A3E';
}

export function ensureOrUpdateCurve(
  curveRef: React.MutableRefObject<LineCurve3 | null>,
  start: Vector3,
  end: Vector3
) {
  if (!curveRef.current) {
    curveRef.current = new LineCurve3(start.clone(), end.clone());
  } else {
    curveRef.current.v1.copy(start);
    curveRef.current.v2.copy(end);
  }
}

export function ensureTubeGeometry(mesh: Mesh, curve: LineCurve3, lineWidth: number) {
  const geom = new TubeGeometry(curve, CURVE_SEGMENTS, lineWidth, TUBE_RADIAL_SEGMENTS, false);
  mesh.geometry.dispose();
  mesh.geometry = geom;
}

export function setLineMaterial(mat: MeshStandardMaterial, color: string) {
  mat.color.set(color);
  mat.emissive.set(color);
  mat.transparent = true;
  mat.opacity = 0.3;
}

export function tickMessages(messages: Message[], delta: number) {
  for (const m of messages) m.t += delta * m.speed * m.direction;
  return messages.filter(m => m.t >= 0 && m.t <= 1);
}

export function spawnIfDue(
  nowSec: number,
  nextSpawnTimeRef: React.MutableRefObject<number>,
  lineWidth: number,
  messageIdRef: React.MutableRefObject<number>,
  messages: Message[],
  messageSpeedBase: number
) {
  if (nowSec < nextSpawnTimeRef.current) return;

  const spawnRate = BASE_SPAWN_RATE + lineWidth * SPAWN_RATE_MULTIPLIER;
  const avgInterval = 1 / spawnRate;
  const nextInterval = avgInterval * (0.5 + Math.random());
  nextSpawnTimeRef.current = nowSec + nextInterval;

  const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  const speed = messageSpeedBase * (0.8 + 0.4 * Math.random());

  const newMsg: Message = {
    id: messageIdRef.current++,
    t: direction === 1 ? 0 : 1,
    direction,
    speed
  };

  messages.push(newMsg);
  if (messages.length > MAX_INSTANCES) messages.shift();
}

export function updateInstancesFromMessages(
  curve: LineCurve3,
  messages: Message[],
  sphereMesh: InstancedMesh,
  dummy: Object3D,
  target: Vector3,
  sphereSize: number
) {
  messages.forEach((m, i) => {
    const t = m.t;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    dummy.position.copy(pos);
    target.copy(pos).add(tangent);
    dummy.lookAt(target);
    dummy.scale.set(sphereSize, sphereSize, sphereSize);
    dummy.updateMatrix();

    sphereMesh.setMatrixAt(i, dummy.matrix);
  });

  sphereMesh.count = messages.length;
  sphereMesh.instanceMatrix.needsUpdate = true;
}
