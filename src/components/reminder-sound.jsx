"use client";

import { isAudioUnlocked } from "@/lib/unlock-audio";
import { useEffect } from "react";
import { toast } from "sonner";

let audioInstance = null;
let audioUnlocked = false;
let playedSession = {
  morning: false,
  evening: false,
};

export function ReminderSound() {
  // 🔓 Unlock audio (wajib 1x interaksi user)
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked) return;

      const audio = new Audio("/asset/sounds/lala-backsound.mpeg");
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audioUnlocked = true;
        })
        .catch(() => {});

      document.removeEventListener("click", unlock);
    };

    document.addEventListener("click", unlock);
    return () => document.removeEventListener("click", unlock);
  }, []);

  // ⛔ STOP LISTENER
  useEffect(() => {
    const stopAudio = () => {
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.currentTime = 0;
        audioInstance = null;
      }
    };

    window.addEventListener("stop-reminder-sound", stopAudio);
    return () => window.removeEventListener("stop-reminder-sound", stopAudio);
  }, []);

  // ⏰ RANGE CHECK (login friendly)
  useEffect(() => {
    const getMinutes = (d) => d.getHours() * 60 + d.getMinutes();

    const checkRange = () => {
      if (!isAudioUnlocked()) return;

      const nowMinutes = getMinutes(new Date());

      if (
        nowMinutes >= 8 * 60 &&
        nowMinutes <= 8 * 60 + 15 &&
        !playedSession.morning
      ) {
        playedSession.morning = true;
        playSound();
      }

      if (
        nowMinutes >= 17 * 60 &&
        nowMinutes <= 17 * 60 + 10 &&
        !playedSession.evening
      ) {
        playedSession.evening = true;
        playSound();
      }
    };

    const playSound = () => {
      audioInstance?.pause();

      audioInstance = new Audio("/asset/sounds/lala-backsound.mpeg");
      audioInstance.play().then(() => {
        window.dispatchEvent(new Event("reminder-sound-played"));

        toast.info("Waktunya isi todo list!", {
          description: "Jangan lupa update pekerjaan anda.",
          duration: 5000,
        });
      });
    };

    // cek sekali saat login / page load
    checkRange();

    // optional: tetap cek tiap menit
    const interval = setInterval(checkRange, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
