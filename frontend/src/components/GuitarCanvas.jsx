import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef } from 'react';

function GuitarModel() {
  const { scene } = useGLTF('/guitar.glb');
  const guitarRef = useRef();
  return (
    <primitive
      ref={guitarRef}
      object={scene}
      scale={3.5}
      position={[0, -1, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export default function GuitarCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      style={{ height: '100%', width: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <GuitarModel />
      {/* Remove OrbitControls if you want it locked */}
      {/* <OrbitControls enableZoom={false} target={[0, -1, 0]} /> */}
    </Canvas>
  );
}
