"use client";

import React, { useState } from "react";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

interface FAQItemProps {
  question: string;
  answer: string;
  position: [number, number, number];
}

export function FAQCube({ question, answer, position }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
      <group position={position}>
        {/* The Cube */}
        <mesh 
          onClick={() => setOpen(!open)}
          scale={open ? 1.2 : 1}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial 
            color="#4B0082" 
            transparent 
            opacity={0.6} 
            roughness={0.1} 
            metalness={0.8} 
            transmission={0.5}
          />
        </mesh>

        {/* Question Text on the face */}
        <Text
          position={[0, 0, 0.51]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.8}
          textAlign="center"
        >
          {question}
        </Text>

        {/* Answer Panel - slides out when open */}
        {open && (
          <group position={[0, -1, 0]}>
            <mesh>
              <planeGeometry args={[2, 1]} />
              <meshPhysicalMaterial 
                color="rgba(255,255,255,0.1)" 
                transparent 
                opacity={0.4} 
                roughness={0} 
                metalness={1} 
                transmission={0.8}
              />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.08}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.8}
              textAlign="center"
            >
              {answer}
            </Text>
          </group>
        )}
      </group>
    </Float>
  );
}
