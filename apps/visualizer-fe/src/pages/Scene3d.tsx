import { Canvas3D } from '../components/Canvas3D';
import { Lights } from '../components/Lights';
import { SkyBox } from '../components/Skybox';
import { MainScene } from '../MainScene';

export const Scene3d = () => (
  <div id="canvas-container">
    <Canvas3D>
      <Lights />
      <MainScene />
      <SkyBox />
    </Canvas3D>
  </div>
);
