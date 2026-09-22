"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Language } from "@/lib/translations";
import { stopSpeaking } from "@/lib/voice";
import {
  IconPlay,
  IconPause,
  IconSpeaker,
  IconMute,
  IconReplay,
} from "@/components/icons";

interface GreetingVideoProps {
  initialLanguage?: Language;
  userName?: string;
  autoPlay?: boolean;
  className?: string;
}

interface VideoConfig {
  primary: string;
  fallback: string;
  name: string;
  badge: string;
  unmuteText: string;
}

const VIDEO_CONFIGS: Record<Language, VideoConfig> = {
  english: {
    primary: "/videos/english.mp4",
    fallback: "/videos/eng-video.mp4",
    name: "English",
    badge: "Welcome",
    unmuteText: "Tap for Sound",
  },
  hindi: {
    primary: "/videos/hindi.mp4",
    fallback: "/videos/hin-vedio.mp4",
    name: "हिंदी",
    badge: "स्वागत",
    unmuteText: "आवाज चालू करें",
  },
  marathi: {
    primary: "/videos/marathi.mp4",
    fallback: "/videos/mar-video.mp4",
    name: "मराठी",
    badge: "स्वागत",
    unmuteText: "आवाज सुरू करा",
  },
};

export default function GreetingVideo({
  initialLanguage = "hindi",
  userName,
  autoPlay = true,
  className = "",
}: GreetingVideoProps) {
  const [currentLang, setCurrentLang] = useState<Language>(initialLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMutedPill, setShowMutedPill] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const config = VIDEO_CONFIGS[currentLang] || VIDEO_CONFIGS.hindi;

  // Sync if initialLanguage prop changes
  useEffect(() => {
    if (initialLanguage && initialLanguage !== currentLang) {
      setCurrentLang(initialLanguage);
    }
  }, [initialLanguage]);

  // Attempt playback whenever currentLang or autoPlay changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Silence any running TTS speech when video mounts/switches
    stopSpeaking();

    // Reload video element for new source
    video.load();
    setCurrentTime(0);
    setHasEnded(false);

    if (autoPlay) {
      // First attempt unmuted autoplay
      video.muted = false;
      setIsMuted(false);
      setShowMutedPill(false);

      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Browser autoplay policy prevented unmuted audio; fallback to muted
            video.muted = true;
            setIsMuted(true);
            setShowMutedPill(true);
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    }

    return () => {
      video.pause();
    };
  }, [currentLang, autoPlay]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();

    if (video.paused || video.ended) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasEnded(false);
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      setShowMutedPill(false);
    }
  }, []);

  const unmuteAndPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();
    video.muted = false;
    setIsMuted(false);
    setShowMutedPill(false);
    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, []);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopSpeaking();
    video.currentTime = 0;
    setHasEnded(false);
    video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Language Switcher Tabs */}
      <div className="mb-3 flex items-center justify-center gap-1.5 rounded-full border-[2px] border-[var(--black)] bg-[var(--gray-100)] p-1 shadow-[2px_2px_0_var(--black)]">
        {(["marathi", "hindi", "english"] as Language[]).map((lang) => {
          const active = currentLang === lang;
          const cfg = VIDEO_CONFIGS[lang];
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setCurrentLang(lang)}
              className={`rounded-full px-3 py-1 text-[11px] font-black transition-all ${
                active
                  ? "bg-[var(--black)] text-white shadow-[1px_1px_0_var(--black)]"
                  : "bg-white text-[var(--black)] hover:bg-[var(--gray-200)]"
              }`}
            >
              {cfg.name}
            </button>
          );
        })}
      </div>

      {/* Portrait 9:16 Video Player Container */}
      <div className="group relative mx-auto aspect-[9/16] w-full max-w-[270px] sm:max-w-[300px] overflow-hidden rounded-[20px] border-[2.5px] border-[var(--black)] bg-black shadow-[4px_4px_0_var(--black)]">
        <video
          ref={videoRef}
          playsInline
          preload="auto"
          className="h-full w-full object-cover cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setHasEnded(true);
          }}
        >
          <source src={config.primary} type="video/mp4" />
          <source src={config.fallback} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Top Badges: Welcome & Sound Status */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full border-[1.5px] border-white/80 bg-black/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
            {config.badge} {userName ? `• ${userName}` : ""}
          </span>

          {showMutedPill && (
            <button
              type="button"
              onClick={unmuteAndPlay}
              className="pointer-events-auto flex animate-pulse items-center gap-1.5 rounded-full border-[1.5px] border-[var(--black)] bg-[var(--red)] px-2.5 py-1 text-[11px] font-black text-white shadow-[2px_2px_0_var(--black)] hover:brightness-110 active:scale-95"
            >
              <IconSpeaker className="h-3.5 w-3.5" />
              <span>{config.unmuteText}</span>
            </button>
          )}
        </div>

        {/* Center Overlay: Play/Replay trigger when paused or ended */}
        {(!isPlaying || hasEnded) && (
          <button
            type="button"
            onClick={hasEnded ? handleReplay : togglePlay}
            aria-label={hasEnded ? "Replay video" : "Play video"}
            className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-all hover:bg-black/25"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-[var(--black)] bg-[var(--white)] text-[var(--black)] shadow-[3px_3px_0_var(--black)] transition-transform hover:scale-105 active:scale-95">
              {hasEnded ? (
                <IconReplay className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <IconPlay className="ml-0.5 h-6 w-6 fill-current stroke-[2.5]" />
              )}
            </div>
          </button>
        )}

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-6 text-white">
          {/* Progress bar line */}
          <div
            className="mb-2 h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/30"
            onClick={(e) => {
              const video = videoRef.current;
              if (!video || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = (clickX / rect.width) * duration;
              video.currentTime = newTime;
              setCurrentTime(newTime);
            }}
          >
            <div
              className="h-full rounded-full bg-[var(--red)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 active:scale-95"
              >
                {isPlaying ? (
                  <IconPause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <IconPlay className="ml-0.5 h-3.5 w-3.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                aria-label="Replay"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 active:scale-95"
              >
                <IconReplay className="h-3.5 w-3.5" />
              </button>

              <span className="font-mono text-[10px] text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-black transition-all ${
                isMuted
                  ? "bg-[var(--red)] text-white hover:brightness-110"
                  : "bg-white/20 text-white hover:bg-white/40"
              }`}
            >
              {isMuted ? (
                <>
                  <IconMute className="h-3.5 w-3.5" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <IconSpeaker className="h-3.5 w-3.5" />
                  <span>Audio On</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
