import { ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import { FC, useEffect, useRef } from 'react';
import { Color, TextureLoader, SphereGeometry, Mesh, Group } from 'three';
import { adjustUVs } from '../../utils/adjustUVs';
import { Ecosystem } from '../../types/types';
import { getRelaychainLogo } from './utils/getRelaychainLogo';

const SCALE_FACTOR = 2.25;

type Props = {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  ecosystem: Ecosystem;
  isSelected?: boolean;
};

const Relaychain: FC<Props> = ({ onClick, ecosystem, isSelected }) => {
  const logo = getRelaychainLogo(ecosystem);
  const texture = useLoader(TextureLoader, logo);
  const sphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

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
    <group ref={groupRef} onClick={onClick}>
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

export default Relaychain;
