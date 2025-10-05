"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Square, Volume2, AlertCircle, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  prescriptionId: string;
  text?: string;
}

export function AudioPlayer({ prescriptionId, text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [textToSpeak, setTextToSpeak] = useState<string | null>(text || null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if Web Speech API is supported
  const isSpeechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Fetch text from API if not provided
  const fetchTextToSpeak = async () => {
    if (textToSpeak) return textToSpeak;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch text");
      }

      setTextToSpeak(data.text);
      return data.text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load text";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Start progress tracking
  const startProgressTracking = (utterance: SpeechSynthesisUtterance) => {
    const text = utterance.text;
    const wordsPerMinute = 150; // Average speaking rate
    const words = text.split(/\s+/).length;
    const estimatedDuration = (words / wordsPerMinute) * 60 * 1000; // in milliseconds
    const updateInterval = 100; // Update every 100ms
    let elapsed = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsed += updateInterval;
      const newProgress = Math.min((elapsed / estimatedDuration) * 100, 99);
      setProgress(newProgress);
    }, updateInterval);
  };

  // Stop progress tracking
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Handle play
  const handlePlay = async () => {
    if (!isSpeechSupported) {
      setError("Text-to-speech is not supported in your browser");
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser. Please try Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    // If paused, resume
    if (isPaused && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startProgressTracking(utteranceRef.current);
      return;
    }

    // Fetch text if needed
    const text = await fetchTextToSpeak();
    if (!text) return;

    setError(null);
    setIsPlaying(true);
    setProgress(0);

    try {
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure utterance
      utterance.rate = 0.9; // Slightly slower for medical content
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        startProgressTracking(utterance);
      };

      utterance.onend = () => {
        stopProgressTracking();
        setProgress(100);
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
        
        // Reset after a short delay
        setTimeout(() => {
          setProgress(0);
        }, 1000);
      };

      utterance.onerror = (event) => {
        stopProgressTracking();
        const errorMessage = `Speech synthesis error: ${event.error}`;
        setError(errorMessage);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        
        toast({
          title: "Playback Error",
          description: "An error occurred during playback. Please try again.",
          variant: "destructive",
        });
      };

      utterance.onpause = () => {
        stopProgressTracking();
      };

      utterance.onresume = () => {
        startProgressTracking(utterance);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start playback";
      setError(errorMessage);
      setIsPlaying(false);
      setProgress(0);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle pause
  const handlePause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  // Handle stop
  const handleStop = () => {
    window.speechSynthesis.cancel();
    stopProgressTracking();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    utteranceRef.current = null;
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setTextToSpeak(null);
    handlePlay();
  };

  if (!isSpeechSupported) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-900 transition-shadow">
        <CardContent className="flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium">Text-to-Speech Not Available</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Your browser doesn&apos;t support text-to-speech. Try Chrome, Edge, or Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base">Audio Playback</h3>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2 transition-all" />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>{isPlaying ? "Playing..." : isPaused ? "Paused" : "Ready"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isPlaying && !isPaused && (
              <Button
                onClick={handlePlay}
                disabled={isLoading}
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base transition-transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden xs:inline">Loading...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Play Audio</span>
                    <span className="xs:hidden">Play</span>
                  </>
                )}
              </Button>
            )}

            {isPlaying && (
              <Button
                onClick={handlePause}
                variant="secondary"
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base transition-transform active:scale-[0.98]"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            {isPaused && (
              <Button
                onClick={handlePlay}
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base transition-transform active:scale-[0.98]"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}

            {(isPlaying || isPaused) && (
              <Button
                onClick={handleStop}
                variant="destructive"
                size="icon"
                className="h-11 w-11 sm:h-10 sm:w-10 transition-transform active:scale-[0.98]"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Error Display with Retry */}
          {error && (
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <p className="text-xs sm:text-sm text-destructive break-words">{error}</p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs sm:text-sm transition-transform active:scale-[0.98]"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Info Text */}
          {!isPlaying && !isPaused && !error && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Click play to hear the prescription read aloud. Audio will play the relevant prescription content.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
