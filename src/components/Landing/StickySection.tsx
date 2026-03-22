"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StickySectionProps {
  children: React.ReactNode;
  zIndex: number;
}

export default function StickySection({ children, zIndex }: StickySectionProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <div 
      ref={ref} 
      style={{ 
        height: '100vh', 
        position: 'sticky', 
        top: 0, 
        zIndex, 
        width: '100%',
        background: '#000',
        overflow: 'hidden'
      }}
    >
      <motion.div 
        style={{ 
          scale, 
          y,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 -20px 50px rgba(0,0,0,0.8)',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
