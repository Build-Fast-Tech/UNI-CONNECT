"use client";

import { motion } from "framer-motion";

type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    className="glass p-5 rounded-xl shadow-md border"
  >
    {title && (
      <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">{title}</h2>
    )}
    {children}
  </motion.div>
);
