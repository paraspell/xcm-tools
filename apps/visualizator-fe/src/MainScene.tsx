import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ParachainsGraphContainer from './components/ParachainsGraph/ParachainsGraph.container';

const MainScene = () => {
  return (
    <>
      <ParachainsGraphContainer />
      <OrbitControls enableDamping autoRotate={false} />
      <PerspectiveCamera makeDefault position={[15, 2, 5]} />
    </>
  );
};

export default MainScene;
