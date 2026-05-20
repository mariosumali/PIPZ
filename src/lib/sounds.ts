let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function createNoise(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  return source;
}

/**
 * Satisfying wooden "tock" — low thump + high click layered together.
 */
export function playPlaceSound() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Layer 1: low thump
  const thump = ac.createOscillator();
  const thumpGain = ac.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(180, now);
  thump.frequency.exponentialRampToValueAtTime(80, now + 0.08);
  thumpGain.gain.setValueAtTime(0.35, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thump.connect(thumpGain).connect(ac.destination);
  thump.start(now);
  thump.stop(now + 0.12);

  // Layer 2: click transient (filtered noise)
  const click = createNoise(ac, 0.04);
  const clickFilter = ac.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3500;
  clickFilter.Q.value = 1.2;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.2, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  click.connect(clickFilter).connect(clickGain).connect(ac.destination);
  click.start(now);

  // Layer 3: subtle body resonance
  const body = ac.createOscillator();
  const bodyGain = ac.createGain();
  body.type = 'triangle';
  body.frequency.value = 260;
  bodyGain.gain.setValueAtTime(0.08, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  body.connect(bodyGain).connect(ac.destination);
  body.start(now);
  body.stop(now + 0.06);
}

/**
 * Quick two-tone "flick" — light and snappy, like a die being turned.
 */
export function playRotateSound() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Rising tick
  const tick = ac.createOscillator();
  const tickGain = ac.createGain();
  tick.type = 'sine';
  tick.frequency.setValueAtTime(500, now);
  tick.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  tickGain.gain.setValueAtTime(0.12, now);
  tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  tick.connect(tickGain).connect(ac.destination);
  tick.start(now);
  tick.stop(now + 0.05);

  // Soft noise flick
  const flick = createNoise(ac, 0.025);
  const flickFilter = ac.createBiquadFilter();
  flickFilter.type = 'bandpass';
  flickFilter.frequency.value = 5000;
  flickFilter.Q.value = 1.5;
  const flickGain = ac.createGain();
  flickGain.gain.setValueAtTime(0.08, now);
  flickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
  flick.connect(flickFilter).connect(flickGain).connect(ac.destination);
  flick.start(now);
}

/**
 * Dice roll → click: rapid tumbling taps that slow down,
 * ending with a resonant snap.
 */
export function playMergeSound(chainLink: number = 1) {
  const ac = getCtx();
  const now = ac.currentTime;

  const pitchBoost = 1 + (chainLink - 1) * 0.12;

  // Roll phase: 5 taps that decelerate
  const tapGaps = [0, 0.04, 0.07, 0.11, 0.16];
  tapGaps.forEach((offset, i) => {
    const t = now + offset;

    const tap = createNoise(ac, 0.025);
    const tapFilter = ac.createBiquadFilter();
    tapFilter.type = 'bandpass';
    tapFilter.frequency.value = (2000 + i * 400) * pitchBoost;
    tapFilter.Q.value = 2;
    const tapGain = ac.createGain();
    const volume = 0.06 + i * 0.03;
    tapGain.gain.setValueAtTime(volume, t);
    tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    tap.connect(tapFilter).connect(tapGain).connect(ac.destination);
    tap.start(t);

    // Subtle tonal ping per tap (rising pitch)
    const ping = ac.createOscillator();
    const pingGain = ac.createGain();
    ping.type = 'sine';
    ping.frequency.value = (300 + i * 80) * pitchBoost;
    pingGain.gain.setValueAtTime(0.04, t);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    ping.connect(pingGain).connect(ac.destination);
    ping.start(t);
    ping.stop(t + 0.03);
  });

  // Final satisfying click at the end of the roll
  const clickTime = now + 0.22;

  // Clean snap
  const snap = ac.createOscillator();
  const snapGain = ac.createGain();
  snap.type = 'sine';
  snap.frequency.setValueAtTime(600 * pitchBoost, clickTime);
  snap.frequency.exponentialRampToValueAtTime(300 * pitchBoost, clickTime + 0.08);
  snapGain.gain.setValueAtTime(0.3, clickTime);
  snapGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.15);
  snap.connect(snapGain).connect(ac.destination);
  snap.start(clickTime);
  snap.stop(clickTime + 0.15);

  // Crisp transient on the click
  const snapNoise = createNoise(ac, 0.03);
  const snapFilter = ac.createBiquadFilter();
  snapFilter.type = 'highpass';
  snapFilter.frequency.value = 4000;
  const snapNoiseGain = ac.createGain();
  snapNoiseGain.gain.setValueAtTime(0.15, clickTime);
  snapNoiseGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);
  snapNoise.connect(snapFilter).connect(snapNoiseGain).connect(ac.destination);
  snapNoise.start(clickTime);

  // Warm resonance tail
  const reso = ac.createOscillator();
  const resoGain = ac.createGain();
  reso.type = 'triangle';
  reso.frequency.value = 440 * pitchBoost;
  resoGain.gain.setValueAtTime(0.1, clickTime);
  resoGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.2);
  reso.connect(resoGain).connect(ac.destination);
  reso.start(clickTime);
  reso.stop(clickTime + 0.2);
}

/**
 * Explosion burst for 6s clearing — big boom + sparkle pings.
 */
export function playExplosionSound() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Deep boom
  const boom = ac.createOscillator();
  const boomGain = ac.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, now);
  boom.frequency.exponentialRampToValueAtTime(40, now + 0.3);
  boomGain.gain.setValueAtTime(0.35, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  boom.connect(boomGain).connect(ac.destination);
  boom.start(now);
  boom.stop(now + 0.3);

  // Burst noise
  const burst = createNoise(ac, 0.15);
  const burstFilter = ac.createBiquadFilter();
  burstFilter.type = 'bandpass';
  burstFilter.frequency.setValueAtTime(2000, now);
  burstFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
  burstFilter.Q.value = 0.8;
  const burstGain = ac.createGain();
  burstGain.gain.setValueAtTime(0.25, now);
  burstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  burst.connect(burstFilter).connect(burstGain).connect(ac.destination);
  burst.start(now);

  // Sparkle pings (scattered high notes)
  const sparkleNotes = [880, 1100, 1320, 660, 990];
  sparkleNotes.forEach((freq, i) => {
    const t = now + 0.05 + i * 0.04;
    const sparkle = ac.createOscillator();
    const sparkleGain = ac.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.value = freq;
    sparkleGain.gain.setValueAtTime(0.08, t);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    sparkle.connect(sparkleGain).connect(ac.destination);
    sparkle.start(t);
    sparkle.stop(t + 0.12);
  });
}
