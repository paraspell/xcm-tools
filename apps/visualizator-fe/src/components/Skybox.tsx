import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { CubeTextureLoader } from 'three';
import { loadImageFromDB } from '../utils/idbUtils';
import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';

const SkyBox = () => {
  const { scene } = useThree();
  const { skyboxTrigger } = useSelectedParachain();

  useEffect(() => {
    const loadTextures = async () => {
      const loader = new CubeTextureLoader();
      const sides = ['right', 'left', 'top', 'bottom', 'front', 'back'];

      const paths = await Promise.all(
        sides.map(async side => (await loadImageFromDB(`skybox-${side}`)) || `/skybox/${side}.png`)
      );

      const texture = loader.load(paths);
      scene.background = texture;
    };

    void loadTextures();
  }, [scene, skyboxTrigger]);

  return null;
};

export default SkyBox;
