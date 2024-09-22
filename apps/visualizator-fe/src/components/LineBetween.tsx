import { FC, useRef } from 'react';
import { DoubleSide, LineCurve3, Mesh, MeshStandardMaterial, Object3D, TubeGeometry } from 'three';
import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';
import { ThreeEvent, useFrame } from '@react-three/fiber';

type Props = {
  startObject: Object3D | null;
  endObject: Object3D | null;
  lineWidth: number;
  isHighlighted: boolean;
  isSelected: boolean;
  isSecondary: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
};

const LineBetween: FC<Props> = ({
  startObject,
  endObject,
  lineWidth,
  isHighlighted,
  isSelected,
  isSecondary,
  onClick
}) => {
  const {
    primaryChannelColor,
    highlightedChannelColor,
    secondaryChannelColor,
    selectedChannelColor
  } = useSelectedParachain();

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);

  const getLineColor = (isHighlighted: boolean, isSelected: boolean, isSecondary: boolean) => {
    if (isSelected) return selectedChannelColor ?? '#F03E3E';
    if (isHighlighted) return highlightedChannelColor ?? '#364FC7';
    if (isSecondary) return secondaryChannelColor ?? '#C2255C';
    return primaryChannelColor ?? '#2B8A3E';
  };

  const color = getLineColor(isHighlighted, isSelected, isSecondary);

  useFrame(() => {
    if (startObject && endObject && meshRef.current) {
      const startPosition = startObject.position;
      const endPosition = endObject.position;

      const curve = new LineCurve3(startPosition.clone(), endPosition.clone());

      const tubeGeometry = new TubeGeometry(curve, 20, lineWidth, 8, false);

      meshRef.current.geometry.dispose();

      meshRef.current.geometry = tubeGeometry;
    }

    if (materialRef.current) {
      materialRef.current.color.set(color);
      materialRef.current.emissive.set(color);
    }
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <bufferGeometry />
      <meshStandardMaterial
        ref={materialRef}
        toneMapped={true}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.5}
        roughness={0.2}
        color={color}
        side={DoubleSide}
      />
    </mesh>
  );
};

export default LineBetween;
