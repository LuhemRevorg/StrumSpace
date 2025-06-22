import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export default function MusicRain() {
  const { scene } = useGLTF('/musical_note.glb');
  const notes = useRef([]);

  const count = 25; // Number of falling notes

  useFrame(() => {
    notes.current.forEach((note) => {
      note.position.y -= 0.05;
      if (note.position.y < -5) {
        note.position.y = Math.random() * 10 + 5;
        note.position.x = (Math.random() - 0.5) * 10;
        note.position.z = (Math.random() - 0.5) * 10;
      }
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <primitive
          key={i}
          object={scene.clone()}
          ref={(el) => (notes.current[i] = el)}
          scale={0.3}
          position={[
            (Math.random() - 0.5) * 10,
            Math.random() * 10,
            (Math.random() - 0.5) * 10,
          ]}
        />
      ))}
    </>
  );
}
