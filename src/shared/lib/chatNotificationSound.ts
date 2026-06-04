let audioContext: AudioContext | null = null;
let unlockBound = false;

/** Débloque l’audio après un geste utilisateur (politique autoplay des navigateurs). */
export function unlockChatAudioOnInteraction(): void {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;

  const unlock = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (Ctx) {
        audioContext ??= new Ctx();
        void audioContext.resume();
      }
    } catch {
      // ignore
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

/** Court signal sonore pour un nouveau message chat (Web Audio API, sans fichier). */
export function playChatNotificationSound(): void {
  if (typeof window === "undefined") return;

  try {
    const Ctx =
      window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctx) return;

    audioContext ??= new Ctx();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.1);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc.start(t);
    osc.stop(t + 0.3);
  } catch {
    // Navigateur sans audio ou politique autoplay
  }
}
