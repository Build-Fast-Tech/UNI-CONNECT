"use client";

import React, { useState } from "react";
import { Float, Text, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

interface MemoryBubbleProps {
  position: [number, number, number];
  student: string;
  university: string;
  quote: string;
  color: string;
}

export function MemoryBubble({ position, student, university, quote, color }: MemoryBubbleProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position}>
        {/* The Bubble */}
        <mesh 
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.3 : 1}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <MeshTransmissionMaterial 
            backside 
            samples={4} 
            thickness={0.5} 
            chromaticAberration={0.05} 
            anisotropy={0.1} 
            distortion={0.2} 
            distortionScale={0.1} 
            color="rgba(255,255,255,0.2)"
          />
        </mesh>

        {/* Student Initial */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {student[0]}
        </Text>

        {/* Testimonial Text - Orbiting or Floating nearby */}
        {hovered && (
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={2}
            textAlign="center"
          >
            {`"${quote}"\n- ${student}, ${university}`}
          </Text>
        )}

        {/* Glow Effect */}
        <mesh scale={1.1}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} wireframe />
        </mesh>
      </group>
    </Float>
  );
}
