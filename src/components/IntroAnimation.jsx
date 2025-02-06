import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import './IntroAnimation.css';

function LotusLeaf({ position, rotation, scale }) {
  const leafMaterial = new THREE.MeshPhysicalMaterial({
    color: '#4a8f3d',  // Brighter green
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });

  const leafShape = new THREE.Shape();
  const radius = 1;
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2;
    const r = radius * (1 + Math.sin(angle * 8) * 0.05); 
    leafShape.lineTo(
      Math.cos(angle) * r,
      Math.sin(angle) * r
    );
  }
  leafShape.closePath();

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <shapeGeometry args={[leafShape]} />
        <meshPhysicalMaterial {...leafMaterial} />
      </mesh>
      {/* Leaf veins */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <mesh 
            key={i} 
            position={[0, 0.01, 0]}
            rotation-z={angle}
          >
            <boxGeometry args={[0.02, radius * 0.9, 0.01]} />
            <meshPhysicalMaterial 
              color="#3d7a33"  // Slightly darker for veins
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function LotusPetal({ position, rotation, scale, isBud }) {
  const petalColor = isBud ? '#ff8fb4' : '#ff9fc5';  // Lighter pink
  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: petalColor,
    roughness: 0.2,
    metalness: 0.1,
    transmission: 0.3,
    thickness: 0.2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });

  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.5, 0.5, 0.6, 1.5, 0, 2);
  petalShape.bezierCurveTo(-0.6, 1.5, -0.5, 0.5, 0, 0);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <shapeGeometry args={[petalShape]} />
        <meshPhysicalMaterial {...petalMaterial} />
      </mesh>
      {/* Petal veins */}
      <mesh position={[0, 1, 0.01]} scale={[0.02, 2, 1]}>
        <planeGeometry />
        <meshPhysicalMaterial 
          color={isBud ? '#ff7faa' : '#ff8fb4'}  // Slightly darker for veins
          roughness={0.3}
          metalness={0.1}
          transmission={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function LotusCenter({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
        <meshPhysicalMaterial 
          color="#ffd700"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const radius = 0.25;
        const y = 0.1 + Math.sin(i * 0.5) * 0.05; 
        return (
          <group key={i}>
            <mesh 
              position={[
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshPhysicalMaterial 
                color="#cc9900"
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Mountain({ position = [0, 0, 0], scale = [1, 1, 1] }) {
  const mountainMaterial = new THREE.MeshPhysicalMaterial({
    color: '#2d5a88',
    roughness: 0.8,
    metalness: 0.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
  });

  const fogMaterial = new THREE.MeshPhysicalMaterial({
    color: '#b3d9ff',
    transparent: true,
    opacity: 0.3,
    roughness: 1,
    metalness: 0,
  });

  // Create multiple mountain peaks
  const createMountainPeak = (x, z, height, width) => {
    const shape = new THREE.Shape();
    shape.moveTo(-width, 0);
    shape.quadraticCurveTo(-width/2, height * 1.2, 0, height);
    shape.quadraticCurveTo(width/2, height * 1.2, width, 0);
    shape.lineTo(-width, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    });

    return (
      <mesh 
        position={[x, 0, z]} 
        rotation={[-Math.PI / 2, 0, 0]}
        material={mountainMaterial}
      >
        <primitive object={geometry} />
      </mesh>
    );
  };

  // Create fog/clouds
  const createFogLayer = (y, scale) => {
    return (
      <mesh 
        position={[0, y, -5]} 
        scale={[20 * scale, 0.1, 2]}
      >
        <boxGeometry />
        <primitive object={fogMaterial} />
      </mesh>
    );
  };

  return (
    <group position={position} scale={scale}>
      {/* Back mountain range */}
      {createMountainPeak(-8, -10, 4, 3)}
      {createMountainPeak(-4, -12, 5, 4)}
      {createMountainPeak(0, -15, 6, 5)}
      {createMountainPeak(4, -12, 5, 4)}
      {createMountainPeak(8, -10, 4, 3)}
      
      {/* Middle mountain range */}
      {createMountainPeak(-6, -8, 3, 2.5)}
      {createMountainPeak(-2, -9, 4, 3)}
      {createMountainPeak(2, -9, 4, 3)}
      {createMountainPeak(6, -8, 3, 2.5)}

      {/* Fog/cloud layers */}
      {createFogLayer(2, 1)}
      {createFogLayer(3, 0.8)}
      {createFogLayer(4, 0.6)}
    </group>
  );
}

function AudioVisualizer() {
  const curveRef = useRef();
  const pointsRef = useRef([]);
  const numPoints = 128;
  const radius = 2;

  useEffect(() => {
    // Create initial points in a circle
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      ));
    }
    pointsRef.current = points;

    // Create the curve
    const curve = new THREE.CatmullRomCurve3(points, true);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
    curveRef.current.geometry = geometry;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Update points with wave animation
    pointsRef.current.forEach((point, i) => {
      const angle = (i / numPoints) * Math.PI * 2;
      const amplitude = 0.3; // Height of the waves
      
      // Create multiple wave frequencies
      const wave1 = Math.sin(time * 2 + angle * 4) * amplitude * 0.5;
      const wave2 = Math.sin(time * 3 + angle * 6) * amplitude * 0.3;
      const wave3 = Math.sin(time * 5 + angle * 8) * amplitude * 0.2;
      
      const totalWave = wave1 + wave2 + wave3;
      
      point.x = Math.cos(angle) * (radius + totalWave);
      point.y = Math.sin(angle) * (radius + totalWave);
    });

    // Update the curve geometry
    const curve = new THREE.CatmullRomCurve3(pointsRef.current, true);
    const points = curve.getPoints(200);
    curveRef.current.geometry.setFromPoints(points);
  });

  return (
    <group position={[0, 0, -1]}>
      <line ref={curveRef}>
        <bufferGeometry />
        <lineBasicMaterial 
          color="#ff69b4" 
          linewidth={2}
          transparent
          opacity={0.6}
        />
      </line>
    </group>
  );
}

function Lotus({ onBloom }) {
  const groupRef = useRef();
  const leavesRef = useRef([]);
  const petalsRef = useRef([]);
  const budsRef = useRef([]);
  const centerRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      // Initial closed position
      gsap.set(groupRef.current.position, { y: -2 });
      gsap.set(groupRef.current.rotation, { x: Math.PI });
      gsap.set(groupRef.current.scale, { x: 0.5, y: 0.5, z: 0.5 });

      // Timeline for sequential animation
      const tl = gsap.timeline({
        onComplete: () => onBloom && onBloom() // Trigger text animation when lotus blooming is complete
      });

      // Rise from water
      tl.to(groupRef.current.position, {
        y: 0,
        duration: 2,
        ease: "power2.out"
      })
      .to(groupRef.current.rotation, {
        x: 0,
        duration: 2,
        ease: "power2.out"
      }, "<")
      .to(groupRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 2,
        ease: "power2.out"
      }, "<");

      // Animate leaves spreading out
      leavesRef.current.forEach((leaf, index) => {
        if (leaf) {
          gsap.set(leaf.scale, { x: 0, y: 0, z: 0 });
          gsap.set(leaf.rotation, { x: Math.PI / 2, y: 0, z: 0 });

          tl.to(leaf.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2,
            ease: "power2.out"
          }, "-=1.8")
          .to(leaf.rotation, {
            x: Math.PI / 2 + (Math.random() * 0.2 - 0.1),
            y: Math.random() * Math.PI * 2,
            z: Math.random() * 0.2 - 0.1,
            duration: 2,
            ease: "power2.out"
          }, "<");
        }
      });

      // Blooming animation for petals
      petalsRef.current.forEach((petal, index) => {
        if (petal) {
          gsap.set(petal.rotation, { 
            x: Math.PI / 2,
            y: 0,
            z: (index / petalsRef.current.length) * Math.PI * 2
          });
          gsap.set(petal.scale, { x: 0.1, y: 0.1, z: 0.1 });
          gsap.set(petal.position, { y: 0 });

          const delay = (index % 5) * 0.2 + Math.floor(index / 5) * 0.5;
          
          tl.to(petal.rotation, {
            x: Math.PI / 3,
            duration: 2,
            ease: "power2.out"
          }, `-=${1.5 - delay}`)
          .to(petal.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2,
            ease: "power2.out"
          }, "<")
          .to(petal.position, {
            y: `+=${0.1 + (Math.floor(index / 5) * 0.1)}`,
            duration: 2,
            ease: "power2.out"
          }, "<");
        }
      });

      // Animate center
      if (centerRef.current) {
        tl.from(centerRef.current.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.5)"
        }, "-=1");
      }

      // Add continuous animations after blooming
      leavesRef.current.forEach((leaf, index) => {
        if (leaf) {
          tl.to(leaf.position, {
            y: `+=${0.05 + Math.random() * 0.05}`,
            duration: 1.5 + Math.random(),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          }, "-=0.5");
        }
      });

      petalsRef.current.forEach((petal, index) => {
        if (petal) {
          tl.to(petal.rotation, {
            z: `+=${0.1}`,
            duration: 2 + Math.random(),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          }, "-=0.5");
        }
      });
    }
  }, [onBloom]);

  // Create floating lily pads in a natural arrangement
  const leaves = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 2.5 + Math.random() * 1.5;
    const scale = 0.8 + Math.random() * 0.4;
    
    return (
      <group
        key={`leaf-${i}`}
        position={[
          Math.cos(angle) * radius,
          0.05 + Math.random() * 0.1,
          Math.sin(angle) * radius
        ]}
        rotation={[
          Math.PI / 2 + (Math.random() * 0.2 - 0.1),
          Math.random() * Math.PI * 2,
          Math.random() * 0.2 - 0.1
        ]}
        scale={[scale, scale, scale]}
        ref={el => leavesRef.current[i] = el}
      >
        <LotusLeaf />
      </group>
    );
  });

  // Create multiple layers of petals with refs for animation
  const createPetalLayer = (count, radius, height, angleOffset = 0, scale = 1, layerIndex = 0) => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + angleOffset;
      const petalIndex = layerIndex * count + i;
      
      return (
        <group
          key={`petal-layer-${height}-${i}`}
          position={[
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
          ]}
          ref={el => petalsRef.current[petalIndex] = el}
        >
          <LotusPetal
            scale={[scale, scale, scale]}
            isBud={false}
          />
        </group>
      );
    });
  };

  // Create multiple layers of petals
  const petals = [
    ...createPetalLayer(5, 0.3, 0.2, 0, 0.7, 0),
    ...createPetalLayer(7, 0.5, 0.3, Math.PI / 7, 0.8, 1),
    ...createPetalLayer(8, 0.7, 0.4, 0, 0.9, 2),
    ...createPetalLayer(8, 0.9, 0.5, Math.PI / 8, 1, 3)
  ];

  // Create lotus buds with refs
  const buds = Array.from({ length: 3 }).map((_, i) => {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const radius = 2;
    const scale = 0.6 + Math.random() * 0.2;
    
    return (
      <group 
        key={`bud-${i}`} 
        position={[
          Math.cos(angle) * radius,
          0.3 + Math.random() * 0.2,
          Math.sin(angle) * radius
        ]}
        rotation={[
          -Math.PI / 6,
          Math.random() * Math.PI * 2,
          Math.PI / 6
        ]}
        ref={el => budsRef.current[i] = el}
      >
        {Array.from({ length: 5 }).map((_, j) => (
          <LotusPetal
            key={`bud-petal-${j}`}
            position={[0, j * 0.1, 0]}
            rotation={[
              Math.PI / 3,
              (j / 5) * Math.PI * 2,
              0
            ]}
            scale={[scale * 0.4, scale * 0.6, scale * 0.4]}
            isBud={true}
          />
        ))}
      </group>
    );
  });

  return (
    <group ref={groupRef}>
      {leaves}
      <group position={[0, 0.2, 0]}>
        {petals}
        <group ref={centerRef}>
          <LotusCenter position={[0, 0.6, 0]} />
        </group>
      </group>
      {buds}
    </group>
  );
}

function Water() {
  const waterRef = useRef();
  
  useFrame((state) => {
    if (waterRef.current) {
      const time = state.clock.getElapsedTime();
      waterRef.current.material.opacity = 0.8 + Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, -0.1, 0]}>
      <planeGeometry args={[30, 30, 32, 32]} />
      <meshPhysicalMaterial 
        color="#104c77"
        transparent
        opacity={0.8}
        roughness={0.2}
        metalness={0.3}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function IntroAnimation({ onComplete }) {
  const textRef = useRef();
  const controlsRef = useRef();
  const [textVisible, setTextVisible] = useState(false);
  const navigate = useNavigate();

  // Function to trigger text animation
  const showText = useCallback(() => {
    setTextVisible(true);
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        {
          opacity: 0,
          y: -30,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 2,
          ease: "power3.out"
        }
      );
    }
  }, []);

  const handleEnterSite = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Sadhanapada Text Container with backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 100%)',
          zIndex: 25
        }}
      >
        <div 
          ref={textRef}
          className={`absolute top-8 left-1/2 transform -translate-x-1/2 text-center w-full transition-opacity duration-1000 ${textVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6)'
          }}
        >
          <h1 
            className="text-8xl font-black mb-6 tracking-widest relative"
            style={{
              background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '300% 300%',
              animation: textVisible ? 'gradient 8s ease infinite' : 'none',
              filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))'
            }}
          >
            <span className="relative">
              Sadhanapada
              <span 
                className="absolute inset-0"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  color: '#000',
                  WebkitTextStroke: '2px rgba(0,0,0,0.9)'
                }}
              >
                Sadhanapada
              </span>
            </span>
          </h1>
          <p 
            className="text-3xl font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: textVisible ? 'gradient 8s ease infinite' : 'none',
              filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.8))'
            }}
          >
            A Journey of Inner Growth
          </p>
        </div>
      </div>

      <Canvas
        camera={{
          position: [0, 3, 6],
          fov: 45,
        }}
        style={{ position: 'absolute', zIndex: 10 }}
      >
        <color attach="background" args={['#87ceeb']} />
        
        {/* Enhanced lighting */}
        <ambientLight intensity={1} color="#ffffff" />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          color="#ffffff"
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.8} 
          color="#ffd5e5"
        />
        <pointLight 
          position={[0, 3, 0]} 
          intensity={0.8} 
          color="#ff69b4" 
          distance={8}
        />
        <hemisphereLight
          skyColor="#ffffff"
          groundColor="#ffd5e5"
          intensity={0.8}
        />

        {/* Add fog to the scene */}
        <fog attach="fog" args={['#b3d9ff', 10, 30]} />

        <Suspense fallback={null}>
          <AudioVisualizer />
          <Mountain position={[0, -2, -10]} scale={[1, 1, 1]} />
          <Water />
          <Lotus onBloom={showText} />
        </Suspense>

        <OrbitControls 
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 2.8}
          maxAzimuthAngle={Math.PI / 4}
          minAzimuthAngle={-Math.PI / 4}
          rotateSpeed={0.5}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>

      <button
        onClick={handleEnterSite}
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-gradient-to-r from-gray-800 to-black text-white rounded-full hover:from-black hover:to-gray-800 transition-all duration-300 text-lg font-bold z-30 shadow-lg ${textVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        Enter Site →
      </button>
    </div>
  );
}

export default IntroAnimation;
