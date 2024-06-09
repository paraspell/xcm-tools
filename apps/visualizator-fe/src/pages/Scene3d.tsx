import MainScene from '../MainScene';
import Canvas3D from '../components/Canvas3D';
import Lights from '../components/Lights';
import SkyBox from '../components/Skybox';

const Scene3d = () => {
  return (
    <div id="canvas-container">
      <Canvas3D>
        <Lights />
        <MainScene />
        <SkyBox />
      </Canvas3D>
    </div>
  );
};

export default Scene3d;
