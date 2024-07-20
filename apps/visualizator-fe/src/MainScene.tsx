import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ParachainsGraphContainer from './components/ParachainsGraph/ParachainsGraph.container';

const CAMERA_POSITION = [20, 2, 5] as const;

const MainScene = () => (
  <>
    <ParachainsGraphContainer />
    <OrbitControls enableDamping autoRotate={false} />
    <PerspectiveCamera makeDefault position={CAMERA_POSITION} />
  </>
);

export default MainScene;
