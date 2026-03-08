/**
 * @fileoverview Procedural audio hook for game sound effects.
 *
 * Generates sounds in real time using the Web Audio API without
 * pre-recorded audio files. Includes sounds for mining, success,
 * failure, and electric drill.
 *
 * @module useSound
 */

import { useCallback } from 'react';

// Extend Window to include webkitAudioContext for Safari compatibility
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let audioContextInstance: AudioContext | null = null;

/**
 * Gets or creates the singleton AudioContext instance.
 * Resumes the context if suspended (browser autoplay requirement).
 */
function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext!;
    audioContextInstance = new AudioContextClass();
  }
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(() => undefined);
  }
  return audioContextInstance;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  detune = 0,
): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  if (detune) osc.detune.value = detune;

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08): void {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

/**
 * Hook that provides procedural audio functions for game events.
 */
export function useSound() {
  const mineHit = useCallback(() => {
    playTone(220, 0.08, 'square', 0.1);
    playTone(440, 0.05, 'sawtooth', 0.06, 50);
    playNoise(0.06, 0.1);
  }, []);

  const mineSuccess = useCallback(() => {
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 160);
  }, []);

  const mineFail = useCallback(() => {
    playTone(300, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.06), 100);
  }, []);

  const electricDrill = useCallback(() => {
    const ctx = getAudioContext();
    const duration = 0.7;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 120;

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 60;

    const modGain = ctx.createGain();
    modGain.gain.value = 40;
    osc2.connect(modGain);
    modGain.connect(osc1.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    osc1.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);

    playNoise(duration, 0.05);
  }, []);

  return { mineHit, mineSuccess, mineFail, electricDrill };
}
