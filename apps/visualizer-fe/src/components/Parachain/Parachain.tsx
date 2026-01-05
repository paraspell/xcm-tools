import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame, useLoader } from '@react-three/fiber';
import { easePoly } from 'd3-ease';
import type { FC, RefCallback } from 'react';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { Color, TextureLoader } from 'three';

import { FONT_URL } from '../../consts/consts';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getChainNameNoEcosystem } from '../../utils';
import { adjustUVs, adjustUVXAxis } from '../../utils/adjustUVs';
import { lightenColor } from '../../utils/lightenColor';
import { getParachainColor } from '../../utils/utils';
import { getParachainPosition } from '../ParachainsGraph/utils';
import { getChainLogo } from './utils';

const SCALE_X_FACTOR = 1.8;
const SCALE_FACTOR = 1.15;

type Props = {
  name: TSubstrateChain;
  index: number;
  isSelected: boolean;
  onClick: (name: TSubstrateChain) => void;
  onRightClick: (name: TSubstrateChain) => void;
  scale: number;
  ecosystem: TRelaychain;
  ref: RefCallback<Group | null>;
};

const ParachainNode: FC<Props> = ({
  ref,
  name,
  index,
  isSelected,
  onClick,
  onRightClick,
  scale,
  ecosystem
}) => {
  const { activeEditParachain, animationEnabled } = useSelectedParachain();

  const initialPosition = useMemo(() => getParachainPosition(index, ecosystem), [index, ecosystem]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [floatingOffset, setFloatingOffset] = useState<number>(0);

  const textRef = useRef<Text>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const sphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useImperativeHandle(ref, () => groupRef.current!);

  const logo = getChainLogo(name);
  const texture = logo ? useLoader(TextureLoader, logo) : null;

  useEffect(() => {
    if (sphereRef.current) {
      adjustUVXAxis(sphereRef.current.geometry as SphereGeometry, SCALE_X_FACTOR);
      adjustUVs(sphereRef.current.geometry as SphereGeometry, Math.sqrt(scale) * SCALE_FACTOR);
    }
  }, [scale]);

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(initialPosition);
    }
  }, [initialPosition]);

  useEffect(() => {
    const currentlyEditing = activeEditParachain?.includes(`${ecosystem};${name}`) ?? false;
    if (!currentlyEditing && isEditing) {
      if (groupRef.current) {
        const currentY = groupRef.current.position.y;
        setFloatingOffset(currentY - initialPosition.y);
      }
    }
    setIsEditing(currentlyEditing);
  }, [activeEditParachain, ecosystem, name, initialPosition]);

  useEffect(() => {
    if (!animationEnabled && groupRef.current) {
      const currentY = groupRef.current.position.y;
      setFloatingOffset(currentY - initialPosition.y);
    }
  }, [animationEnabled, initialPosition]);

  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);

      if (!isEditing && animationEnabled) {
        const amplitude = 0.1; // Adjust amplitude for floating height
        const speed = 0.9; // Adjust speed of floating
        const phaseOffset = index * 0.5; // Different phases for each parachain

        const time = (clock.getElapsedTime() * speed + phaseOffset) % (2 * Math.PI);
        const t = (Math.sin(time) + 1) / 2; // Normalized time between 0 and 1

        const easedT = easePoly.exponent(1)(t);

        groupRef.current.position.y = initialPosition.y + floatingOffset + easedT * amplitude;
      }
    }
  });

  const color = getParachainColor(name, ecosystem);
  const lightColor = lightenColor(color, 50);

  const onClickHandler = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (activeEditParachain?.includes(`${ecosystem};${name}`)) {
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
    <group ref={groupRef} name={objectName} scale={[scale, scale, scale]}>
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
        {getChainNameNoEcosystem(name, ecosystem)}
      </Text>
    </group>
  );
};

ParachainNode.displayName = 'Parachain';

export default ParachainNode;
