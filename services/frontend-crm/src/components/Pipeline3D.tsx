/**
 * Pipeline3D — React Three Fiber scene for the CRM dashboard.
 * Visualizes the 5-stage document pipeline as floating nodes
 * connected by glowing energy flows with particle streams.
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Stage positions along X axis
const STAGES = [
  { label: 'UPLOAD',   x: -5,   color: '#3B82F6', emissive: '#1D4ED8' },
  { label: 'OCR',      x: -2.5, color: '#8B5CF6', emissive: '#5B21B6' },
  { label: 'CLASSIFY', x:  0,   color: '#06B6D4', emissive: '#0E7490' },
  { label: 'EXTRACT',  x:  2.5, color: '#10B981', emissive: '#065F46' },
  { label: 'VALIDATE', x:  5,   color: '#F59E0B', emissive: '#92400E' },
];

// Floating document node (icosahedron)
function StageNode({ stage, index }: { stage: typeof STAGES[0]; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !wireRef.current) return;
    const t = clock.getElapsedTime() + index * 0.8;
    meshRef.current.rotation.y += 0.008;
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    wireRef.current.rotation.copy(meshRef.current.rotation);
    // pulse emissive
    const mat = meshRef.current.material as THREE.MeshPhongMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(t * 1.2) * 0.25;
  });

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.6}>
      <group position={[stage.x, 0, 0]}>
        {/* Solid node */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshPhongMaterial
            color={stage.color}
            emissive={stage.emissive}
            emissiveIntensity={0.5}
            shininess={60}
            transparent opacity={0.88}
          />
        </mesh>
        {/* Wireframe */}
        <mesh ref={wireRef}>
          <icosahedronGeometry args={[0.44, 1]} />
          <meshBasicMaterial color={stage.color} wireframe transparent opacity={0.35} />
        </mesh>
        {/* Outer glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.015, 8, 64]} />
          <meshBasicMaterial color={stage.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </Float>
  );
}

// Energy beam between two nodes
function EnergyBeam({ fromX, toX, color }: { fromX: number; toX: number; color: string }) {
  const lineMesh = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push(new THREE.Vector3(fromX + (toX - fromX) * t, Math.sin(t * Math.PI) * 0.15, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
    return new THREE.Line(geo, mat);
  }, [fromX, toX, color]);

  useFrame(({ clock }) => {
    (lineMesh.material as THREE.LineBasicMaterial).opacity =
      0.2 + Math.sin(clock.getElapsedTime() * 1.5) * 0.12;
  });

  return <primitive object={lineMesh} />;
}

// Particle stream flowing left to right
function ParticleStream() {
  const count = 200;
  const meshRef = useRef<THREE.Points>(null);

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const palette = STAGES.map(s => new THREE.Color(s.color));

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 12;
      pos[i*3+1] = (Math.random() - 0.5) * 2.5;
      pos[i*3+2] = (Math.random() - 0.5) * 3;
      vel[i] = 0.01 + Math.random() * 0.025;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    return { positions: pos, velocities: vel, colors: col };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i*3] += velocities[i];
      if (pos[i*3] > 6.5) pos[i*3] = -6.5;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={meshRef} geometry={geo}>
      <pointsMaterial
        size={0.04} vertexColors transparent opacity={0.65}
        blending={THREE.AdditiveBlending} sizeAttenuation depthWrite={false}
      />
    </points>
  );
}

// Background grid dots
function GridDots() {
  const geo = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 14;
      pos[i*3+1] = (Math.random() - 0.5) * 5;
      pos[i*3+2] = -2 - Math.random() * 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.025} color="#374151" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} color="#3B82F6" intensity={2} />
      <pointLight position={[-5, -3, 2]} color="#8B5CF6" intensity={1.5} />
      <pointLight position={[5, 2, 2]} color="#06B6D4" intensity={1.5} />

      <GridDots />
      <ParticleStream />

      {STAGES.map((stage, i) => <StageNode key={stage.label} stage={stage} index={i} />)}

      {STAGES.slice(0, -1).map((s, i) => (
        <EnergyBeam key={i} fromX={s.x + 0.45} toX={STAGES[i+1].x - 0.45} color={STAGES[i+1].color} />
      ))}
    </>
  );
}

export default function Pipeline3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 9], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
    </Canvas>
  );
}
