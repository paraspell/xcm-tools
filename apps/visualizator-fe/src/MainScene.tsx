import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, TransformControls } from '@react-three/drei';
import ParachainsGraphContainer from './components/ParachainsGraph/ParachainsGraph.container';
import { Ecosystem } from './types/types';
import { useSelectedParachain } from './context/SelectedParachain/useSelectedParachain';

const CAMERA_POSITION = new Vector3(48, 10, 0);
const RADIUS = 25;

const getCirclePosition = (angle: number, radius: number): Vector3 => {
  return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
};

interface AngleMap {
  [key: string]: number;
}

const MainScene = () => {
  const { selectedEcosystem, activeEditParachain } = useSelectedParachain();

  const targetAngles = useRef<AngleMap>({});
  const currentAngles = useRef<AngleMap>({});
  const ecosystems = Object.values(Ecosystem);
  const totalEcosystems = ecosystems.length;
  const initialTargetRef = useRef<Vector3 | null>(null);
  const [_initialized, setInitialized] = useState(false);

  const [channelsUpdateTrigger, setChannelsUpdateTrigger] = useState(0);

  useEffect(() => {
    ecosystems.forEach((ecosystem, index) => {
      const targetAngle = (index / totalEcosystems) * 2 * Math.PI;
      targetAngles.current[ecosystem] = targetAngle;
      currentAngles.current[ecosystem] = currentAngles.current[ecosystem] ?? targetAngle;
    });
    const initialEcosystem = Ecosystem.POLKADOT;
    initialTargetRef.current = getCirclePosition(targetAngles.current[initialEcosystem], RADIUS);
    setInitialized(true);
  }, [totalEcosystems, ecosystems]);

  useFrame(({ scene }) => {
    const rotationOffset = -(
      (ecosystems.indexOf(selectedEcosystem) / totalEcosystems) *
      2 *
      Math.PI
    );

    ecosystems.forEach(ecosystem => {
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
    ? scene.getObjectByName(activeEditParachain)
    : null;

  const onParachainMove = () => {
    if (activeEditParachainMesh) {
      setChannelsUpdateTrigger(current => current + 1);
    }
  };

  return (
    <>
      {activeEditParachainMesh && (
        <TransformControls
          onObjectChange={onParachainMove}
          object={activeEditParachainMesh}
          mode="translate"
          size={0.5}
        />
      )}
      <ParachainsGraphContainer
        ecosystem={Ecosystem.POLKADOT}
        updateTrigger={channelsUpdateTrigger}
      />
      <ParachainsGraphContainer
        ecosystem={Ecosystem.KUSAMA}
        updateTrigger={channelsUpdateTrigger}
      />
      <ParachainsGraphContainer
        ecosystem={Ecosystem.WESTEND}
        updateTrigger={channelsUpdateTrigger}
      />
      <ParachainsGraphContainer
        ecosystem={Ecosystem.ROCOCO}
        updateTrigger={channelsUpdateTrigger}
      />
      <OrbitControls enableDamping autoRotate={false} target={target} makeDefault />
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} />
    </>
  );
};

export default MainScene;
