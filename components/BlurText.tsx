"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface BlurTextProps {
  text: string;
  className?: string;
  delayPerWord?: number;
}

export default function BlurText({ text, className = "", delayPerWord = 100 }: BlurTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden mr-[0.28em] align-top">
          <motion.span
            className="inline-block"
            initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
            animate={
              inView
                ? {
                    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                    opacity: [0, 0.5, 1],
                    y: [50, -5, 0],
                  }
                : undefined
            }
            transition={{
              duration: 1.05,
              times: [0, 0.5, 1],
              delay: (index * delayPerWord) / 1000,
              ease: "easeOut",
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
}
