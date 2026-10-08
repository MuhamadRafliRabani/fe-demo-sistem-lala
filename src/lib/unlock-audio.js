let unlocked = false;

export const unlockAudio = () => {
  if (unlocked) return;

  const audio = new Audio("/asset/sounds/lala-backsound.mpeg");
  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      unlocked = true;
      localStorage.setItem("audio-unlocked", "1");
    })
    .catch(() => {});
};

export const isAudioUnlocked = () => {
  if (unlocked) return true;

  if (typeof window !== "undefined") {
    unlocked = localStorage.getItem("audio-unlocked") === "1";
  }
  return unlocked;
};
