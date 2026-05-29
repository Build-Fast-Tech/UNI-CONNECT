"use client";

import React, { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

interface SatelliteProps {
  position: [number, number, number];
  title: string;
  description: string;
  iconColor: string;
  index: number;
}

export function FeatureSatellite({ position, title, description, iconColor, index }: SatelliteProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        {/* Glass Panel */}
        <mesh 
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.2 : 1}
        >
          <planeGeometry args={[2, 1.2]} />
          <MeshTransmissionMaterial 
            backside 
            samples={4} 
            thickness={0.2} 
            chromaticAberration={0.02} 
            anisotropy={0.1} 
            distortion={0.1} 
            distortionScale={0.1} 
            temporalFilter={0.8} 
            color="rgba(255,255,255,0.1)"
          />
        </mesh>

        {/* Title */}
        <Text
          position={[0, 0.3, 0.01]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
        >
          {title}
        </Text>

        {/* Description - only visible on hover or always small */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="rgba(255,255,255,0.6)"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
          textAlign="center"
        >
          {description}
        </Text>

        {/* Icon/Core of the satellite */}
        <mesh position={[0, 0, -0.2]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color={iconColor} emissive={iconColor} emissiveIntensity={2} />
        </mesh>
      </group>
    </Float>
  );
}
