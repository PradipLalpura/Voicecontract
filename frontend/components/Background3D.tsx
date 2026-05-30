"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  MeshTransmissionMaterial, 
  Environment, 
  ContactShadows,
  RoundedBox,
  QuadraticBezierLine,
  Text
} from "@react-three/drei";
import * as THREE from "three";

// --- Stylized Premium 3D Models ---

function Laptop(props: any) {
  return (
    <group {...props}>
      {/* Base */}
      <RoundedBox args={[4, 0.2, 3]} radius={0.1} smoothness={4} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </RoundedBox>
      {/* Screen */}
      <group position={[0, 0, -1.4]} rotation={[0.3, 0, 0]}>
        <RoundedBox args={[4, 2.8, 0.1]} radius={0.1} smoothness={4} position={[0, 1.4, 0]}>
           <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
        </RoundedBox>
        {/* Glowing Screen Inner */}
        <mesh position={[0, 1.4, 0.06]}>
          <planeGeometry args={[3.8, 2.6]} />
          <meshBasicMaterial color="#00C2CC" transparent opacity={0.1} />
        </mesh>
      </group>
    </group>
  );
}

function Phone(props: any) {
  return (
    <group {...props}>
      <RoundedBox args={[1.5, 3, 0.2]} radius={0.2} smoothness={4}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.9} />
      </RoundedBox>
      {/* Glowing Screen */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[1.3, 2.8]} />
        <meshBasicMaterial color="#00C2CC" transparent opacity={0.2} />
      </mesh>
      <Text position={[0, 0, 0.12]} fontSize={0.2} color="#00C2CC" anchorX="center" anchorY="middle">
        Voice
      </Text>
    </group>
  );
}

function GlowingContract(props: any) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={ref} {...props}>
      <RoundedBox args={[2.5, 3.5, 0.05]} radius={0.05} smoothness={4}>
        <MeshTransmissionMaterial 
          backside 
          samples={4} 
          thickness={0.5} 
          roughness={0.1} 
          chromaticAberration={1} 
          anisotropy={0.5} 
          distortion={0.2} 
          distortionScale={0.5} 
          temporalDistortion={0.1} 
          color="#ffffff" 
        />
      </RoundedBox>
      {/* Contract Lines */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, 1 - i * 0.4, 0.03]}>
          <planeGeometry args={[1.8, 0.1]} />
          <meshBasicMaterial color="#111" transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Seal */}
      <mesh position={[0.6, -1, 0.04]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#00C2CC" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function AudioWaves({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) {
  const ref = useRef<any>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.dashOffset -= 0.02;
    }
  });

  // Calculate a control point above the middle for an arc
  const mid = start.clone().lerp(end, 0.5);
  mid.y += 2;

  return (
    <group>
      {[...Array(3)].map((_, i) => (
        <QuadraticBezierLine
          key={i}
          ref={i === 0 ? ref : null}
          start={start}
          end={end}
          mid={new THREE.Vector3(mid.x, mid.y + i * 0.5, mid.z + Math.sin(i)*0.5)}
          color="#00C2CC"
          lineWidth={2 + i}
          dashed
          dashScale={50}
          dashSize={1}
          dashOffset={i * 10}
          transparent
          opacity={0.3 - i*0.1}
        />
      ))}
    </group>
  );
}

function Scene() {
  const laptopPos = new THREE.Vector3(-4, -1, -2);
  const phonePos = new THREE.Vector3(4, -1, 2);
  const contractPos = new THREE.Vector3(0, 1, 0);

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-10, 10, -5]} intensity={2} color="#00C2CC" />

      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        <Laptop position={laptopPos} rotation={[0.1, 0.5, 0]} />
      </Float>

      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={1.5}>
        <Phone position={phonePos} rotation={[-0.1, -0.4, 0]} />
      </Float>

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <GlowingContract position={contractPos} />
      </Float>

      <AudioWaves start={phonePos} end={contractPos} />
      <AudioWaves start={laptopPos} end={contractPos} />

      <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2} far={4} />
    </>
  );
}

export default function Background3D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-background">
      <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
        <Scene />
      </Canvas>
      
      {/* Fallback gradients to blend smoothly */}
      <div className="absolute top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[20vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
