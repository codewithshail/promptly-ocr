"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Zap } from "lucide-react";
import * as confetti from "canvas-confetti";

interface StreakCelebrationProps {
  streak: number;
  previousStreak?: number;
}

const MILESTONES = [7, 30, 100];

export function StreakCelebration({ streak, previousStreak = 0 }: StreakCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    // Check if we just hit a milestone
    const hitMilestone = MILESTONES.find(
      (m) => streak >= m && previousStreak < m
    );

    if (hitMilestone) {
      setMilestone(hitMilestone);
      setShowCelebration(true);

      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti.default({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti.default({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
    }
  }, [streak, previousStreak]);

  const getMilestoneIcon = (milestone: number) => {
    if (milestone >= 100) return Trophy;
    if (milestone >= 30) return Flame;
    if (milestone >= 7) return Star;
    return Zap;
  };

  const getMilestoneMessage = (milestone: number) => {
    if (milestone >= 100) return "Legendary Achievement!";
    if (milestone >= 30) return "On Fire!";
    if (milestone >= 7) return "Week Warrior!";
    return "Great Start!";
  };

  const getMilestoneDescription = (milestone: number) => {
    if (milestone >= 100) return "You've maintained a 100-day streak! You're unstoppable! 🏆";
    if (milestone >= 30) return "30 days of consistent learning! Keep the momentum going! 🔥";
    if (milestone >= 7) return "7 days in a row! You're building a great habit! ⭐";
    return "You're on your way to greatness!";
  };

  if (!showCelebration || !milestone) return null;

  const Icon = getMilestoneIcon(milestone);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-md"
      >
        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-lg shadow-2xl p-6 border-4 border-white">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Icon className="h-12 w-12" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                {getMilestoneMessage(milestone)}
              </h3>
              <p className="text-sm opacity-90 mb-2">
                {getMilestoneDescription(milestone)}
              </p>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                <span className="text-2xl font-bold">{streak}</span>
                <span className="text-sm">day streak!</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
