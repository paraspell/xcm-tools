const Lights = () => {
  return (
    <>
      <ambientLight color="white" intensity={1.2} />
      <pointLight
        intensity={50}
        distance={1000}
        color={'white'}
        position={[2, 8, 2]}
        castShadow
        shadow-radius={4}
        shadow-camera-near={0.5}
        shadow-camera-far={4000}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
};

export default Lights;
