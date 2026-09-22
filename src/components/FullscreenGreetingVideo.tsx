"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Language } from "@/lib/translations";
import { stopSpeaking } from "@/lib/voice";

interface FullscreenGreetingVideoProps {
  language: Language;
  onFinished: () => void;
  showSkip?: boolean;
}

const VIDEO_SOURCES: Record<Language, { primary: string; fallback: string }> = {
  english: {
    primary: "/videos/english.mp4",
    fallback: "/videos/eng-video.mp4",
  },
  hindi: {
    primary: "/videos/hindi.mp4",
    fallback: "/videos/hin-vedio.mp4",
  },
  marathi: {
    primary: "/videos/marathi.mp4",
    fallback: "/videos/mar-video.mp4",
  },
};

export default function FullscreenGreetingVideo({
  language,
  onFinished,
  showSkip = true,
}: FullscreenGreetingVideoProps) {
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMutedHint, setShowMutedHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoConfig = VIDEO_SOURCES[language] || VIDEO_SOURCES.hindi;

  useEffect(() => {
    setMounted(true);
    stopSpeaking();

    // Prevent body scrolling while full screen video is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle Autoplay & Sound
  useEffect(() => {
    if (!mounted) return;
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();
    video.muted = false;
    setIsMuted(false);
    setShowMutedHint(false);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Autoplay with sound restricted by browser policy; play muted & display sound hint
          video.muted = true;
          setIsMuted(true);
          setShowMutedHint(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    }
  }, [mounted, language]);

  const handleScreenInteraction = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      setShowMutedHint(false);
    }

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    onFinished();
  }, [onFinished]);

  if (!mounted) return null;

  const content = (
    <div
      ref={containerRef}
      onClick={handleScreenInteraction}
      className="fixed inset-0 z-[99999] flex h-screen w-screen cursor-pointer items-center justify-center overflow-hidden bg-black select-none"
    >
      {/* Fullscreen Video (covers the entire screen seamlessly) */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        preload="auto"
        className="h-full w-full object-cover sm:object-contain bg-black"
        onEnded={handleVideoEnded}
      >
        <source src={videoConfig.primary} type="video/mp4" />
        <source src={videoConfig.fallback} type="video/mp4" />
      </video>

      {/* Subtle Skip button in top corner */}
      {showSkip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFinished();
          }}
          className="absolute top-5 right-5 z-[100000] rounded-full border border-white/25 bg-black/60 px-4 py-1.5 text-[12px] font-black tracking-wider text-white shadow-lg backdrop-blur-md transition-all hover:bg-black hover:border-white/50 active:scale-95"
        >
          {language === "marathi" ? "पुढे जा →" : language === "hindi" ? "आगे बढ़ें →" : "Skip →"}
        </button>
      )}

      {/* Tap for sound pill if autoplay was muted by browser policy */}
      {showMutedHint && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-[100000] -translate-x-1/2 animate-bounce rounded-full border border-white/40 bg-black/75 px-5 py-2.5 text-center text-[13px] font-black text-white shadow-2xl backdrop-blur-md">
          🔊 {language === "marathi" ? "आवाज सुरू करण्यासाठी कुठेही टॅप करा" : language === "hindi" ? "आवाज चालू करने के लिए कहीं भी टैप करें" : "Tap anywhere for sound"}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
