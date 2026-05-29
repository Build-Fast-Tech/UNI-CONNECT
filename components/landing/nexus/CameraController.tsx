"use client";

import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "@/lib/scene-store";
import * as THREE from "three";

export function CameraController() {
  const scrollProgress = useSceneStore((state) => state.scrollProgress);

  useFrame((state) => {
    const { camera } = state;

    // Define camera path points based on scroll progress
    // 0: Hero (Center)
    // 0.2: Features (Orbiting side)
    // 0.4: How it Works (Zooming in on pedestals)
    // 0.6: Testimonials (Moving out to bubbles)
    // 0.8: FAQ (Bottom focus)
    // 1.0: Final CTA (Grand view)

    const targetPosition = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    if (scrollProgress < 0.2) {
      // Hero view
      targetPosition.set(0, 2, 15 - scrollProgress * 25);
    } else if (scrollProgress < 0.4) {
      // Move towards Feature Satellites
      const t = (scrollProgress - 0.2) / 0.2;
      targetPosition.set(t * 10, 2, 5 + (1 - t) * 5);
    } else if (scrollProgress < 0.6) {
      // Focus on How it Works
      const t = (scrollProgress - 0.4) / 0.2;
      targetPosition.set(10 - t * 10, -2, 5);
      targetLookAt.set(0, -4, 0);
    } else if (scrollProgress < 0.8) {
      // Focus on Testimonials
      const t = (scrollProgress - 0.6) / 0.2;
      targetPosition.set(0, 5 + t * 5, 10);
      targetLookAt.set(0, 2, 0);
    } else {
      // Final CTA view
      const t = (scrollProgress - 0.8) / 0.2;
      targetPosition.set(0, 2, 15 + t * 5);
    }

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition, 0.1);
    
    // Smoothly interpolate camera target (lookAt)
    // We use a dummy object for lookAt since camera.lookAt is immediate
    // For real smooth lookAt, we'd need a target vector and call camera.lookAt on every frame
  });

  return null;
}
