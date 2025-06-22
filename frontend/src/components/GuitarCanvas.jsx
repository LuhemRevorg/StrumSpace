import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';
import { useRef } from 'react';

function GuitarModel() {
  const { scene } = useGLTF('/acoustic_guitar.glb');
  const guitarRef = useRef();

  useFrame(() => {
    if (guitarRef.current) {
      guitarRef.current.rotation.x += (Math.random() - 0.5) * 0.003;
      guitarRef.current.rotation.y += 0.003;
    }
  });

  return (
    <primitive
      ref={guitarRef}
      object={scene}
      scale={3.5}
      position={[0, -1, 0]}
      castShadow
      receiveShadow
    />
  );
}

export default function GuitarCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [-3, 2, 8], fov: 45 }}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Main directional light (Key Light) */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Fill Light (soft color) */}
      <ambientLight intensity={0.4} />

      {/* Rim light to outline model */}
      <pointLight position={[-10, 10, -10]} intensity={0.8} color="#ff3b3b" />
      <pointLight position={[10, -10, 10]} intensity={0.5} color="#44ccff" />

      {/* Optional environment for soft reflections */}
      <Stage environment="city" intensity={0.6}>
        <GuitarModel />
      </Stage>

      <OrbitControls enableZoom={false} target={[0, -1, 0]} />
    </Canvas>
  );
}
