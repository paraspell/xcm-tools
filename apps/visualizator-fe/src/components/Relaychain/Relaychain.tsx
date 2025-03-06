import type { ThreeEvent } from '@react-three/fiber';
import { useFrame, useLoader } from '@react-three/fiber';
import type { FC } from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Group, Mesh, SphereGeometry } from 'three';
import { Color, TextureLoader } from 'three';

import type { Ecosystem } from '../../types/types';
import { adjustUVs } from '../../utils/adjustUVs';
import { getRelaychainLogo } from './utils/getRelaychainLogo';

const SCALE_FACTOR = 2.25;

type Props = {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  ecosystem: Ecosystem;
  ref: React.RefObject<Group | null>;
  isSelected?: boolean;
};

const Relaychain: FC<Props> = ({ ref, onClick, ecosystem, isSelected }) => {
  const logo = getRelaychainLogo(ecosystem);
  const texture = useLoader(TextureLoader, logo);
  const sphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useImperativeHandle(ref, () => groupRef.current!);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  useEffect(() => {
    if (sphereRef.current) {
      adjustUVs(sphereRef.current.geometry as SphereGeometry, SCALE_FACTOR);
    }
  }, []);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} name={`${ecosystem};Relaychain`} onClick={onClick}>
      <mesh ref={sphereRef} castShadow rotation={[0, Math.PI * 1.5, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
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

export default Relaychain;
