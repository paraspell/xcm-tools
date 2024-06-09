import { FC } from 'react';
import { DoubleSide, LineCurve3, Vector3 } from 'three';
import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';

type Props = {
  startPosition: Vector3;
  endPosition: Vector3;
  lineWidth: number;
  isHighlighed: boolean;
  isSelected: boolean;
  isSecondary: boolean;
  onClick: () => void;
};

const LineBetween: FC<Props> = ({
  startPosition,
  endPosition,
  lineWidth,
  isHighlighed,
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
  const curve = new LineCurve3(startPosition, endPosition);

  const getLineColor = (isHighlighed: boolean, isSelected: boolean, isSecondary: boolean) => {
    if (isSelected) return selectedChannelColor ?? '#F03E3E';
    if (isHighlighed) return highlightedChannelColor ?? '#364FC7';
    if (isSecondary) return secondaryChannelColor ?? '#C2255C';
    return primaryChannelColor ?? '#2B8A3E';
  };

  const color = getLineColor(isHighlighed, isSelected, isSecondary);
  return (
    <mesh onClick={onClick}>
      <tubeGeometry args={[curve, 1, lineWidth, 10, false]} />
      <meshStandardMaterial
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
