import { create } from 'zustand';

interface SceneState {
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
}));
