import type { TRelaychain } from '@paraspell/sdk';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame, useLoader } from '@react-three/fiber';
import type { FC } from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Group, Mesh, SphereGeometry } from 'three';
import { Color, TextureLoader } from 'three';

import { useAdjustUVs } from '../../hooks/useAdjustUVs';
import { getRelaychainLogo } from './utils/getRelaychainLogo';

const SCALE_FACTOR = 2.25;
const SCALE_X_FACTOR = 1.8;

type Props = {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  ecosystem: TRelaychain;
  ref: React.RefObject<Group | null>;
  isSelected?: boolean;
};

export const Relaychain: FC<Props> = ({ ref, onClick, ecosystem, isSelected }) => {
  const logo = getRelaychainLogo(ecosystem);
  const texture = useLoader(TextureLoader, logo);
  const sphereRef = useRef<Mesh<SphereGeometry>>(null);
  const groupRef = useRef<Group>(null);

  useImperativeHandle(ref, () => groupRef.current!);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  useAdjustUVs(sphereRef, SCALE_X_FACTOR, SCALE_FACTOR);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} name={`${ecosystem};Relaychain`} onClick={onClick}>
      <mesh ref={sphereRef} castShadow rotation={[0, Math.PI * 1.5, 0]}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={isSelected ? new Color(0x222222) : new Color(0x000000)}
          emissiveIntensity={isSelected ? 10 : 0}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

Relaychain.displayName = 'Relaychain';
