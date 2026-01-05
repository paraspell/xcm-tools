import type { TRelaychain } from '@paraspell/sdk';
import { RELAYCHAINS } from '@paraspell/sdk';
import { OrbitControls, PerspectiveCamera, TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

import ParachainsGraphContainer from './components/ParachainsGraph/ParachainsGraph.container';
import { useDeviceType } from './context/DeviceType/useDeviceType';
import { useSelectedEcosystem } from './context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from './context/SelectedParachain/useSelectedParachain';

const RADIUS = 25;

const getCirclePosition = (angle: number, radius: number): Vector3 => {
  return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
};

interface AngleMap {
  [key: string]: number;
}

const CAMERA_POSITION = new Vector3(48, 10, 0);
const CAMERA_POSITION_MOBILE = new Vector3(58, 10, 0);

const MainScene = () => {
  const { activeEditParachain } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();
  const { isMobile } = useDeviceType();

  const targetAngles = useRef<AngleMap>({});
  const currentAngles = useRef<AngleMap>({});
  const initialTargetRef = useRef<Vector3 | null>(null);
  const [_initialized, setInitialized] = useState(false);

  useEffect(() => {
    RELAYCHAINS.forEach((ecosystem, index) => {
      const targetAngle = (index / RELAYCHAINS.length) * 2 * Math.PI;
      targetAngles.current[ecosystem] = targetAngle;
      currentAngles.current[ecosystem] = currentAngles.current[ecosystem] ?? targetAngle;
    });
    const initialEcosystem: TRelaychain = 'Polkadot';
    initialTargetRef.current = getCirclePosition(targetAngles.current[initialEcosystem], RADIUS);
    setInitialized(true);
  }, []);

  useFrame(({ scene }) => {
    const rotationOffset = -(
      (RELAYCHAINS.indexOf(selectedEcosystem) / RELAYCHAINS.length) *
      2 *
      Math.PI
    );

    RELAYCHAINS.forEach(ecosystem => {
      const mesh = scene.getObjectByName(ecosystem);
      if (mesh) {
        const targetAngle = targetAngles.current[ecosystem] + rotationOffset;
        let currentAngle = currentAngles.current[ecosystem];
        const deltaAngle = ((targetAngle - currentAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
        currentAngle += deltaAngle * 0.08;
        currentAngles.current[ecosystem] = currentAngle;
        mesh.position.copy(getCirclePosition(currentAngle, RADIUS));
      }
    });
  });

  const target = initialTargetRef.current || CAMERA_POSITION;

  const { scene } = useThree();

  const activeEditParachainMesh = activeEditParachain
    ? scene.getObjectByName(`${selectedEcosystem};${activeEditParachain}`)
    : null;

  return (
    <>
      {activeEditParachainMesh && (
        <TransformControls object={activeEditParachainMesh} mode="translate" size={0.5} />
      )}
      <ParachainsGraphContainer ecosystem="Polkadot" />
      <ParachainsGraphContainer ecosystem="Kusama" />
      <ParachainsGraphContainer ecosystem="Westend" />
      <ParachainsGraphContainer ecosystem="Paseo" />
      <OrbitControls enableDamping autoRotate={false} target={target} makeDefault />
      <PerspectiveCamera
        makeDefault
        position={isMobile ? CAMERA_POSITION_MOBILE : CAMERA_POSITION}
      />
    </>
  );
};

export default MainScene;
