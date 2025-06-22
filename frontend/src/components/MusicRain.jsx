import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';

export default function MusicRain() {
  const { scene } = useGLTF('/headphone.glb', true);
  const notes = useRef([]);
  const count = 25;

  useEffect(() => {
    console.log("✅ Loaded GLB scene:", scene);
    notes.current = notes.current.slice(0, count);
  }, [scene]);

  useFrame(() => {
    notes.current.forEach((note) => {
      if (note) {
        note.position.y -= 0.05;
        if (note.position.y < -5) {
          note.position.y = Math.random() * 5 + 5;
          note.position.x = (Math.random() - 0.5) * 4;
          note.position.z = (Math.random() - 0.5) * 4;
        }
      }
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = (Math.random() - 0.5) * 4;
        const y = Math.random() * 5 + 2;
        const z = (Math.random() - 0.5) * 4;

        return (
          <primitive
            key={i}
            object={scene.clone(true)}
            ref={(el) => (notes.current[i] = el)}
            scale={0.05} // 🔧 Shrunk down
            position={[x, y, z]}
          />
        );
      })}
    </>
  );
}
