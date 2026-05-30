# PHASE 1 — CINEMATIC 3D ENGINE, SCROLL STORYTELLING & PREMIUM UI ELEVATION
## Model: Gemini 3.1 Pro Preview

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phase 0 (security fixes) has been completed. This phase transforms the landing page from "functional prototype" into a **jaw-dropping cinematic experience** that tells VoiceContract's story through 3D devices, scroll-driven animation, and micro-interactions.

---

## YOUR ROLE

You are a **Creative Technologist** — half Apple keynote designer, half Three.js wizard. Your mission is to make the first 10 seconds of visiting VoiceContract **unforgettable**. Every scroll pixel should reveal narrative. Every 3D device should feel like you could reach into the screen and pick it up. The landing page must answer: "What is this?" → "How does it work?" → "I need this." — in a single scroll journey.

**Design philosophy**: Think Stripe's landing page meets Apple's product reveals meets Linear's scroll storytelling. Glass, depth, precision typography, and spatial storytelling.

---

## MANDATORY READING BEFORE CODING

Read these files in FULL before writing any code:
1. `frontend/components/Background3D.tsx` (437 lines — THE critical 3D file)
2. `frontend/app/page.tsx` (209 lines — landing page layout & GSAP)
3. `frontend/app/globals.css` (50 lines — design tokens)
4. `frontend/tailwind.config.ts` (theme tokens)
5. `frontend/app/settings/[[...rest]]/page.tsx` (broken settings)
6. `frontend/app/settings/temp.tsx` (correct settings — to be promoted)

---

## THE NARRATIVE SCROLL — A 7-ACT CINEMATIC JOURNEY

The page is a **continuous camera journey** through VoiceContract's story. As the user scrolls, they don't read about the product — they **watch it happen** in 3D. The scroll IS the demo.

```
╔══════════════════════════════════════════════════════════════╗
║                   THE SCROLL NARRATIVE                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 1: THE SILENCE (0% — viewport loads)                    ║
║  ─────────────────────────────────────                       ║
║  Screen is nearly empty. Subtle particles float like dust    ║
║  in morning sunlight. A gentle ambient glow. Silence.        ║
║                                                              ║
║  Then the title reveals itself — each word sliding up        ║
║  from behind a mask, letter by letter, like a film title     ║
║  sequence:                                                   ║
║                                                              ║
║        "Verbal Deals,"                                       ║
║        "Sealed in Seconds."                                  ║
║                                                              ║
║  Above it, a small badge pulses gently:                      ║
║        ● AI-Powered Legal Engine                             ║
║                                                              ║
║  Below, the CTA button fades in with a glass glow.           ║
║  A subtle "scroll to explore" indicator breathes at the      ║
║  bottom — a thin chevron with a gentle bounce animation.     ║
║                                                              ║
║  The 3D devices are INVISIBLE at this point. The user        ║
║  doesn't know they exist yet. That's the suspense.           ║
║                                                              ║
║  🎨 Vibe: Calm. Confident. Premium.                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 2: THE MEETING BEGINS (0–20% scroll)                    ║
║  ────────────────────────────────────────                     ║
║  The hero text gently fades upward and out.                  ║
║                                                              ║
║  From the LEFT edge: the 3D laptop sweeps in with a          ║
║  smooth cubic ease. It rotates slightly as it enters,        ║
║  catching the light — you can see the aluminum shimmer.      ║
║                                                              ║
║  From the RIGHT edge: the 3D phone sweeps in. It tilts      ║
║  toward the user like someone showing you their screen.      ║
║                                                              ║
║  Both devices have their screens ON — the laptop shows       ║
║  the dashboard UI, the phone shows the "Active Listening"    ║
║  state with the pulsing mic icon.                            ║
║                                                              ║
║  A single-line subtitle fades in at the bottom:              ║
║        "Two people are in a meeting."                        ║
║                                                              ║
║  🎨 Vibe: "Something is about to happen."                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 3: THE VOICE FLOWS (20–40% scroll)                      ║
║  ───────────────────────────────────────                      ║
║  Audio wave lines BURST to life between the two devices.     ║
║  They arc gracefully through 3D space — bezier curves of     ║
║  pulsing blue light connecting laptop ↔ phone.               ║
║                                                              ║
║  Simultaneously, small floating text fragments appear        ║
║  near the audio waves — words extracted from the             ║
║  conversation:                                               ║
║                                                              ║
║     "₹75,000"   "source code"   "3 weeks"                   ║
║     "IP rights"   "2 revisions"                              ║
║                                                              ║
║  These fragments are 3D <Html> text elements positioned      ║
║  along the wave curves, slowly drifting inward toward        ║
║  the center. They glow with a soft blue aura.               ║
║                                                              ║
║  The devices drift slightly closer together.                 ║
║  A new subtitle:                                             ║
║        "AI is extracting key terms in real-time."            ║
║                                                              ║
║  Ambient particles shift from random floating to             ║
║  streaming TOWARD the center — like data being collected.    ║
║                                                              ║
║  🎨 Vibe: Energy. Intelligence. Motion.                     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 4: THE CONTRACT IS BORN (40–60% scroll)                 ║
║  ────────────────────────────────────────────                 ║
║  THIS IS THE EMOTIONAL CLIMAX.                               ║
║                                                              ║
║  The floating text fragments accelerate toward the center.   ║
║  They converge at a single point in 3D space.                ║
║                                                              ║
║  Then — a burst of light. The 3D glass contract              ║
║  MATERIALIZES from the convergence point. Not a fade-in —    ║
║  a CRYSTALLIZATION. It scales from 0 → 1 with a slight      ║
║  overshoot bounce (scale to 1.05, settle to 1.0).           ║
║                                                              ║
║  The contract has a frosted glass material with a subtle     ║
║  blue tint. The paper inside shows the MSA template with     ║
║  "MINTED" stamp. It floats gently, catching light.          ║
║                                                              ║
║  The devices frame it — laptop on the left, phone on the    ║
║  right, contract majestically centered. The audio waves     ║
║  calm down to gentle pulses.                                ║
║                                                              ║
║  A glass-morphism narrative card slides up from below:      ║
║                                                              ║
║     ┌─────────────────────────────────────┐                  ║
║     │  "The Gap is Gone."                 │                  ║
║     │                                     │                  ║
║     │  Your MSA, Invoice, and PO are      │                  ║
║     │  generated before the call ends.    │                  ║
║     └─────────────────────────────────────┘                  ║
║                                                              ║
║  🎨 Vibe: TRIUMPH. This is the "aha" moment.               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 5: THE SEAL (60–75% scroll)                             ║
║  ───────────────────────────                                 ║
║  A "signature stamp" animation plays on the contract —      ║
║  the MINTED seal glows, then a circular pulse radiates      ║
║  outward from it like a shockwave.                          ║
║                                                              ║
║  This represents the e-sign step. The contract is now       ║
║  "sealed."                                                  ║
║                                                              ║
║  The narrative card updates:                                ║
║     "Sealed. Dispatched. Protected."                        ║
║                                                              ║
║  🎨 Vibe: Closure. Finality. Trust.                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 6: THE DEPARTURE (75–100% scroll)                       ║
║  ──────────────────────────────────────                       ║
║  Everything gracefully flies away into depth:                ║
║                                                              ║
║  - Devices drift backward on the Z-axis                     ║
║  - Contract slowly rises upward and fades (ascending)       ║
║  - Audio waves dissolve into particles                      ║
║  - Particles scatter outward like a gentle explosion        ║
║  - Opacity fades smoothly from 1 → 0                        ║
║                                                              ║
║  Light streak trails follow the objects briefly —            ║
║  like comets. Then silence again.                           ║
║                                                              ║
║  The pin releases. The 3D hero section collapses.           ║
║  Normal scrolling begins.                                   ║
║                                                              ║
║  🎨 Vibe: Satisfying. Complete.                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACT 7: THE PROOF (below pin — normal scroll)                ║
║  ─────────────────────────────────────────────                ║
║  After the cinematic 3D experience, the user enters          ║
║  grounded, scrollable content sections:                      ║
║                                                              ║
║  → "How It Works" — 4-step pipeline with connected          ║
║    vertical line that fills as you scroll                    ║
║  → "Core Intelligence" — 3 feature cards with 3D icons      ║
║    in a single Canvas, hover-interactive                     ║
║  → "Ready to Transform" — final CTA with radial glow       ║
║  → Footer                                                   ║
║                                                              ║
║  🎨 Vibe: Credible. Detailed. Actionable.                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## TASK 1: Fix HTML Content Projection (Device Screen Fitting)

**File**: `frontend/components/Background3D.tsx`

**Problem**: The HTML content projected onto the 3D laptop, phone, and contract overflows the device screens. It looks "toy-like."

**Root Cause**: `distanceFactor` values in `<Html>` components are miscalibrated relative to the 3D model dimensions.

**Device 3D model dimensions** (from the code):
```
Laptop screen bezel:  5.1 x 3.3 (RoundedBox args)
Phone screen panel:   1.52 x 3.25 (planeGeometry args)
Contract glass block: 3.2 x 4.4 (RoundedBox args), paper: 3.1 x 4.3
```

**Fix approach**:

1. **Laptop**: The HTML div is 1280×800px with `distanceFactor={1.4}`. This means 1px ≈ 1.4/1280 = 0.00109 3D units. The visible width is ≈ 1280 × 0.00109 = 1.4 units — but the bezel is 5.1 units wide. There's a mismatch. 
   - **Reduce** HTML div to `960×600` and increase `distanceFactor` to approximately `4.5–5.0` so the rendered width matches the 5.1 bezel
   - Add `overflow-hidden rounded-lg` to the HTML wrapper to clip any slight overflow
   - Add `transform: scale(0.97)` CSS for slight inner padding within the bezel

2. **Phone**: HTML is 390×844px with `distanceFactor={0.8}`. 
   - Adjust `distanceFactor` to approximately `3.5–4.0` to match the 1.52 panel width
   - Add `overflow-hidden rounded-2xl` for realistic phone corner radius

3. **Contract**: HTML is 800×1120px with `distanceFactor={1.25}`.
   - Adjust `distanceFactor` to approximately `3.5–4.0` to match the 3.1 paper width
   - Center text within the contract paper boundaries

**⚠️ CALIBRATION METHOD**: Set a temporary bright red `outline: 2px solid red` on the HTML wrapper div. Adjust `distanceFactor` until the red outline aligns exactly with the 3D model screen edges. Remove the outline when calibrated.

---

## TASK 2: Fix Contract Y-Position & Float Animation

**File**: `frontend/components/Background3D.tsx`

**Problem**: The 3D contract floats too high in the viewport during the hold phase.

**Current code** (line ~350):
```javascript
contractRef.current.position.set(0, THREE.MathUtils.lerp(5, 1.2, cScale) + flyBackY, flyBackZ);
```

And in `RealisticContract` (line ~166):
```javascript
ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.05 + 0.5;
```

**Fix**:
- Camera is at `position={[0, 2, 15]}` with `fov={40}` — viewport center in 3D space is at Y ≈ 2.0
- Change the `lerp` Y target from `1.2` to `2.0` so the contract arrives at viewport center
- Change the float animation base from `+ 0.5` to `+ 0.0` (float around its set position, not offset above it)
- Reduce float amplitude slightly: `* 0.03` instead of `* 0.05` for a more subtle, premium feel
- Slow down the float frequency: `* 0.5` instead of `* 0.8` for a more luxurious, Apple-like motion

---

## TASK 3: Fix CrashProofWave Memory Leak (PRF-1)

**File**: `frontend/components/Background3D.tsx`, `CrashProofWave` component (~lines 236-280)

**Problem**: Creates a NEW `THREE.BufferAttribute` every frame — massive GC pressure.

**Current pattern in useFrame** (line 270):
```javascript
geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

**Fix**: Initialize the attribute once, update only the typed array data:
```typescript
const positionAttribute = useMemo(() => {
  const attr = new THREE.BufferAttribute(new Float32Array(POINT_COUNT * 3), 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  return attr;
}, []);

// In useFrame — update the existing array, NOT create a new attribute:
useFrame(({ clock }) => {
  if (!geomRef.current) return;
  const positions = positionAttribute.array as Float32Array;
  // ... compute positions ...
  positionAttribute.needsUpdate = true;
  if (!geomRef.current.hasAttribute('position')) {
    geomRef.current.setAttribute('position', positionAttribute);
  }
});
```

---

## TASK 4: Replace MeshTransmissionMaterial with Premium Glass (PRF-2)

**File**: `frontend/components/Background3D.tsx`, `RealisticContract` glass material (~line 174)

**Problem**: `MeshTransmissionMaterial` with `samples={16}` renders the scene 16 extra times.

**Fix**: Replace with `MeshPhysicalMaterial` configured for premium frosted glass:
```jsx
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
  transparent
  opacity={0.97}
  attenuationColor="#c7d8ff"
  attenuationDistance={2}
/>
```

This gives a **premium Apple glass** look without multi-pass rendering.

---

## TASK 5: Floating Term Fragments — The "Intelligence" Visual

**File**: `frontend/components/Background3D.tsx`

This is a NEW element that makes ACT 3 come alive. During the scroll phase where audio waves are active (20–40%), small floating text labels appear near the wave curves, representing extracted contract terms.

**Implementation**:

```tsx
function FloatingTerms({ progress }: { progress: number }) {
  const terms = [
    { text: "₹75,000", delay: 0 },
    { text: "source code", delay: 0.05 },
    { text: "3 weeks", delay: 0.1 },
    { text: "IP rights", delay: 0.15 },
    { text: "2 revisions", delay: 0.2 },
  ];
  
  // Terms are visible only during ACT 3 (20-40%) and ACT 4 convergence (40-55%)
  const visibility = progress > 0.2 && progress < 0.55;
  
  // During 40-55%, terms accelerate toward center (convergence)
  const convergeProgress = progress > 0.4 
    ? Math.min(1, (progress - 0.4) / 0.15) 
    : 0;

  return (
    <group visible={visibility}>
      {terms.map((term, i) => {
        // Start position: scattered along the wave arc
        const angle = (i / terms.length) * Math.PI - Math.PI / 2;
        const radius = 5 - convergeProgress * 5; // Collapse to center
        const x = Math.cos(angle) * radius;
        const y = 2 + Math.sin(angle) * 2 - convergeProgress * 1;
        const z = Math.sin(i * 1.5) * 2 * (1 - convergeProgress);
        
        const fadeIn = Math.min(1, Math.max(0, 
          (progress - 0.2 - term.delay) * 10
        ));
        
        return (
          <Html
            key={i}
            position={[x, y, z]}
            center
            style={{
              opacity: fadeIn * (1 - convergeProgress * 0.5),
              transition: 'none',
            }}
          >
            <div className="px-4 py-2 bg-blue-500/10 backdrop-blur-md 
              border border-blue-400/20 rounded-full text-blue-400 
              text-sm font-bold whitespace-nowrap
              shadow-[0_0_20px_rgba(37,99,235,0.15)]">
              {term.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
```

Add `<FloatingTerms progress={progress} />` to the Scene component. Pass the current scroll `progress` value from the `useFrame` callback.

**Why this matters**: This is the visual "proof" that VoiceContract understands conversations. Without it, the user just sees devices and waves. WITH it, they see **intelligence in action** — words being extracted from a conversation. This is the product demo embedded in the scroll.

---

## TASK 6: Ambient Particles — Dust, Depth, Atmosphere

**File**: `frontend/components/Background3D.tsx`

Add floating ambient particles to the entire 3D scene. They serve three purposes:
1. **Depth perception** — particles at different Z-depths create parallax
2. **Atmosphere** — like dust in sunlight, they make the scene feel "alive"
3. **Narrative aid** — during ACT 3, they stream toward the center (data collection visual)

```tsx
function AmbientParticles({ count = 60, progress = 0 }: { count?: number; progress?: number }) {
  const mesh = useRef<THREE.Points>(null);
  
  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (Math.random() - 0.5) * 40;
      base[i * 3 + 1] = (Math.random() - 0.5) * 25;
      base[i * 3 + 2] = (Math.random() - 0.5) * 20;
      pos[i * 3] = base[i * 3];
      pos[i * 3 + 1] = base[i * 3 + 1];
      pos[i * 3 + 2] = base[i * 3 + 2];
    }
    return { positions: pos, basePositions: base };
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const geo = mesh.current.geometry;
    const posAttr = geo.attributes.position;
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
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
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
```

Add `<AmbientParticles progress={progress} />` in the Scene component. The `progress` value needs to be stored in a ref so it can be passed to child components.

---

## TASK 7: Mouse-Reactive Parallax — The Scene Follows You

**File**: `frontend/components/Background3D.tsx`, Scene component

Add subtle mouse-tracking parallax to the entire scene. When the user moves their mouse, the scene tilts VERY slightly — creating a depth illusion like peering through a window.

```tsx
// Inside Scene component:
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

// In useFrame:
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
```

Wrap ALL scene content (devices, contract, waves, particles) in `<group ref={sceneGroupRef}>`. The parallax must be EXTREMELY subtle — just enough that the user subconsciously feels depth.

---

## TASK 8: Scroll Narrator Subtitles — "Cinematic Lower Thirds"

**File**: `frontend/app/page.tsx`

Add scroll-synced subtitle text that narrates each act. These are positioned at the bottom of the viewport, styled like film lower-third titles.

```tsx
// Add inside the pinned <main> section, after stage-2-content:

{/* Scroll Narrator — cinematic subtitles */}
<div className="scroll-narrator absolute bottom-12 left-0 right-0 z-30 
  flex justify-center pointer-events-none">
  <div className="narrator-text px-8 py-4 bg-white/60 backdrop-blur-xl 
    rounded-2xl border border-white/80 shadow-lg
    text-sm font-bold text-text-muted tracking-wide
    opacity-0 transform translate-y-4">
    {/* Content is controlled by GSAP */}
  </div>
</div>
```

In the GSAP timeline, animate different narrator texts at different scroll points:

```javascript
// ACT 2 subtitle
scrollTl.fromTo(".narrator-text", 
  { opacity: 0, y: 20, innerHTML: "" },
  { opacity: 1, y: 0, duration: 0.5,
    onStart: () => { naratorEl.textContent = "Two people are in a meeting." }
  }, 0.15);

// ACT 3 subtitle
scrollTl.to(".narrator-text", 
  { opacity: 0, duration: 0.3,
    onComplete: () => { naratorEl.textContent = "AI is extracting key terms in real-time." }
  }, 0.30);
scrollTl.to(".narrator-text", { opacity: 1, duration: 0.3 }, 0.32);

// ACT 4 subtitle  
scrollTl.to(".narrator-text", 
  { opacity: 0, duration: 0.3,
    onComplete: () => { naratorEl.textContent = "Your contract is being generated." }
  }, 0.48);
scrollTl.to(".narrator-text", { opacity: 1, duration: 0.3 }, 0.50);

// ACT 5 subtitle
scrollTl.to(".narrator-text",
  { opacity: 0, duration: 0.3,
    onComplete: () => { naratorEl.textContent = "Sealed. Dispatched. Protected." }
  }, 0.62);
scrollTl.to(".narrator-text", { opacity: 1, duration: 0.3 }, 0.64);

// Fade out for departure
scrollTl.to(".narrator-text", { opacity: 0, duration: 0.5 }, 0.80);
```

**Why**: Text anchors meaning to the 3D animation. Without subtitles, a first-time visitor sees beautiful shapes moving but might not understand what they represent. The narrator bridges that gap.

---

## TASK 9: Scroll Indicator — "Scroll to Explore"

**File**: `frontend/app/page.tsx`

Add a breathing scroll indicator at the bottom of the hero that disappears when the user starts scrolling:

```tsx
{/* Scroll indicator — appears only at 0% scroll */}
<div className="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 z-30 
  flex flex-col items-center gap-3 pointer-events-none">
  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-text-muted/40">
    Scroll to Explore
  </span>
  <div className="w-6 h-10 rounded-full border-2 border-text-muted/20 flex justify-center pt-2">
    <div className="w-1.5 h-3 rounded-full bg-text-muted/30 animate-bounce" />
  </div>
</div>
```

GSAP: Fade it out within the first 5% of scroll:
```javascript
scrollTl.to(".scroll-indicator", { opacity: 0, duration: 0.3 }, 0);
```

---

## TASK 10: Cinematic Hero Typography & Badge

**File**: `frontend/app/page.tsx`

### 10A: Clip-Mask Text Entrance

Split the hero title into separately animated lines for a cinematic reveal:

```tsx
<h1 className="hero-title text-[clamp(3.5rem,9vw,7.5rem)] font-black 
  tracking-[-0.04em] leading-[0.92] text-text">
  <span className="block overflow-hidden">
    <span className="inline-block hero-line-1">Verbal Deals,</span>
  </span>
  <span className="block overflow-hidden">
    <span className="inline-block hero-line-2 text-primary italic">
      Sealed in Seconds.
    </span>
  </span>
</h1>
```

GSAP: Each line slides up from behind its `overflow-hidden` mask:
```javascript
tl.fromTo(".hero-line-1", 
  { y: "110%", rotateX: 15 }, 
  { y: "0%", rotateX: 0, duration: 1.4, ease: "power4.out" }
);
tl.fromTo(".hero-line-2", 
  { y: "110%", rotateX: 15 }, 
  { y: "0%", rotateX: 0, duration: 1.4, ease: "power4.out" }, "-=0.9"
);
```

### 10B: Credibility Badge

Add a badge above the hero title:
```tsx
<div className="hero-badge inline-flex items-center gap-3 px-5 py-2.5 
  rounded-full bg-primary/5 border border-primary/15 mb-8">
  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
  <span className="text-xs font-bold text-primary uppercase tracking-widest">
    AI-Powered Legal Engine
  </span>
</div>
```

---

## TASK 11: Elevate Mini3D → Single Canvas Feature Showcase

**File**: `frontend/components/Background3D.tsx` (`Mini3D` component) and `frontend/app/page.tsx`

Merge 3 separate `<Canvas>` instances into ONE Canvas with all 3 models positioned side by side.

Create `Feature3DGrid`:

```tsx
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
```

In `page.tsx`, add hover state:
```tsx
const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

// Feature section layout:
<Feature3DGrid hoveredIndex={hoveredFeature} />
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {features.map((feat, i) => (
    <div key={i} 
      onMouseEnter={() => setHoveredFeature(i)}
      onMouseLeave={() => setHoveredFeature(null)}
      className="group p-10 rounded-[40px] bg-white/70 backdrop-blur-xl 
        border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
        hover:shadow-[0_20px_60px_rgb(37,99,235,0.12)]
        transition-all duration-500 hover:-translate-y-3 cursor-default 
        relative overflow-hidden">
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 
        to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <h3 className="relative z-10 text-xl font-black tracking-tight mb-3 
        uppercase italic group-hover:text-primary transition-colors">
        {feat.title}
      </h3>
      <p className="relative z-10 text-text-muted font-medium leading-relaxed">
        {feat.desc}
      </p>
    </div>
  ))}
</div>
```

**Result**: Hovering "Acoustic Logic" makes the 3D mic spin faster. Hovering "Zero-Trust Vault" energizes the lock. Hovering "Unforgeable Sign" accelerates the seal. **Magic connection** between 2D cards and 3D world.

---

## TASK 12: Pipeline "How It Works" — Connected Steps

**File**: `frontend/app/page.tsx`

Add a vertical connecting line between the 4 pipeline steps that fills as you scroll past each one:

```tsx
<div className="relative space-y-8">
  {/* Vertical connector line */}
  <div className="absolute left-[23px] top-8 bottom-8 w-[2px] bg-border/20">
    <div className="pipeline-fill w-full bg-gradient-to-b from-primary to-accent 
      transition-all duration-700 rounded-full" style={{ height: '0%' }} />
  </div>
  
  {steps.map((step, idx) => (
    <div key={idx} className="feature-step group flex gap-8 items-start relative">
      {/* Dot on the line */}
      <div className="w-12 h-12 rounded-full border-2 border-border/30 bg-background 
        flex items-center justify-center shrink-0 z-10 relative
        group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300">
        <span className="text-sm font-black text-text-muted 
          group-hover:text-primary transition-colors">
          {step.id}
        </span>
      </div>
      
      {/* Step card */}
      <div className="flex-1 p-8 rounded-[28px] bg-background border border-border/40 
        hover:border-primary/30 transition-all hover:shadow-apple-lg">
        <h4 className="text-xl font-black tracking-tight mb-2 text-text 
          uppercase italic">{step.title}</h4>
        <p className="text-text-muted font-medium leading-relaxed">{step.desc}</p>
      </div>
    </div>
  ))}
</div>
```

Use GSAP ScrollTrigger to animate `.pipeline-fill` height from `0%` to `100%` as the user scrolls through the section.

---

## TASK 13: Final CTA Section — "The Closer"

**File**: `frontend/app/page.tsx`

Add a powerful final CTA section between the features and footer:

```tsx
<section className="relative py-40 px-8 flex flex-col items-center text-center 
  bg-background overflow-hidden">
  {/* Radial gradient backdrop */}
  <div className="absolute inset-0 
    bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06)_0%,transparent_70%)]" />
  
  {/* Decorative rings */}
  <div className="absolute w-[600px] h-[600px] border border-primary/5 rounded-full 
    top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
  <div className="absolute w-[400px] h-[400px] border border-primary/8 rounded-full 
    top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
  
  <span className="relative z-10 text-xs font-black uppercase tracking-[0.5em] 
    text-primary mb-6">Ready_to_Transform</span>
  <h2 className="relative z-10 text-5xl md:text-6xl font-black tracking-tighter 
    text-text mb-8 leading-[0.95]">
    Your Next Meeting<br/>
    <span className="text-primary italic">Writes Itself.</span>
  </h2>
  <p className="relative z-10 text-text-muted text-xl font-medium max-w-2xl 
    mb-12 leading-relaxed">
    Join freelancers and agencies who never leave a meeting 
    without a signed contract again.
  </p>
  <div className="relative z-10">
    {renderCTA("Start Your First Session")}
  </div>
</section>
```

---

## TASK 14: CSS Micro-Animation System

**File**: `frontend/app/globals.css`

Add these premium animation utilities:

```css
/* Shimmer effect for accents */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer {
  background: linear-gradient(90deg, transparent 30%, rgba(37,99,235,0.08) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

/* Gentle float for non-3D elements */
@keyframes gentle-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
.float-gentle { animation: gentle-float 4s ease-in-out infinite; }

/* Gradient text */
.text-gradient {
  background: linear-gradient(135deg, #2563EB 0%, #00C2CC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Premium card glow border on hover */
.card-glow { position: relative; }
.card-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(37,99,235,0.2), transparent 50%, rgba(0,194,204,0.2));
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}
.card-glow:hover::before { opacity: 1; }

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Scroll-triggered fade-in utility */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.reveal-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## TASK 15: Fix Duplicate Settings Page (BRK-4, BRK-5)

**Problem**: Two settings files exist:
1. `frontend/app/settings/[[...rest]]/page.tsx` — BROKEN (uses `defaultValue`, no save handler)
2. `frontend/app/settings/temp.tsx` — CORRECT (has API calls) but NOT ROUTED

**Fix**:
1. Read `temp.tsx` fully to understand the correct implementation
2. Replace `[[...rest]]/page.tsx` content with the working implementation from `temp.tsx`
3. Ensure controlled inputs, working save, Clerk `<UserProfile>`, back navigation
4. Delete `temp.tsx` after merging
5. Apply "Titanium & Frost" styling

---

## VERIFICATION CHECKLIST

After completing all tasks:

1. **Build**: `cd frontend && npm run build` — zero errors
2. **First impression test** (incognito window):
   - [ ] Badge pulses above hero
   - [ ] Title reveals with clip-mask animation (line by line)
   - [ ] Scroll indicator breathes at bottom
   - [ ] Ambient particles float gently
3. **Scroll test** (slow, both directions):
   - [ ] ACT 1→2: Hero fades, devices sweep in from edges
   - [ ] ACT 2→3: Waves burst alive, floating terms appear ("₹75,000", "source code"...)
   - [ ] ACT 3→4: Terms converge, contract CRYSTALLIZES with overshoot bounce
   - [ ] ACT 4→5: Seal glows, pulse radiates
   - [ ] ACT 5→6: Everything fades and flies backward with opacity
   - [ ] Narrator subtitles change at each act
   - [ ] Scroll indicator disappears immediately
   - [ ] Reverse scroll restores everything
4. **Mouse parallax**: Moving mouse gently tilts the 3D scene
5. **Device screens**: Content fits within laptop/phone/contract bezels
6. **Feature section**:
   - [ ] Single Canvas with 3 icons (2 WebGL contexts total)
   - [ ] Hovering cards energizes corresponding 3D icon
   - [ ] Glassmorphism cards with gradient glow
7. **Pipeline**: Connecting line fills as you scroll past steps
8. **Final CTA**: Radial glow, decorative rings, strong headline
9. **Performance**: 60fps, no GC spikes, 2 WebGL contexts max
10. **Settings**: `/settings` loads with working form and save button

---

## FILES YOU WILL MODIFY

1. `frontend/components/Background3D.tsx` — Tasks 1-7 (3D engine overhaul)
2. `frontend/app/page.tsx` — Tasks 8-13 (landing page elevation)
3. `frontend/app/globals.css` — Task 14 (micro-animation system)
4. `frontend/app/settings/[[...rest]]/page.tsx` — Task 15 (replace with working settings)
5. `frontend/app/settings/temp.tsx` — DELETE after Task 15

## CONSTRAINTS

- Maintain "Titanium & Frost" premium light theme
- Use Inter font throughout
- Primary: `#2563EB`, Accent: `#00C2CC`
- Do NOT change backend files or other pages
- Do NOT downgrade 3D to SVG — only enhance or merge
- Every visual change must make the page MORE premium, never less
- Preserve existing device screen HTML content

---

## ⚠️ MANDATORY ERRATA — READ BEFORE CODING (Audited by Opus 4.6)

These corrections override the code samples above wherever they conflict. Apply ALL of them.

### E-1 (CRITICAL): Do NOT Pass `progress` as a React Prop
Tasks 5 & 6 show `<FloatingTerms progress={progress} />` and `<AmbientParticles progress={progress} />`. **DO NOT DO THIS.** `progress` is computed 60fps inside `useFrame`. Passing it as a prop triggers 60 React re-renders/second → catastrophic lag.

**Instead**: Each component must compute its own progress inside its own `useFrame`:
```tsx
useFrame(() => {
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const progress = Math.min(Math.max(scrollY / PIN_DEPTH, 0), 1);
  // use progress here
});
```

### E-2 (CRITICAL): Add Missing React Imports
- `Background3D.tsx` line 3: add `useEffect` → `import React, { useRef, useMemo, useEffect } from "react";`
- `page.tsx` line 3: add `useState` → `import { useRef, useState, Suspense } from "react";`

### E-3 (CRITICAL): Remove `MeshTransmissionMaterial` Import After Task 4
After replacing the material, remove it from the drei import:
```diff
-import { Float, MeshTransmissionMaterial, Environment, ContactShadows, RoundedBox, Html } from "@react-three/drei";
+import { Float, Environment, ContactShadows, RoundedBox, Html } from "@react-three/drei";
```

### E-4 (HIGH): Remove `transparent` and `opacity` from Task 4 Glass Material
`transmission` and `transparent` conflict in Three.js r150+. Remove both:
```diff
- transparent
- opacity={0.97}
```

### E-5 (HIGH): Add `accent` Color to `tailwind.config.ts`
Task 12 uses `to-accent` but the token doesn't exist. Add to `theme.extend.colors`:
```ts
accent: "#00C2CC",
```

### E-6 (HIGH): Extract `MicModel`, `LockModel`, `SealModel` Before Task 11
These don't exist as components. Extract the inline JSX from `Mini3D` (lines 400-417) into standalone functions before building `Feature3DGrid`.

### E-7 (HIGH): Fix Narrator Ref in Task 8
`naratorEl` is undefined. Create a ref:
```tsx
const narratorRef = useRef<HTMLDivElement>(null);
// attach: <div ref={narratorRef} className="narrator-text ...">
// use: narratorRef.current!.textContent = "..."
```

### E-8 (HIGH): Sync Scroll Depths
`page.tsx` has `end: "+=2500"` but `Background3D.tsx` has `PIN_DEPTH = 3000`. Change GSAP to:
```diff
- end: "+=2500",
+ end: "+=3000",
```

### E-9 (MEDIUM): Dynamic Import `Feature3DGrid` with `ssr: false`
`Canvas` crashes in SSR. Add to page.tsx:
```tsx
const Feature3DGrid = dynamic(
  () => import("@/components/Background3D").then(mod => mod.Feature3DGrid),
  { ssr: false }
);
```

### E-10 (MEDIUM): Use Imperative `bufferAttribute` in Task 6
The declarative `<bufferAttribute>` pattern is fragile in R3F v8. Use:
```tsx
const posAttr = useMemo(() => {
  const attr = new THREE.BufferAttribute(positions, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  return attr;
}, []);
// JSX: <primitive attach="attributes-position" object={posAttr} />
```

### E-11 (MEDIUM): Memoize `CrashProofWave` Vector3 Allocations
`start.clone().lerp(end, 0.5)` on line 246 creates a Vector3 every frame. Move to `useMemo`. Also memoize the `new THREE.Vector3(...)` props at lines 381-384 (define as constants).

### E-12 (MEDIUM): Remove `html { scroll-behavior: smooth; }` from Task 14
CSS smooth scrolling conflicts with GSAP ScrollTrigger's `scrub` mode, causing jitter. The nav buttons already use inline `behavior: 'smooth'` which is sufficient.
