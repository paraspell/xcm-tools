import React, { useRef, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import { Color, Group, Mesh, MeshStandardMaterial, SphereGeometry, TextureLoader } from 'three';
import { getParachainPosition } from '../ParachainsGraph/utils';
import { getLogoScaleFactor, getNodeLogo } from './utils';
import { getParachainColor } from '../../utils/utils';
import { lightenColor } from '../../utils/lightenColor';
import { adjustUVs } from '../../utils/adjustUVs';

type Props = {
  name: string;
  index: number;
  isSelected: boolean;
  onClick: (name: string) => void;
  scale: number;
};

const Parachain: React.FC<Props> = ({ name, index, isSelected, onClick, scale }) => {
  const position = getParachainPosition(index);
  const textRef = useRef<Text>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const groupRef = useRef<Group>(null);

  const sphereRef = useRef<Mesh>(null);

  const texture = useLoader(TextureLoader, getNodeLogo(name)!);

  useEffect(() => {
    if (sphereRef.current) {
      adjustUVs(sphereRef.current.geometry as SphereGeometry, getLogoScaleFactor(name));
    }
  }, []);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const color = getParachainColor(name);
  const lightColor = lightenColor(color, 50);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={position}>
      <mesh
        castShadow
        ref={sphereRef}
        rotation={[0, Math.PI * 1.5, 0]}
        onClick={() => onClick(name)}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          ref={materialRef}
          map={texture}
          color={lightColor}
          emissive={isSelected ? 'white' : new Color(0x000000)}
          emissiveIntensity={isSelected ? 0.5 : 0}
          toneMapped={false}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      <Text
        ref={textRef}
        position={[0, 0.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="https://cdn.jsdelivr.net/npm/roboto-regular-woff@0.7.1/Roboto-Regular.woff"
      >
        {name}
      </Text>
    </group>
  );
};

export default Parachain;
