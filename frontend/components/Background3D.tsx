"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  MeshTransmissionMaterial, 
  Environment, 
  ContactShadows,
  RoundedBox,
  Html,
  Line
} from "@react-three/drei";
import * as THREE from "three";

// --- Hyper-Realistic 3D Models with HTML Screen Projections ---

function RealisticLaptop(props: any) {
  return (
    <group {...props}>
      {/* Base/Keyboard Deck */}
      <RoundedBox args={[5.2, 0.15, 3.6]} radius={0.05} smoothness={4} position={[0, -0.075, 0]}>
        <meshStandardMaterial color="#b0b5b9" roughness={0.2} metalness={0.8} />
      </RoundedBox>
      {/* Keyboard Indentation */}
      <RoundedBox args={[4.8, 0.05, 1.8]} radius={0.02} smoothness={2} position={[0, 0, -0.6]}>
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </RoundedBox>
      {/* Trackpad */}
      <RoundedBox args={[1.8, 0.02, 1.2]} radius={0.05} smoothness={2} position={[0, 0, 1.05]}>
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.6} />
      </RoundedBox>

      {/* Screen Lid (Hinged at the back) */}
      <group position={[0, 0, -1.7]} rotation={[0.2, 0, 0]}>
        {/* Aluminum Lid */}
        <RoundedBox args={[5.2, 3.4, 0.1]} radius={0.05} smoothness={4} position={[0, 1.7, -0.05]}>
           <meshStandardMaterial color="#b0b5b9" roughness={0.2} metalness={0.8} />
        </RoundedBox>
        {/* Black Bezel */}
        <RoundedBox args={[5.1, 3.3, 0.02]} radius={0.05} smoothness={4} position={[0, 1.7, 0.01]}>
           <meshStandardMaterial color="#000000" roughness={0.1} />
        </RoundedBox>
        
        {/* The Magic: Real HTML projected onto the 3D screen */}
        <Html 
          transform 
          wrapperClass="html-screen" 
          distanceFactor={1.25} 
          position={[0, 1.7, 0.03]} 
          occlude
        >
          <div className="w-[1024px] h-[640px] bg-background rounded-lg overflow-hidden flex flex-col pointer-events-none select-none border border-border shadow-2xl">
            {/* Fake Browser/App Header */}
            <div className="h-12 bg-surface border-b border-border flex items-center px-6 gap-4">
              <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
              <div className="bg-background flex-1 h-8 rounded-md flex items-center justify-center text-text-muted text-sm font-medium">voicecontract.ai/cockpit</div>
            </div>
            {/* Fake Dashboard Content */}
            <div className="flex-1 p-8 flex gap-8">
               <div className="w-64 flex flex-col gap-4">
                 <div className="h-10 bg-primary/10 rounded-md" />
                 <div className="h-10 bg-surface rounded-md border border-border" />
                 <div className="h-10 bg-surface rounded-md border border-border" />
                 <div className="flex-1 rounded-md border border-border border-dashed mt-8 p-4 text-xs text-text-muted">Live Transcription Feed...</div>
               </div>
               <div className="flex-1 flex flex-col gap-6">
                 <div className="flex justify-between items-center">
                   <div className="text-2xl font-bold text-text">Active Meeting: Stark Industries</div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Recording
                   </div>
                 </div>
                 <div className="flex-1 bg-surface border border-border rounded-xl p-6 relative overflow-hidden shadow-apple-inner flex flex-col justify-end">
                    {/* Fake Waveform */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-primary/5" />
                    <div className="text-xl text-text leading-relaxed font-medium">
                      "So to confirm, the Master Service Agreement will cover the entire Q3 infrastructure rollout, capped at 50,000 USD."
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

function RealisticPhone(props: any) {
  return (
    <group {...props}>
      {/* Chassis */}
      <RoundedBox args={[1.6, 3.3, 0.15]} radius={0.2} smoothness={4}>
        <meshStandardMaterial color="#374151" roughness={0.1} metalness={0.9} />
      </RoundedBox>
      {/* Screen Bezel */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[1.5, 3.2]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* HTML Projection */}
      <Html 
        transform 
        distanceFactor={0.8} 
        position={[0, 0, 0.09]} 
        occlude
      >
        <div className="w-[390px] h-[844px] bg-[#0A0A0A] rounded-[40px] overflow-hidden flex flex-col items-center justify-center relative pointer-events-none select-none text-white border-[12px] border-black shadow-2xl">
           <div className="absolute top-0 w-32 h-7 bg-black rounded-b-3xl" /> {/* Dynamic Island */}
           
           <div className="w-40 h-40 rounded-full border-4 border-primary border-t-transparent animate-spin absolute" />
           <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center z-10 backdrop-blur-md">
              <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
           </div>
           
           <div className="mt-48 text-3xl font-extrabold tracking-tight text-white">Listening...</div>
           <div className="mt-2 text-white/50 text-xl font-medium">VoiceContract Mobile</div>
           
           <div className="absolute bottom-12 w-full px-12 flex justify-between items-center">
              <div className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-md" />
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                 <div className="w-8 h-8 bg-white rounded-md" />
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-md" />
           </div>
        </div>
      </Html>
    </group>
  );
}

function GlowingContract(props: any) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
      ref.current.position.y = Math.sin(clock.getElapsedTime()) * 0.1 + 1; // gentle bob
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
          chromaticAberration={0.5} 
          anisotropy={0.5} 
          distortion={0.1} 
          distortionScale={0.5} 
          color="#ffffff" 
        />
      </RoundedBox>
      
      {/* High-Fidelity Projected Contract UI */}
      <Html transform distanceFactor={0.9} position={[0, 0, 0.03]} occlude>
        <div className="w-[600px] h-[840px] bg-white rounded-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] p-12 text-black pointer-events-none select-none border border-gray-200">
           <div className="border-b-2 border-gray-900 pb-4 mb-8 flex justify-between items-end">
             <h1 className="text-4xl font-serif font-bold">Master Service Agreement</h1>
             <div className="w-16 h-16 border-4 border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-bold rotate-12 opacity-80">SEAL</div>
           </div>
           <div className="space-y-6 text-gray-800 text-lg leading-relaxed font-serif">
             <div className="w-full h-6 bg-gray-200 rounded" />
             <div className="w-5/6 h-6 bg-gray-200 rounded" />
             <div className="w-full h-6 bg-gray-200 rounded" />
             <div className="w-4/6 h-6 bg-gray-200 rounded" />
             <div className="w-full h-6 bg-gray-200 rounded" />
             <div className="w-3/6 h-6 bg-gray-200 rounded" />
             <div className="w-full h-6 bg-gray-200 rounded" />
           </div>
           <div className="absolute bottom-12 left-12 right-12 flex justify-between border-t border-gray-300 pt-8">
             <div className="w-48 border-b border-gray-400 pb-2 font-serif text-sm text-gray-500">Provider Signature</div>
             <div className="w-48 border-b border-gray-400 pb-2 font-serif text-sm text-gray-500 text-right">Client Signature</div>
           </div>
        </div>
      </Html>
    </group>
  );
}

function SineWaveStream({ start, end, color = "#2563EB", segments = 100 }: any) {
  const lineRef = useRef<any>(null);
  const points = useMemo(() => new Array(segments).fill(0).map(() => new THREE.Vector3()), [segments]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const time = clock.getElapsedTime() * 3; // Speed
    
    // Calculate bezier curve base path
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 1.5; // Arc height
    
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      // Quadratic Bezier interpolation
      const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
      let y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
      const z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;

      // Add Sine Wave Math for audio visualization
      // Amplitude is highest in the middle (t=0.5) and tapers at ends
      const envelope = Math.sin(t * Math.PI); 
      const noise = Math.sin(t * 20 - time) * 0.4 * envelope;
      const noise2 = Math.cos(t * 35 + time * 1.5) * 0.2 * envelope;

      points[i].set(x, y + noise + noise2, z);
    }
    lineRef.current.setPoints(points);
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={4}
      transparent
      opacity={0.6}
    />
  );
}

function Scene() {
  const laptopRef = useRef<THREE.Group>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);
  const contractRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const scrollY = window.scrollY;
    // The main page has a pinned scroll trigger of 2000px
    const progress = Math.min(Math.max(scrollY / 2000, 0), 1);
    
    if (laptopRef.current && phoneRef.current && wavesRef.current && contractRef.current) {
      // Stage 1: Devices are far apart and rotated
      // Stage 2: Devices move to center, waves appear, contract scales up
      laptopRef.current.position.x = THREE.MathUtils.lerp(-12, -5, progress);
      phoneRef.current.position.x = THREE.MathUtils.lerp(12, 5, progress);
      
      laptopRef.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0, progress);
      phoneRef.current.rotation.y = THREE.MathUtils.lerp(0.5, 0, progress);

      // Waves appear half-way through the scroll
      wavesRef.current.visible = progress > 0.4;
      
      // Contract materializes
      const contractScale = progress > 0.6 ? THREE.MathUtils.lerp(0, 1, (progress - 0.6) * 2.5) : 0;
      contractRef.current.scale.set(contractScale, contractScale, contractScale);
    }
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, 10, -5]} intensity={1} color="#2563EB" />

      {/* The Devices */}
      <group ref={laptopRef} position={[-12, -1, -2]}>
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <RealisticLaptop rotation={[0, 0.6, 0]} />
        </Float>
      </group>

      <group ref={phoneRef} position={[12, -0.5, 2]}>
        <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.8}>
          <RealisticPhone rotation={[0, -0.6, 0]} />
        </Float>
      </group>

      {/* The Central Document */}
      <group ref={contractRef} position={[0, 1, 0]} scale={0}>
        <GlowingContract />
      </group>

      {/* The Dynamic Audio Waves connecting them */}
      <group ref={wavesRef} visible={false}>
        <SineWaveStream start={new THREE.Vector3(5, -0.5, 2)} end={new THREE.Vector3(0, 1, 0)} color="#2563EB" />
        <SineWaveStream start={new THREE.Vector3(5, -0.5, 2)} end={new THREE.Vector3(0, 1, 0)} color="#00C2CC" />
        <SineWaveStream start={new THREE.Vector3(-5, -1, -2)} end={new THREE.Vector3(0, 1, 0)} color="#2563EB" />
      </group>

      <ContactShadows position={[0, -3, 0]} opacity={0.3} scale={20} blur={2} far={4} />
    </>
  );
}

export function Mini3D({ mode }: { mode: 'mic' | 'lock' | 'seal' }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-transparent">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
           {mode === 'mic' && (
             <mesh>
               <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
               <meshStandardMaterial color="#2563EB" metalness={0.8} roughness={0.2} />
               <mesh position={[0, 1, 0]}>
                 <sphereGeometry args={[0.5, 32, 32]} />
                 <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
               </mesh>
             </mesh>
           )}
           {mode === 'lock' && (
             <group>
               <RoundedBox args={[1.5, 1.2, 0.5]} radius={0.1} smoothness={4} position={[0, -0.2, 0]}>
                 <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
               </RoundedBox>
               <mesh position={[0, 0.8, 0]}>
                 <torusGeometry args={[0.5, 0.15, 16, 100, Math.PI]} />
                 <meshStandardMaterial color="#2563EB" metalness={0.8} roughness={0.2} />
               </mesh>
             </group>
           )}
           {mode === 'seal' && (
             <group>
               <mesh rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[1, 1, 0.2, 32]} />
                 <meshStandardMaterial color="#00C2CC" metalness={0.5} roughness={0.2} />
               </mesh>
               <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.11]}>
                 <torusGeometry args={[0.7, 0.05, 16, 100]} />
                 <meshStandardMaterial color="#fff" metalness={0.9} roughness={0.1} />
               </mesh>
             </group>
           )}
        </Float>
      </Canvas>
    </div>
  );
}

export default function Background3D({ mini, mode }: { mini?: boolean, mode?: 'mic'|'lock'|'seal' }) {
  if (mini && mode) return <Mini3D mode={mode} />;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-background">
      <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
        <Scene />
      </Canvas>
      
      {/* Fallback gradients to blend smoothly */}
      <div className="absolute top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[20vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}