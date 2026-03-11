import { Canvas } from '@react-three/fiber';
import type { FC, ReactNode } from 'react';
import { PCFSoftShadowMap } from 'three';

type Props = {
  children?: ReactNode;
};

export const Canvas3D: FC<Props> = ({ children }) => {
  return (
    <Canvas
      resize={{ debounce: 0 }}
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
