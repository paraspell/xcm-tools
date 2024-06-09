import { useThree } from '@react-three/fiber';
import { CubeTextureLoader } from 'three';

const SkyBox = () => {
  const { scene } = useThree();
  const loader = new CubeTextureLoader();

  const texture = loader.load([
    '/right.png',
    '/left.png',
    '/top.png',
    '/bottom.png',
    '/front.png',
    '/back.png'
  ]);

  scene.background = texture;
  return null;
};

export default SkyBox;
