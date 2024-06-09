import { Canvas } from '@react-three/fiber';
import { FC, ReactNode } from 'react';
import { PCFSoftShadowMap } from 'three';

type Props = {
  children?: ReactNode;
};

const Canvas3D: FC<Props> = ({ children }) => {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true
      }}
      shadows={{
        enabled: true,
        type: PCFSoftShadowMap
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
    >
      {children}
    </Canvas>
  );
};

export default Canvas3D;
