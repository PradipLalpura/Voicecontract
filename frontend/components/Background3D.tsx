"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  MeshTransmissionMaterial, 
  Environment, 
  ContactShadows,
  RoundedBox,
  Html
} from "@react-three/drei";
import * as THREE from "three";

// --- Constants ---
const PIN_DEPTH = 3000; // Total scroll depth for the hero animation

// --- Hyper-Realistic 3D Models ---

function RealisticLaptop(props: any) {
  return (
    <group {...props} scale={1.2}>
      {/* Base/Keyboard Deck */}
      <RoundedBox args={[5.2, 0.15, 3.6]} radius={0.05} smoothness={8} position={[0, -0.075, 0]}>
        <meshPhysicalMaterial 
          color="#d1d5db" 
          metalness={0.95} 
          roughness={0.15} 
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
      
      {/* Keyboard Indentation */}
      <RoundedBox args={[4.8, 0.05, 1.8]} radius={0.02} smoothness={4} position={[0, 0, -0.6]}>
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </RoundedBox>
      
      {/* Trackpad */}
      <RoundedBox args={[1.8, 0.02, 1.2]} radius={0.05} smoothness={4} position={[0, 0, 1.05]}>
        <meshPhysicalMaterial color="#9ca3af" roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Screen Lid (Hinged) */}
      <group position={[0, 0, -1.7]} rotation={[0.2, 0, 0]}>
        {/* Aluminum Lid Back */}
        <RoundedBox args={[5.2, 3.4, 0.1]} radius={0.05} smoothness={8} position={[0, 1.7, -0.05]}>
           <meshPhysicalMaterial color="#d1d5db" metalness={0.95} roughness={0.15} clearcoat={1} />
        </RoundedBox>
        {/* Glass Screen Bezel */}
        <RoundedBox args={[5.1, 3.3, 0.02]} radius={0.05} smoothness={8} position={[0, 1.7, 0.01]}>
           <meshPhysicalMaterial color="#000000" metalness={1} roughness={0} clearcoat={1} />
        </RoundedBox>
        
        {/* HTML Projection: Real Dashboard UI */}
        <Html 
          transform 
          distanceFactor={1.15} 
          position={[0, 1.7, 0.03]} 
          occlude="blending"
        >
          <div className="w-[1024px] h-[640px] bg-slate-50 rounded-lg overflow-hidden flex flex-col pointer-events-none select-none border-2 border-slate-800 shadow-2xl">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-8 gap-4">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400"/>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400"/>
                <div className="w-3.5 h-3.5 rounded-full bg-green-400"/>
              </div>
              <div className="bg-slate-100 flex-1 h-9 rounded-md flex items-center justify-center text-slate-500 text-sm font-semibold tracking-wide">
                app.voicecontract.ai / interception
              </div>
            </div>
            <div className="flex-1 p-10 flex gap-10">
               <div className="w-72 flex flex-col gap-5">
                 <div className="h-12 bg-blue-600 rounded-xl flex items-center px-6 text-white font-bold tracking-widest text-xs uppercase shadow-md shadow-blue-200">Recording Active</div>
                 <div className="h-12 bg-white rounded-xl border border-slate-200 shadow-sm" />
                 <div className="h-12 bg-white rounded-xl border border-slate-200 shadow-sm" />
                 <div className="flex-1 rounded-2xl border-2 border-slate-200 border-dashed mt-8 p-8 flex flex-col gap-4">
                    <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded-full" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded-full" />
                 </div>
               </div>
               <div className="flex-1 flex flex-col gap-8">
                 <div className="flex justify-between items-center">
                   <div className="text-4xl font-black text-slate-900 tracking-tighter">Acme Corp Meeting</div>
                   <div className="flex items-center gap-3 px-5 py-2.5 bg-red-50 text-red-600 rounded-full font-bold text-sm ring-1 ring-red-100">
                     <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /> Live
                   </div>
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 relative overflow-hidden shadow-inner flex flex-col justify-end">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                    <div className="text-3xl text-slate-800 leading-[1.4] font-medium tracking-tight z-10">
                      "Yes, the deliverables include the 3D assets and source code. The total fee is <span className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-bold">$15,000 USD</span>, paid upon completion."
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
    <group {...props} scale={1.4}>
      {/* Stainless Steel Chassis */}
      <RoundedBox args={[1.65, 3.4, 0.18]} radius={0.25} smoothness={8}>
        <meshPhysicalMaterial 
          color="#1f2937" 
          metalness={1} 
          roughness={0.1} 
          reflectivity={1} 
          clearcoat={1}
        />
      </RoundedBox>
      
      {/* Screen Panel */}
      <mesh position={[0, 0, 0.091]}>
        <planeGeometry args={[1.52, 3.25]} />
        <meshPhysicalMaterial color="#000000" metalness={1} roughness={0} clearcoat={1} />
      </mesh>
      
      {/* HTML Interface */}
      <Html 
        transform 
        distanceFactor={0.8} 
        position={[0, 0, 0.1]} 
        occlude="blending"
      >
        <div className="w-[390px] h-[844px] bg-[#050505] rounded-[54px] overflow-hidden flex flex-col items-center justify-center relative pointer-events-none select-none text-white border-[14px] border-slate-900 shadow-2xl">
           <div className="absolute top-0 w-36 h-8 bg-black rounded-b-[24px] z-20" /> {/* Dynamic Island */}
           
           <div className="w-56 h-56 rounded-full border-[8px] border-blue-500/10 border-t-blue-500 animate-spin absolute" />
           <div className="w-40 h-40 bg-blue-500/10 rounded-full flex items-center justify-center z-10 backdrop-blur-3xl shadow-[0_0_80px_rgba(59,130,246,0.2)] border border-white/10">
              <svg className="w-16 h-16 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
           </div>
           
           <div className="mt-64 text-5xl font-black tracking-tighter text-white uppercase italic">Active</div>
           <div className="mt-4 text-white/40 text-xl font-bold uppercase tracking-[0.4em]">Listening...</div>
           
           <div className="absolute bottom-16 w-full px-16 flex justify-between items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full backdrop-blur-xl border border-white/10" />
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.5)]">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm" />
              </div>
              <div className="w-16 h-16 bg-white/5 rounded-full backdrop-blur-xl border border-white/10" />
           </div>
        </div>
      </Html>
    </group>
  );
}

function RealisticContract(props: any) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.1;
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.08 + 1.2;
    }
  });

  return (
    <group ref={ref} {...props} scale={1.6}>
      {/* The Glass Paper Block */}
      <RoundedBox args={[3.2, 4.4, 0.08]} radius={0.04} smoothness={4}>
        <MeshTransmissionMaterial 
          backside 
          samples={16} 
          thickness={0.2} 
          roughness={0.05} 
          chromaticAberration={0.05} 
          anisotropy={1} 
          distortion={0} 
          color="#ffffff" 
        />
      </RoundedBox>
      
      {/* The Physical Paper Layer */}
      <mesh position={[0, 0, 0.041]}>
         <planeGeometry args={[3.1, 4.3]} />
         <meshStandardMaterial color="#f8fafc" roughness={1} metalness={0} />
      </mesh>

      {/* Contract Content Projection */}
      <Html transform distanceFactor={1.1} position={[0, 0, 0.045]} occlude="blending">
        <div className="w-[600px] h-[840px] bg-white rounded-md p-16 text-black pointer-events-none select-none border border-slate-200 shadow-xl flex flex-col">
           <div className="border-b-4 border-slate-900 pb-8 mb-12 flex justify-between items-end">
             <div>
                <div className="text-xl font-bold text-slate-400 tracking-widest uppercase mb-2">VoiceContract Legal_AI</div>
                <h1 className="text-6xl font-black tracking-tighter uppercase italic">Master_Agreement</h1>
             </div>
             <div className="w-24 h-24 border-[6px] border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-black rotate-12 opacity-80 text-xl tracking-widest shadow-inner shadow-blue-100 bg-blue-50/50">MINTED</div>
           </div>
           
           <div className="space-y-8 flex-1">
             <div className="w-full h-6 bg-slate-100 rounded" />
             <div className="w-11/12 h-6 bg-slate-100 rounded" />
             <div className="w-full h-6 bg-slate-100 rounded" />
             <div className="w-4/5 h-6 bg-slate-50 rounded" />
             <div className="w-full h-6 bg-slate-50 rounded" />
             <div className="w-3/4 h-6 bg-slate-100 rounded" />
             <div className="w-full h-6 bg-slate-100 rounded" />
             <div className="w-2/3 h-6 bg-blue-50 rounded" />
           </div>

           <div className="mt-20 pt-12 border-t-4 border-slate-100 flex justify-between items-center">
             <div className="flex flex-col gap-3 w-64">
                <div className="w-full h-16 bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden relative shadow-inner">
                   <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                   <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-[0.3em]">E-Sign Pending</div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Provider_Signature</span>
             </div>
             <div className="flex flex-col gap-3 items-end w-64">
                <div className="w-full h-16 bg-slate-50 border-2 border-slate-200 rounded-xl shadow-inner" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Client_Signature</span>
             </div>
           </div>
        </div>
      </Html>
    </group>
  );
}

// --- 100% Crash-Proof BufferGeometry Wave Engine ---
function CrashProofWave({ start, end, color, phaseOffset = 0, amp = 1 }: any) {
  const pointsCount = 120;
  // Initialize typed array once
  const positions = useMemo(() => new Float32Array(pointsCount * 3), [pointsCount]);
  const geomRef = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }) => {
    if (!geomRef.current) return;
    const time = clock.getElapsedTime() * 3;
    
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 1.5; // Arc height

    for (let i = 0; i < pointsCount; i++) {
      const t = i / (pointsCount - 1);
      
      // Base bezier
      const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
      const baseY = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
      const z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;

      // Pulse envelope
      const envelope = Math.sin(t * Math.PI) ** 2;
      
      // Frequency noise
      const wave = Math.sin(t * 20 - time + phaseOffset) * 0.5 * envelope * amp;
      const wave2 = Math.cos(t * 30 + time * 1.5 + phaseOffset) * 0.2 * envelope * amp;

      positions[i * 3] = x;
      positions[i * 3 + 1] = baseY + wave + wave2;
      positions[i * 3 + 2] = z;
    }
    
    // Explicitly update the position attribute (Cannot crash with setPoints error)
    geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <line>
      <bufferGeometry ref={geomRef} />
      <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={3} />
    </line>
  );
}

function Scene() {
  const laptopRef = useRef<THREE.Group>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);
  const contractRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
    
    if (laptopRef.current && phoneRef.current && wavesRef.current && contractRef.current) {
      // Stage 1: Devices start WAY OUT at the edges, below the text
      // Stage 2: Devices move to center framing contract
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      laptopRef.current.position.x = THREE.MathUtils.lerp(-25, -6, ease);
      laptopRef.current.position.y = THREE.MathUtils.lerp(-5, -0.5, ease);
      laptopRef.current.position.z = THREE.MathUtils.lerp(-10, -2, ease);
      laptopRef.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0.4, ease);
      laptopRef.current.rotation.x = THREE.MathUtils.lerp(0.5, 0.1, ease);

      phoneRef.current.position.x = THREE.MathUtils.lerp(25, 6, ease);
      phoneRef.current.position.y = THREE.MathUtils.lerp(-5, -0.2, ease);
      phoneRef.current.position.z = THREE.MathUtils.lerp(10, 2, ease);
      phoneRef.current.rotation.y = THREE.MathUtils.lerp(0.5, -0.4, ease);
      phoneRef.current.rotation.x = THREE.MathUtils.lerp(0.2, 0, ease);

      // Waves appear smoothly as devices converge
      const waveOpacity = Math.max(0, (progress - 0.4) * 2);
      wavesRef.current.visible = waveOpacity > 0;
      wavesRef.current.scale.setScalar(waveOpacity); // Scale waves in
      
      // Contract materializes in the center
      const cScale = progress > 0.6 ? THREE.MathUtils.lerp(0, 1, (progress - 0.6) * 2.5) : 0;
      contractRef.current.scale.setScalar(cScale);
      contractRef.current.position.y = THREE.MathUtils.lerp(5, 1.2, Math.min(1, (progress - 0.6) * 2.5));
    }
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={2} color="#ffffff" castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={1.5} color="#2563EB" />

      {/* The Devices */}
      <group ref={laptopRef}>
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <RealisticLaptop />
        </Float>
      </group>

      <group ref={phoneRef}>
        <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.8}>
          <RealisticPhone />
        </Float>
      </group>

      {/* The Central Document */}
      <group ref={contractRef} scale={0}>
        <RealisticContract />
      </group>

      {/* The Crash-Proof Audio Waves connecting them */}
      <group ref={wavesRef} visible={false}>
        <CrashProofWave start={new THREE.Vector3(6, -0.2, 2)} end={new THREE.Vector3(0, 1.4, 0)} color="#2563EB" phaseOffset={0} amp={1.2} />
        <CrashProofWave start={new THREE.Vector3(6, -0.2, 2)} end={new THREE.Vector3(0, 1.4, 0)} color="#60A5FA" phaseOffset={2} amp={0.6} />
        <CrashProofWave start={new THREE.Vector3(-6, -0.5, -2)} end={new THREE.Vector3(0, 1.4, 0)} color="#2563EB" phaseOffset={1} amp={1.2} />
        <CrashProofWave start={new THREE.Vector3(-6, -0.5, -2)} end={new THREE.Vector3(0, 1.4, 0)} color="#93C5FD" phaseOffset={3} amp={0.5} />
      </group>

      <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={30} blur={2.5} far={6} />
    </>
  );
}

export function Mini3D({ mode }: { mode: 'mic' | 'lock' | 'seal' }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-transparent">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <Environment preset="city" />
        <Float speed={4} rotationIntensity={0.6} floatIntensity={1.2}>
           {mode === 'mic' && (
             <group>
               <mesh><cylinderGeometry args={[0.5, 0.5, 1.4, 32]} /><meshPhysicalMaterial color="#2563EB" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
               <mesh position={[0, 0.8, 0]}><sphereGeometry args={[0.55, 32, 32]} /><meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} clearcoat={1} /></mesh>
             </group>
           )}
           {mode === 'lock' && (
             <group>
               <RoundedBox args={[1.4, 1.1, 0.5]} radius={0.15} position={[0, -0.2, 0]}><meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} clearcoat={1} /></RoundedBox>
               <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.45, 0.12, 16, 100, Math.PI]} /><meshPhysicalMaterial color="#2563EB" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
             </group>
           )}
           {mode === 'seal' && (
             <group rotation={[Math.PI/2, 0, 0]}>
               <mesh><cylinderGeometry args={[0.9, 0.9, 0.15, 32]} /><meshPhysicalMaterial color="#00C2CC" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
               <mesh position={[0, 0.1, 0]}><torusGeometry args={[0.6, 0.04, 16, 100]} /><meshPhysicalMaterial color="#fff" metalness={0.9} roughness={0.1} clearcoat={1} /></mesh>
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
      <Canvas camera={{ position: [0, 2, 15], fov: 40 }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
      <div className="absolute top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[25vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
