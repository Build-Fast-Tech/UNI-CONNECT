"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

export function Core() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (sphereRef.current) {
      // Gently rotate the core
      sphereRef.current.rotation.y += 0.005;
      sphereRef.current.rotation.z += 0.002;
    }
    if (textRef.current) {
      // Orbit the initials around the core
      textRef.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group>
      {/* The Main Liquid-Energy Sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <MeshDistortMaterial
            color="#4B0082" // Indigo base
            speed={3}
            distort={0.4}
            radius={1}
            metalness={0.8}
            roughness={0.2}
            emissive="#8B00FF"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>

      {/* Orbiting Initials */}
      <group ref={textRef}>
        {/* PK - Central and larger */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          PK
        </Text>

        {/* UET - Orbiting */}
        <Float speed={3} rotationIntensity={1} floatIntensity={1}>
          <Text
            position={[3, 1, 0]}
            fontSize={0.4}
            color="#ff69b4" // Pink accent
            anchorX="center"
            anchorY="middle"
          >
            UET
          </Text>
        </Float>

        {/* Another UET / Uni initial for balance */}
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Text
            position={[-3, -1, 1]}
            fontSize={0.4}
            color="#00ced1" // Teal accent
            anchorX="center"
            anchorY="middle"
          >
            UET
          </Text>
        </Float>
      </group>
    </group>
  );
}
