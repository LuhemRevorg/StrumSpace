import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef } from 'react';

function GuitarModel() {
  const { scene } = useGLTF('/acoustic_guitar.glb');
  const guitarRef = useRef();

  useFrame(() => {
    if (guitarRef.current) {
      guitarRef.current.rotation.x += (Math.random() - 0.5) * 0.01;
    }
  });

  return (
    <primitive
      ref={guitarRef}
      object={scene}
      scale={3.5}
      position={[0, -1, 0]}
    />
  );
}

export default function GuitarCanvas() {
  return (
    <Canvas
      camera={{ position: [-5, 2, 10], fov: 40 }}
      style={{ height: '100%', width: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <GuitarModel />
      <OrbitControls enableZoom={false} target={[0, -1, 0]} />
    </Canvas>
  );
}
