// src/hooks/useAudio.ts
import { useEffect, useRef, useState, useCallback } from "react";

export const useAudio = (url: string) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  /* ---------- lazy-init on first user gesture ---------- */
  const init = useCallback(async () => {
    if (ctxRef.current) return; // already initialised
    ctxRef.current = new AudioContext();
    gainRef.current = ctxRef.current.createGain();
    gainRef.current.gain.value = 0.45; // default volume
    gainRef.current.connect(ctxRef.current.destination);

    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await ctxRef.current.decodeAudioData(arrayBuf);

    sourceRef.current = ctxRef.current.createBufferSource();
    sourceRef.current.buffer = audioBuf;
    sourceRef.current.loop = true;
    sourceRef.current.connect(gainRef.current);

    setReady(true);
  }, [url]);

  /* ---------- play / pause ---------- */
  const play = useCallback(async () => {
    if (!ready) return;
    if (ctxRef.current?.state === "suspended") await ctxRef.current.resume();
    sourceRef.current?.start(0);
    setPlaying(true);
  }, [ready]);

  const pause = useCallback(() => {
    sourceRef.current?.stop(0);
    setPlaying(false);
  }, []);

  /* ---------- auto-restore if user had enabled ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("wt_audio") === "on";
    if (!saved) return;
    const unlock = () => {
      init().then(() => play());
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [init, play]);

  /* ---------- persist preference ---------- */
  useEffect(() => {
    localStorage.setItem("wt_audio", playing ? "on" : "off");
  }, [playing]);

  return { ready, playing, init, play, pause };
};
