"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";

const UNIVERSITIES = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA", "GIKI",
  "UET Lahore", "Punjab University", "QAU", "NED", "Air University",
  "Bahria University", "SZABIST", "IST", "Habib University", "UCP",
  "Karachi University", "BZU", "UAF", "MUET",
];

export function DataRiver() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slowly move the river elements forward
      groupRef.current.children.forEach((child, i) => {
        child.position.z += 0.01;
        if (child.position.z > 10) {
          child.position.z = -10;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -4, 0]}>
      {UNIVERSITIES.map((uni, i) => {
        const x = (Math.random() - 0.5) * 15;
        const z = (Math.random() - 0.5) * 20;
        return (
          <Float key={i} speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
            <group position={[x, 0, z]}>
              <Text
                fontSize={0.2}
                color="rgba(255,255,255,0.3)"
                anchorX="center"
                anchorY="middle"
              >
                {uni}
              </Text>
              <mesh position={[0, -0.2, 0]}>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshBasicMaterial color="#00ced1" />
              </mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}
