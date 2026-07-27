import type { RevealPhase } from "./revealMachine";

let audioContext: AudioContext | undefined;

function getAudioContext() {
  audioContext ??= new AudioContext();
  return audioContext;
}

function playTone(frequency: number, duration: number, gainValue: number) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(gainValue, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playNoise(duration: number, gainValue: number) {
  const context = getAudioContext();
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = buffer.getChannelData(0);
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const source = context.createBufferSource();

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.55;
  }

  filter.type = "bandpass";
  filter.frequency.value = 920;
  gain.gain.setValueAtTime(gainValue, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
}

export function playRevealCue(phase: RevealPhase, muted: boolean) {
  if (muted) return;

  const context = getAudioContext();
  void context.resume();

  if (phase === "charging") {
    playTone(132, 0.12, 0.045);
    return;
  }

  if (phase === "tear") {
    playNoise(0.22, 0.035);
    return;
  }

  if (phase === "reveal") {
    playTone(440, 0.16, 0.035);
    playTone(660, 0.18, 0.026);
    return;
  }

  if (phase === "summary") {
    playTone(880, 0.2, 0.042);
  }
}
