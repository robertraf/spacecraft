import { useRef, useCallback } from 'react';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'square', volume = 0.15, detune = 0) {
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

function playNoise(duration, volume = 0.08) {
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

export function useSound() {
  const lastPlayRef = useRef(0);

  const throttle = useCallback((fn, minInterval = 50) => {
    return (...args) => {
      const now = Date.now();
      if (now - lastPlayRef.current < minInterval) return;
      lastPlayRef.current = now;
      fn(...args);
    };
  }, []);

  const mineHit = useCallback(() => {
    // Rock striking sound - short metallic ping + crunch
    playTone(220, 0.08, 'square', 0.1);
    playTone(440, 0.05, 'sawtooth', 0.06, 50);
    playNoise(0.06, 0.1);
  }, []);

  const mineSuccess = useCallback(() => {
    // Ascending sparkle tones
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 160);
  }, []);

  const mineFail = useCallback(() => {
    // Descending dull tones
    playTone(300, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.06), 100);
  }, []);

  const electricDrill = useCallback(() => {
    // Buzzing electric drill sound - continuous oscillation
    const ctx = getAudioContext();
    const duration = 0.7;

    // Main buzz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 120;

    // Modulator for buzz texture
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

    // Add some grinding noise
    playNoise(duration, 0.05);
  }, []);

  return { mineHit, mineSuccess, mineFail, electricDrill };
}
