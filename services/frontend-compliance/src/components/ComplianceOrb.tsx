/**
 * ComplianceOrb — React Three Fiber 3D compliance visualization.
 * A morphing sphere whose color and shape react to the compliance score.
 * High score = calm green sphere. Low score = jagged red crystal.
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

function Orb({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  const color    = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const emissive = score >= 80 ? '#065F46' : score >= 60 ? '#78350F' : '#7F1D1D';
  const distort  = score >= 80 ? 0.15 : score >= 60 ? 0.3 : 0.5;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z = Math.sin(t * 0.4) * 0.08;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += 0.008;
      ringRef1.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x += 0.006;
      ringRef2.current.rotation.y = Math.sin(t * 0.25) * 0.3;
    }
  });

  return (
    <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.1}>
      <group>
        {/* Main sphere */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.1, 64, 64]} />
          <MeshDistortMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.4}
            distort={distort}
            speed={1.5}
            roughness={0.2}
            metalness={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Wireframe shell */}
        <mesh>
          <icosahedronGeometry args={[1.35, 2]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.08} />
        </mesh>

        {/* Orbit ring 1 */}
        <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.75, 0.018, 8, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.5}
            blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Orbit ring 2 */}
        <mesh ref={ringRef2} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <torusGeometry args={[2.1, 0.012, 8, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.3}
            blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </Float>
  );
}

// Floating compliance data points
function DataPoints({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const count = 120;
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 2.5 + Math.random() * 2;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      pos[i*3+2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y += 0.0015;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.05;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.05} color={color} transparent opacity={0.5}
        blending={THREE.AdditiveBlending} sizeAttenuation depthWrite={false}
      />
    </points>
  );
}

export default function ComplianceOrb({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#111827']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} color={color} intensity={3} />
      <pointLight position={[-3, -2, 2]} color="#8B5CF6" intensity={1.5} />
      <DataPoints score={score} />
      <Orb score={score} />
    </Canvas>
  );
}
