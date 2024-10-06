import { type FC, useRef } from 'react';
import {
  DoubleSide,
  LineCurve3,
  type Mesh,
  type MeshStandardMaterial,
  Object3D,
  TubeGeometry,
  type InstancedMesh
} from 'three';
import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';
import { type ThreeEvent, useFrame } from '@react-three/fiber';

type Props = {
  startObject: Object3D | null;
  endObject: Object3D | null;
  lineWidth: number;
  isHighlighted: boolean;
  isSelected: boolean;
  isSecondary: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
};

type Message = {
  id: number;
  t: number;
  direction: number;
  speed: number;
};

const LineBetween: FC<Props> = ({
  startObject,
  endObject,
  lineWidth,
  isHighlighted,
  isSelected,
  isSecondary,
  onClick
}) => {
  const {
    primaryChannelColor,
    highlightedChannelColor,
    secondaryChannelColor,
    selectedChannelColor
  } = useSelectedParachain();

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const curveRef = useRef<LineCurve3 | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const messageIdRef = useRef<number>(0);
  const nextSpawnTimeRef = useRef<number>(0);
  const sphereMeshRef = useRef<InstancedMesh>(null);

  const minSphereSize = 0.05;
  const maxSphereSize = 1;
  const sphereSize = Math.min(Math.max(lineWidth * 0.6, minSphereSize), maxSphereSize);

  const maxLineWidth = 0.5;

  const baseSpawnRate = 0.05;
  const spawnRateMultiplier = 2;

  const minMessageSpeed = 0.1;
  const maxMessageSpeed = 0.4;
  const messageSpeed =
    minMessageSpeed + (lineWidth / maxLineWidth) * (maxMessageSpeed - minMessageSpeed);

  const getLineColor = (isHighlighted: boolean, isSelected: boolean, isSecondary: boolean) => {
    if (isSelected) return selectedChannelColor ?? '#F03E3E';
    if (isHighlighted) return highlightedChannelColor ?? '#364FC7';
    if (isSecondary) return secondaryChannelColor ?? '#C2255C';
    return primaryChannelColor ?? '#2B8A3E';
  };

  const color = getLineColor(isHighlighted, isSelected, isSecondary);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (startObject && endObject && meshRef.current) {
      const startPosition = startObject.position;
      const endPosition = endObject.position;

      if (!curveRef.current) {
        curveRef.current = new LineCurve3(startPosition.clone(), endPosition.clone());
      } else {
        curveRef.current.v1.copy(startPosition);
        curveRef.current.v2.copy(endPosition);
      }

      const tubeGeometry = new TubeGeometry(curveRef.current, 12, lineWidth, 6, false);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = tubeGeometry;

      if (materialRef.current) {
        materialRef.current.color.set(color);
        materialRef.current.emissive.set(color);
        materialRef.current.transparent = true;
        materialRef.current.opacity = 0.3;
      }
    }

    if (curveRef.current && sphereMeshRef.current) {
      const messages = messagesRef.current;

      messages.forEach(message => {
        message.t += delta * message.speed * message.direction;
      });
      messagesRef.current = messages.filter(message => message.t >= 0 && message.t <= 1);

      const mesh = sphereMeshRef.current;
      const dummy = new Object3D();

      messagesRef.current.forEach((message, i) => {
        const t = message.t;
        const position = curveRef.current!.getPointAt(t);
        dummy.position.copy(position);

        const tangent = curveRef.current!.getTangentAt(t);
        dummy.lookAt(position.clone().add(tangent));

        dummy.scale.set(sphereSize, sphereSize, sphereSize);

        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.count = messagesRef.current.length;
      mesh.instanceMatrix.needsUpdate = true;

      if (time >= nextSpawnTimeRef.current) {
        const spawnRate = baseSpawnRate + lineWidth * spawnRateMultiplier;

        const averageSpawnInterval = 1 / spawnRate;

        const nextInterval = averageSpawnInterval * (0.5 + Math.random());

        nextSpawnTimeRef.current = time + nextInterval;

        const newMessage: Message = {
          id: messageIdRef.current++,
          t: 0,
          direction: Math.random() < 0.5 ? 1 : -1,
          speed: messageSpeed * (0.8 + 0.4 * Math.random())
        };

        newMessage.t = newMessage.direction === 1 ? 0 : 1;

        messagesRef.current.push(newMessage);

        if (messagesRef.current.length > 1000) {
          messagesRef.current.shift();
        }
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick}>
        <bufferGeometry />
        <meshStandardMaterial
          ref={materialRef}
          toneMapped={true}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.2}
          side={DoubleSide}
        />
      </mesh>
      <instancedMesh ref={sphereMeshRef} args={[undefined, undefined, 1000]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial
          color="white"
          wireframe={true}
          emissive="white"
          emissiveIntensity={0.5}
        />
      </instancedMesh>
    </group>
  );
};

export default LineBetween;
