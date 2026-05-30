"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  Environment, 
  ContactShadows,
  RoundedBox,
  Html
} from "@react-three/drei";
import * as THREE from "three";

// --- Constants ---
const PIN_DEPTH = 3000; // Total scroll depth for the hero animation

// --- Shared Constants for Waves ---
const waveConfig = [
  { start: new THREE.Vector3(6, -0.2, 2), end: new THREE.Vector3(0, 1.4, 0), color: "#2563EB", phaseOffset: 0, amp: 1.2 },
  { start: new THREE.Vector3(6, -0.2, 2), end: new THREE.Vector3(0, 1.4, 0), color: "#60A5FA", phaseOffset: 2, amp: 0.6 },
  { start: new THREE.Vector3(-6, -0.5, -2), end: new THREE.Vector3(0, 1.4, 0), color: "#2563EB", phaseOffset: 1, amp: 1.2 },
  { start: new THREE.Vector3(-6, -0.5, -2), end: new THREE.Vector3(0, 1.4, 0), color: "#93C5FD", phaseOffset: 3, amp: 0.5 },
];

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
          distanceFactor={4.5} 
          position={[0, 1.7, 0.03]} 
          occlude="blending"
        >
          <div className="w-[960px] h-[600px] bg-slate-50 rounded-lg overflow-hidden flex flex-col pointer-events-none select-none border-2 border-slate-800 shadow-2xl" style={{ transform: 'scale(0.97)' }}>
            <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"/>
                <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                <div className="w-3 h-3 rounded-full bg-green-400"/>
              </div>
              <div className="bg-slate-100 flex-1 h-8 rounded-md flex items-center justify-center text-slate-500 text-xs font-semibold tracking-wide uppercase">
                vault.antarik.ai / active_session
              </div>
            </div>
            <div className="flex-1 p-8 flex gap-8">
               <div className="w-64 flex flex-col gap-4">
                 <div className="h-12 bg-blue-600 rounded-lg flex items-center px-6 text-white font-black tracking-widest text-[9px] uppercase shadow-md shadow-blue-200">Legal_Audit_Active</div>
                 <div className="h-12 bg-white rounded-lg border border-slate-200 shadow-sm" />
                 <div className="h-12 bg-white rounded-lg border border-slate-200 shadow-sm" />
                 <div className="flex-1 rounded-[24px] border-2 border-slate-200 border-dashed mt-4 p-8 flex flex-col gap-4">
                    <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded-full" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded-full" />
                 </div>
               </div>
               <div className="flex-1 flex flex-col gap-6">
                 <div className="flex justify-between items-center">
                   <div className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Client_Encounter</div>
                   <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-full font-black text-[9px] uppercase tracking-widest ring-1 ring-red-100">
                     <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /> Intercepting
                   </div>
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 relative overflow-hidden shadow-inner flex flex-col justify-end">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                    <div className="text-3xl text-slate-800 leading-[1.3] font-bold tracking-tight z-10">
                      "Yes, we'll deliver the <span className="text-blue-600">source code</span>. Total fee is <span className="bg-blue-100 px-2 py-1 rounded-md text-blue-700">₹75,000</span>, paid upfront."
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
        distanceFactor={3.8} 
        position={[0, 0, 0.1]} 
        occlude="blending"
      >
        <div className="w-[390px] h-[844px] bg-[#050505] rounded-[48px] overflow-hidden flex flex-col items-center justify-center relative pointer-events-none select-none text-white border-[14px] border-slate-900 shadow-2xl">
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
      // Refined float animation
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.03;
    }
  });

  return (
    <group ref={ref} {...props} scale={1.6}>
      {/* The Glass Paper Block */}
      <RoundedBox args={[3.2, 4.4, 0.08]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial
          color="#f0f4ff"
          metalness={0.05}
          roughness={0.08}
          transmission={0.92}
          thickness={0.3}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.5}
          attenuationColor="#c7d8ff"
          attenuationDistance={2}
        />
      </RoundedBox>
      
      {/* The Physical Paper Layer */}
      <mesh position={[0, 0, 0.041]}>
         <planeGeometry args={[3.1, 4.3]} />
         <meshStandardMaterial color="#f8fafc" roughness={1} metalness={0} />
      </mesh>

      {/* Contract Content Projection */}
      <Html transform distanceFactor={3.8} position={[0, 0, 0.045]} occlude="blending">
        <div className="w-[800px] h-[1120px] bg-white rounded-md p-20 text-black pointer-events-none select-none border border-slate-200 shadow-xl flex flex-col items-center overflow-hidden">
           <div className="border-b-8 border-slate-900 pb-10 mb-16 flex justify-between items-end w-full">
             <div>
                <div className="text-2xl font-bold text-slate-400 tracking-[0.3em] uppercase mb-4">VoiceContract Legal_AI</div>
                <h1 className="text-7xl font-black tracking-tighter uppercase italic">Master_Agreement</h1>
             </div>
             <div className="w-32 h-32 border-[10px] border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-black rotate-12 opacity-80 text-2xl tracking-widest shadow-inner shadow-blue-100 bg-blue-50/50">MINTED</div>
           </div>
           
           <div className="space-y-12 flex-1 w-full">
             <div className="w-full h-8 bg-slate-100 rounded-lg" />
             <div className="w-11/12 h-8 bg-slate-100 rounded-lg" />
             <div className="w-full h-8 bg-slate-100 rounded-lg" />
             <div className="w-4/5 h-8 bg-slate-50 rounded-lg" />
             <div className="w-full h-8 bg-slate-50 rounded-lg" />
             <div className="w-3/4 h-8 bg-slate-100 rounded-lg" />
             <div className="w-full h-8 bg-slate-100 rounded-lg" />
             <div className="w-2/3 h-10 bg-blue-50 rounded-lg" />
             <div className="w-full h-8 bg-slate-50 rounded-lg" />
             <div className="w-5/6 h-8 bg-slate-50 rounded-lg" />
           </div>

           <div className="mt-24 pt-16 border-t-8 border-slate-100 flex justify-between items-center w-full">
             <div className="flex flex-col gap-4 w-72">
                <div className="w-full h-24 bg-slate-50 border-4 border-slate-200 rounded-2xl overflow-hidden relative shadow-inner">
                   <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                   <div className="w-full h-full flex items-center justify-center text-sm font-black text-slate-400 uppercase tracking-[0.4em]">E-Sign Pending</div>
                </div>
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Provider_Signature</span>
             </div>
             <div className="flex flex-col gap-4 items-end w-72">
                <div className="w-full h-24 bg-slate-50 border-4 border-slate-200 rounded-2xl shadow-inner" />
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Client_Signature</span>
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
  
  // Initialize typed array and attribute once
  const positionAttribute = useMemo(() => {
    const attr = new THREE.BufferAttribute(new Float32Array(pointsCount * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [pointsCount]);
  
  const mid = useMemo(() => {
    const m = start.clone().lerp(end, 0.5);
    m.y += 1.5;
    return m;
  }, [start, end]);

  const geomRef = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }) => {
    if (!geomRef.current) return;
    const time = clock.getElapsedTime() * 3;

    const positions = positionAttribute.array as Float32Array;

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
    
    positionAttribute.needsUpdate = true;
    if (!geomRef.current.hasAttribute('position')) {
      geomRef.current.setAttribute('position', positionAttribute);
    }
  });

  return (
    <line>
      <bufferGeometry ref={geomRef} />
      <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={3} />
    </line>
  );
}

function FloatingTerms() {
  const terms = [
    { text: "₹75,000", delay: 0 },
    { text: "source code", delay: 0.05 },
    { text: "3 weeks", delay: 0.1 },
    { text: "IP rights", delay: 0.15 },
    { text: "2 revisions", delay: 0.2 },
  ];
  
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
    
    // Terms are visible only during ACT 3 (20-40%) and ACT 4 convergence (40-55%)
    const visibility = progress > 0.2 && progress < 0.55;
    
    if (groupRef.current) {
        groupRef.current.visible = visibility;
    }
    
    if (!visibility) return;

    // During 40-55%, terms accelerate toward center (convergence)
    const convergeProgress = progress > 0.4 
      ? Math.min(1, (progress - 0.4) / 0.15) 
      : 0;
      
    if (groupRef.current) {
        groupRef.current.children.forEach((child, i) => {
            const term = terms[i];
            const angle = (i / terms.length) * Math.PI - Math.PI / 2;
            const radius = 5 - convergeProgress * 5; // Collapse to center
            const x = Math.cos(angle) * radius;
            const y = 2 + Math.sin(angle) * 2 - convergeProgress * 1;
            const z = Math.sin(i * 1.5) * 2 * (1 - convergeProgress);
            
            child.position.set(x, y, z);
        });
    }
  });

  return (
    <group ref={groupRef}>
      {terms.map((term, i) => {
        return (
          <Html
            key={i}
            center
            style={{
                transition: 'opacity 0.1s ease',
            }}
          >
            <TermHTML term={term} />
          </Html>
        );
      })}
    </group>
  );
}

function TermHTML({ term }: { term: any }) {
    const divRef = useRef<HTMLDivElement>(null);
    useFrame(() => {
        if (!divRef.current) return;
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
        
        const convergeProgress = progress > 0.4 
          ? Math.min(1, (progress - 0.4) / 0.15) 
          : 0;
          
        const fadeIn = Math.min(1, Math.max(0, 
          (progress - 0.2 - term.delay) * 10
        ));
        
        const opacity = fadeIn * (1 - convergeProgress * 0.5);
        divRef.current.style.opacity = opacity.toString();
    });
    
    return (
        <div ref={divRef} className="px-4 py-2 bg-blue-500/10 backdrop-blur-md 
          border border-blue-400/20 rounded-full text-blue-400 
          text-sm font-bold whitespace-nowrap
          shadow-[0_0_20px_rgba(37,99,235,0.15)]" style={{ opacity: 0 }}>
          {term.text}
        </div>
    );
}

function AmbientParticles({ count = 60 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  
  const { basePositions } = useMemo(() => {
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (Math.random() - 0.5) * 40;
      base[i * 3 + 1] = (Math.random() - 0.5) * 25;
      base[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return { basePositions: base };
  }, [count]);
  
  const posAttr = useMemo(() => {
    const attr = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
      
    const arr = posAttr.array as Float32Array;
    const time = clock.getElapsedTime();
    
    // During ACT 3 (progress 0.2–0.4), particles stream toward center
    const streamIntensity = progress > 0.2 && progress < 0.55 
      ? Math.min(1, (progress - 0.2) * 3)
      : 0;
    
    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      
      // Natural floating motion
      const floatX = Math.sin(time * 0.3 + i * 0.7) * 0.5;
      const floatY = Math.cos(time * 0.2 + i * 1.1) * 0.3;
      
      // Stream toward center during intelligence phase
      const targetX = bx + floatX - bx * streamIntensity * 0.6;
      const targetY = by + floatY - (by - 2) * streamIntensity * 0.4;
      const targetZ = bz - bz * streamIntensity * 0.5;
      
      arr[i * 3] = targetX;
      arr[i * 3 + 1] = targetY;
      arr[i * 3 + 2] = targetZ;
    }
    posAttr.needsUpdate = true;
    
    // Gentle overall rotation
    mesh.current.rotation.y = time * 0.015;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <primitive attach="attributes-position" object={posAttr} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#2563EB"
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  const laptopRef = useRef<THREE.Group>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);
  const contractRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sceneGroupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      // Normalize to -1 to 1
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  useFrame(() => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
    
    if (sceneGroupRef.current) {
        // Very subtle rotation — 0.02 radians max (about 1 degree)
        sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          sceneGroupRef.current.rotation.y,
          mouseRef.current.x * 0.02,
          0.05  // Smooth damping
        );
        sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          sceneGroupRef.current.rotation.x,
          -mouseRef.current.y * 0.015,
          0.05
        );
    }
    
    if (laptopRef.current && phoneRef.current && wavesRef.current && contractRef.current) {
      // Stage 1 (0 to 0.35): Devices move to center
      // Stage 2 (0.35 to 0.65): Hold in center
      // Stage 3 (0.65 to 1.0): Fly backwards and disappear
      
      let ease = 0;
      let exitProgress = 0;
      
      if (progress < 0.35) {
         ease = 1 - Math.pow(1 - (progress / 0.35), 3); // Cubic ease out for entry
         exitProgress = 0;
      } else if (progress < 0.65) {
         ease = 1; // Hold
         exitProgress = 0;
      } else {
         ease = 1;
         exitProgress = Math.pow((progress - 0.65) / 0.35, 2); // Ease in for exit
      }

      // Base positions (Entry)
      const lx = THREE.MathUtils.lerp(-25, -6, ease);
      const ly = THREE.MathUtils.lerp(-5, -0.5, ease);
      const lz = THREE.MathUtils.lerp(-10, -2, ease);
      const px = THREE.MathUtils.lerp(25, 6, ease);
      const py = THREE.MathUtils.lerp(-5, -0.2, ease);
      const pz = THREE.MathUtils.lerp(10, 2, ease);

      // Exit offsets (fly back)
      const flyBackZ = -30 * exitProgress;
      const flyBackY = 10 * exitProgress;

      laptopRef.current.position.set(lx, ly + flyBackY, lz + flyBackZ);
      laptopRef.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0.4, ease);
      laptopRef.current.rotation.x = THREE.MathUtils.lerp(0.5, 0.1, ease);

      phoneRef.current.position.set(px, py + flyBackY, pz + flyBackZ);
      phoneRef.current.rotation.y = THREE.MathUtils.lerp(0.5, -0.4, ease);
      phoneRef.current.rotation.x = THREE.MathUtils.lerp(0.2, 0, ease);

      // Waves appear during hold, disappear on exit
      let waveOpacity = 0;
      if (progress > 0.25 && progress < 0.65) {
         waveOpacity = Math.min(1, (progress - 0.25) * 4);
      } else if (progress >= 0.65) {
         waveOpacity = Math.max(0, 1 - exitProgress * 2);
      }
      wavesRef.current.visible = waveOpacity > 0;
      wavesRef.current.scale.setScalar(waveOpacity);
      
      // Contract materializes in the center, flies back on exit
      let cScale = 0;
      if (progress > 0.3) {
         cScale = Math.min(1, (progress - 0.3) * 4);
      }
      if (progress >= 0.65) {
         cScale = Math.max(0, 1 - exitProgress * 3);
      }
      
      // Apply overshoot bounce manually
      let finalScale = cScale;
      if (cScale > 0.9 && exitProgress === 0) {
          // simple overshoot
          finalScale = cScale > 0.99 ? 1 : cScale + Math.sin((cScale - 0.9)*10) * 0.05;
      }
      
      contractRef.current.scale.setScalar(finalScale);
      contractRef.current.position.set(0, THREE.MathUtils.lerp(5, 2.0, cScale) + flyBackY, flyBackZ);
    }
  });

  return (
    <group ref={sceneGroupRef}>
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
        {waveConfig.map((cfg, idx) => (
          <CrashProofWave key={idx} start={cfg.start} end={cfg.end} color={cfg.color} phaseOffset={cfg.phaseOffset} amp={cfg.amp} />
        ))}
      </group>
      
      <FloatingTerms />
      <AmbientParticles count={80} />

      <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={30} blur={2.5} far={6} />
    </group>
  );
}

export function MicModel() {
    return (
      <group>
        <mesh><cylinderGeometry args={[0.5, 0.5, 1.4, 32]} /><meshPhysicalMaterial color="#2563EB" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
        <mesh position={[0, 0.8, 0]}><sphereGeometry args={[0.55, 32, 32]} /><meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} clearcoat={1} /></mesh>
      </group>
    );
}

export function LockModel() {
    return (
      <group>
        <RoundedBox args={[1.4, 1.1, 0.5]} radius={0.15} position={[0, -0.2, 0]}><meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.1} clearcoat={1} /></RoundedBox>
        <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.45, 0.12, 16, 100, Math.PI]} /><meshPhysicalMaterial color="#2563EB" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
      </group>
    );
}

export function SealModel() {
    return (
      <group rotation={[Math.PI/2, 0, 0]}>
        <mesh><cylinderGeometry args={[0.9, 0.9, 0.15, 32]} /><meshPhysicalMaterial color="#00C2CC" metalness={0.8} roughness={0.2} clearcoat={1} /></mesh>
        <mesh position={[0, 0.1, 0]}><torusGeometry args={[0.6, 0.04, 16, 100]} /><meshPhysicalMaterial color="#fff" metalness={0.9} roughness={0.1} clearcoat={1} /></mesh>
      </group>
    );
}

export function Feature3DGrid({ hoveredIndex }: { hoveredIndex: number | null }) {
  return (
    <div className="w-full h-[350px]">
      <Canvas camera={{ position: [0, 0, 12], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <Environment preset="city" />
        
        <group position={[-4, 0, 0]}>
          <Float speed={hoveredIndex === 0 ? 6 : 3} rotationIntensity={hoveredIndex === 0 ? 1.2 : 0.6}>
            <MicModel />
          </Float>
        </group>
        
        <group position={[0, 0, 0]}>
          <Float speed={hoveredIndex === 1 ? 5 : 2.5} rotationIntensity={hoveredIndex === 1 ? 1 : 0.5}>
            <LockModel />
          </Float>
        </group>
        
        <group position={[4, 0, 0]}>
          <Float speed={hoveredIndex === 2 ? 7 : 4} rotationIntensity={hoveredIndex === 2 ? 1.5 : 0.7}>
            <SealModel />
          </Float>
        </group>
        
        <ContactShadows position={[0, -2, 0]} opacity={0.2} scale={20} blur={2} />
      </Canvas>
    </div>
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
           {mode === 'mic' && <MicModel />}
           {mode === 'lock' && <LockModel />}
           {mode === 'seal' && <SealModel />}
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
