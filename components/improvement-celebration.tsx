"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

interface ImprovementCelebrationProps {
  improvedArea: {
    subject: string;
    firstScore: number;
    lastScore: number;
    improvement: number;
  };
  onClose: () => void;
}

export function ImprovementCelebration({
  improvedArea,
  onClose,
}: ImprovementCelebrationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="max-w-md w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="pt-8 pb-6 text-center relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mb-4"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    Congratulations!
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    You've overcome a weak area!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-muted/50 rounded-lg p-4 mb-6"
                >
                  <h3 className="font-semibold text-lg mb-3">
                    {improvedArea.subject}
                  </h3>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {improvedArea.firstScore}%
                      </div>
                      <div className="text-muted-foreground">Started at</div>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {improvedArea.lastScore}%
                      </div>
                      <div className="text-muted-foreground">Now at</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-3xl font-bold text-green-600">
                      +{improvedArea.improvement}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Improvement
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Your hard work and dedication have paid off! Keep up the
                    excellent progress.
                  </p>
                  <Button onClick={handleClose} className="w-full">
                    Continue Learning
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
