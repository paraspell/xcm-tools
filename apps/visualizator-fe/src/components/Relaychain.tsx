import { useFrame, useLoader } from '@react-three/fiber';
import { FC, useEffect, useRef } from 'react';
import { Color, TextureLoader, SphereGeometry, Mesh, Group } from 'three';
import polkadotPng from '../logos/polkadot1.png';

const adjustUVs = (geometry: SphereGeometry) => {
  const uvs = geometry.attributes.uv;
  const scaleFactor = 2.25;
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, (uvs.getX(i) - 0.5) * scaleFactor + 0.5);
    uvs.setY(i, (uvs.getY(i) - 0.5) * scaleFactor + 0.5);
  }
  geometry.attributes.uv.needsUpdate = true;
};

type Props = {
  onClick: () => void;
  isSelected?: boolean;
};

const Relaychain: FC<Props> = ({ onClick, isSelected }) => {
  const texture = useLoader(TextureLoader, polkadotPng);
  const sphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  useEffect(() => {
    if (sphereRef.current) {
      adjustUVs(sphereRef.current.geometry as SphereGeometry);
    }
  }, []);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} onClick={onClick}>
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
