import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import type { InstancedMesh, LineCurve3, Mesh, MeshStandardMaterial } from 'three';
import { DoubleSide, Object3D, Vector3 } from 'three';

import { useLiveData } from '../../context/LiveData/useLiveData';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { Message } from './LineBetween.types';
import {
  computeMessageSpeed,
  computeSphereSize,
  ensureOrUpdateCurve,
  ensureTubeGeometry,
  MAX_INSTANCES,
  pickLineColor,
  setLineMaterial,
  spawnIfDue,
  tickMessages,
  updateInstancesFromMessages
} from './LineBetween.utils';

type Props = {
  startObject: Object3D | null;
  endObject: Object3D | null;
  lineWidth: number;
  isHighlighted: boolean;
  isSelected: boolean;
  isSecondary: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  ecosystem: string;
  fromParaId: number;
  toParaId: number;
};

export const LineBetween: FC<Props> = ({
  startObject,
  endObject,
  lineWidth,
  isHighlighted,
  isSelected,
  isSecondary,
  onClick,
  ecosystem,
  fromParaId,
  toParaId
}) => {
  const {
    primaryChannelColor,
    highlightedChannelColor,
    secondaryChannelColor,
    selectedChannelColor
  } = useSelectedParachain();
  const { liveDataEnabled, getQueueForConnection, makeConnKey } = useLiveData();

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const curveRef = useRef<LineCurve3 | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const messageIdRef = useRef<number>(0);
  const nextSpawnTimeRef = useRef<number>(0);
  const sphereMeshRef = useRef<InstancedMesh>(null);
  const dummyRef = useRef(new Object3D());
  const targetRef = useRef(new Vector3());
  const prevStartRef = useRef<Vector3 | null>(null);
  const prevEndRef = useRef<Vector3 | null>(null);
  const liveLastIdxRef = useRef(0);
  const liveSeenRef = useRef<Set<string>>(new Set());
  const sphereSize = useMemo(() => computeSphereSize(lineWidth), [lineWidth]);
  const messageSpeed = useMemo(() => computeMessageSpeed(lineWidth), [lineWidth]);

  const color = useMemo(
    () =>
      pickLineColor(isHighlighted, isSelected, isSecondary, {
        primary: primaryChannelColor,
        highlighted: highlightedChannelColor,
        secondary: secondaryChannelColor,
        selected: selectedChannelColor
      }),
    [
      isHighlighted,
      isSelected,
      isSecondary,
      primaryChannelColor,
      highlightedChannelColor,
      secondaryChannelColor,
      selectedChannelColor
    ]
  );

  const connKey = useMemo(
    () => makeConnKey(ecosystem, fromParaId, toParaId),
    [ecosystem, fromParaId, toParaId]
  );

  // Main loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // keep sync
    if (startObject && endObject && meshRef.current) {
      const start = startObject.position;
      const end = endObject.position;
      const changed =
        !prevStartRef.current ||
        !prevEndRef.current ||
        !prevStartRef.current.equals(start) ||
        !prevEndRef.current.equals(end);

      if (changed) {
        prevStartRef.current = start.clone();
        prevEndRef.current = end.clone();
        ensureOrUpdateCurve(curveRef, start, end);
        ensureTubeGeometry(meshRef.current, curveRef.current!, lineWidth);
      }
      if (materialRef.current) setLineMaterial(materialRef.current, color);
    }

    if (!curveRef.current || !sphereMeshRef.current) return;

    messagesRef.current = tickMessages(messagesRef.current, delta);

    // Live data
    if (liveDataEnabled) {
      // get messages for this line
      const q = getQueueForConnection(connKey);
      const startIdx = liveLastIdxRef.current;
      const endIdx = q.length;

      for (let i = startIdx; i < endIdx; i++) {
        const evt = q[i];
        if (!evt?.hash) continue;
        if (liveSeenRef.current.has(evt.hash)) continue;
        liveSeenRef.current.add(evt.hash);

        // decide direction
        const dir: 1 | -1 = evt.from === fromParaId && evt.to === toParaId ? 1 : -1;

        messagesRef.current.push({
          id: messageIdRef.current++,
          t: dir === 1 ? 0 : 1,
          direction: dir,
          speed: messageSpeed
        });

        if (messagesRef.current.length > MAX_INSTANCES) messagesRef.current.shift();
      }
      liveLastIdxRef.current = endIdx;
    } else {
      // Random mode
      spawnIfDue(
        time,
        nextSpawnTimeRef,
        lineWidth,
        messageIdRef,
        messagesRef.current,
        messageSpeed
      );
    }

    // draw message instances
    updateInstancesFromMessages(
      curveRef.current,
      messagesRef.current,
      sphereMeshRef.current,
      dummyRef.current,
      targetRef.current,
      sphereSize
    );
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick}>
        <bufferGeometry />
        <meshStandardMaterial
          ref={materialRef}
          toneMapped
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.2}
          side={DoubleSide}
        />
      </mesh>
      <instancedMesh ref={sphereMeshRef} args={[undefined, undefined, MAX_INSTANCES]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="white" wireframe emissive="white" emissiveIntensity={0.5} />
      </instancedMesh>
    </group>
  );
};
