"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { successConfetti } from "@/lib/confetti";

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  message = "Success!",
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  useEffect(() => {
    successConfetti();
    
    if (onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 10,
          }}
        >
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold"
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
