'use client';

import { useCallback, useEffect, useState } from 'react';

// Read aloud for the directions sheet (docs/SLIC-DIRECTIONS.md): the browser's
// own text-to-speech (`speechSynthesis`, on iPhone and Android), so no server
// and no microphone. Speaking stops when the page is hidden, since a browser
// pauses it then anyway (switching to the maps app), and on unmount, so a
// closed sheet never keeps talking. `supported` is false until mounted.
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nothing to stop.
    }
    setSpeaking(false);
  }, []);

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [stop]);

  const speak = useCallback((text) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }, []);

  return { supported, speaking, speak, stop };
}
