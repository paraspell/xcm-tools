import React, { useRef, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Texture,
  TextureLoader
} from 'three';
import { getParachainPosition } from '../ParachainsGraph/utils';
import { getLogoScaleFactor, getNodeLogo } from './utils';
import { getParachainColor } from '../../utils/utils';

const lightenColor = (hex: string | undefined, percent: number) => {
  if (!hex) {
    return 'white';
  }

  if (hex.length === 9) {
    // #RRGGBBAA
    hex = hex.slice(0, 7);
  } else if (hex.length === 5) {
    // #RGBA
    hex = hex.slice(0, 4);
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]; // convert to #RRGGBB
  }

  const amount = Math.round(255 * (percent / 100));
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Increase each component towards 255 by the given percentage
  r += amount;
  g += amount;
  b += amount;

  // Ensure that no RGB values go over 255
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  // Convert back to hex and return
  return (
    '#' +
    (
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    ).toUpperCase()
  );
};

const adjustUVs = (geometry: SphereGeometry, node: string) => {
  const uvs = geometry.attributes.uv;
  const scaleFactor = getLogoScaleFactor(node);
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, (uvs.getX(i) - 0.5) * scaleFactor + 0.5);
    uvs.setY(i, (uvs.getY(i) - 0.5) * scaleFactor + 0.5);
  }
  geometry.attributes.uv.needsUpdate = true;
};

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

  const texture = useLoader(TextureLoader, getNodeLogo(name)!) as Texture;

  useEffect(() => {
    if (sphereRef.current) {
      adjustUVs(sphereRef.current.geometry as SphereGeometry, name);
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
