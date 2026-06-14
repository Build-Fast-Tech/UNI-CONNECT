"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { Core } from "./Core";
import { FeatureSatellite } from "./FeatureSatellite";
import { MemoryBubble } from "./MemoryBubble";
import { DataRiver } from "./DataRiver";
import { CameraController } from "./CameraController";
import { FAQCube } from "./FAQCube";

const FEATURES = [
  {
    position: [5, 2, -2] as [number, number, number],
    title: "University Community Chat",
    description: "Dedicated chats for your university, branch, and the entire nation.",
    iconColor: "#6366F1",
  },
  {
    position: [-5, 3, -1] as [number, number, number],
    title: "Shared Notes Library",
    description: "Upload and discover notes from every university, subject, and semester.",
    iconColor: "#10B981",
  },
  {
    position: [3, -2, 3] as [number, number, number],
    title: "Jobs for Pakistani Grads",
    description: "Employers post jobs filtered by university. Students apply in one click.",
    iconColor: "#F97316",
  },
  {
    position: [-4, -3, 2] as [number, number, number],
    title: "AI Study Companion",
    description: "Ask anything, analyze your notes, prepare for exams. Powered by Gemini.",
    iconColor: "#8B5CF6",
  },
];

const TESTIMONIALS = [
  {
    position: [8, 5, -5] as [number, number, number],
    student: "Zainab Malik",
    university: "NUST",
    quote: "Finally a platform that understands Pakistani students.",
    color: "#6366F1",
  },
  {
    position: [-8, 4, -3] as [number, number, number],
    student: "Bilal Ahmed",
    university: "LUMS",
    quote: "The university chat is addictive. Met seniors from my batch.",
    color: "#10B981",
  },
  {
    position: [0, 6, -8] as [number, number, number],
    student: "Sara Qureshi",
    university: "FAST-NUCES",
    quote: "I uploaded my notes... 2 weeks later 400+ downloads.",
    color: "#F97316",
  },
];

const FAQS = [
  {
    position: [5, -5, -5] as [number, number, number],
    question: "Is UniConnect free?",
    answer: "Yes! UniConnect is completely free for students.",
  },
  {
    position: [0, -5, -8] as [number, number, number],
    question: "Which universities are supported?",
    answer: "We support 250+ Pakistani universities.",
  },
  {
    position: [-5, -5, -5] as [number, number, number],
    question: "Is my data safe?",
    answer: "Absolutely. We use Supabase with Row Level Security.",
  },
];

export function NexusScene() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050509]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 15]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />

        {/* Space Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        {/* NOTE: dropped <Environment preset="city" /> — it fetched an external HDR
            (drei-assets CDN) that the production CSP correctly blocks. The explicit
            light rig below covers the scene; ambient is raised to compensate. */}

        {/* Lighting */}
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#8B00FF" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#00ced1" />
        <spotLight position={[0, 10, 0]} intensity={2} angle={0.3} penumbra={1} castShadow />

        <Suspense fallback={null}>
          <CameraController />
          <Core />
          
          {FEATURES.map((f, i) => (
            <FeatureSatellite key={i} {...f} index={i} />
          ))}

          {TESTIMONIALS.map((t, i) => (
            <MemoryBubble key={i} {...t} />
          ))}

          {FAQS.map((faq, i) => (
            <FAQCube key={i} {...faq} />
          ))}

          <DataRiver />
        </Suspense>
      </Canvas>
    </div>
  );
}

