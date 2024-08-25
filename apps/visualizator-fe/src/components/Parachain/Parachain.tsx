import React, { useRef, useEffect, useState } from 'react';
import { Text } from '@react-three/drei';
import { ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import { Color, Group, Mesh, MeshStandardMaterial, SphereGeometry, TextureLoader } from 'three';
import { getParachainPosition } from '../ParachainsGraph/utils';
import { getLogoScaleFactor, getNodeLogo } from './utils';
import { getParachainColor } from '../../utils/utils';
import { lightenColor } from '../../utils/lightenColor';
import { adjustUVs } from '../../utils/adjustUVs';
import { Ecosystem } from '../../types/types';
import { FONT_URL } from '../../consts/consts';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';

type Props = {
  name: string;
  index: number;
  isSelected: boolean;
  onClick: (name: string) => void;
  onRightClick: (name: string) => void;
  scale: number;
  ecosystem: Ecosystem;
};

const Parachain: React.FC<Props> = ({
  name,
  index,
  isSelected,
  onClick,
  onRightClick,
  scale,
  ecosystem
}) => {
  const { activeEditParachain } = useSelectedParachain();
  const initialPosition = getParachainPosition(index, ecosystem);
  const [position] = useState(initialPosition);
  const textRef = useRef<Text>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const groupRef = useRef<Group>(null);

  const sphereRef = useRef<Mesh>(null);

  const logo = getNodeLogo(name, ecosystem);

  const texture = logo ? useLoader(TextureLoader, logo) : null;

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

  const color = getParachainColor(name, ecosystem);
  const lightColor = lightenColor(color, 50);

  const onClickHandler = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (activeEditParachain?.includes(name)) {
      return;
    }
    onClick(name);
  };

  const onContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onRightClick(name);
  };

  const objectName = `${ecosystem};${name}`;

  return (
    <group ref={groupRef} name={objectName} scale={[scale, scale, scale]} position={position}>
      <mesh
        castShadow
        ref={sphereRef}
        rotation={[0, Math.PI * 1.5, 0]}
        onClick={onClickHandler}
        onContextMenu={onContextMenu}
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
        font={FONT_URL}
      >
        {name}
      </Text>
    </group>
  );
};

export default Parachain;
