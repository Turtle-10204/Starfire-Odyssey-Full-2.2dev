// =====================================================================
// audio.js — 8-bit 音效與 BGM 合成引擎。
// =====================================================================

// --- 內建 8-bit 晶片音效與動態 BGM 合成引擎 ---
// --- 內建輕量級原生 Web Audio 8-bit 晶片音效與 BGM 引擎（相容 iOS / iPad Safari） ---
let audioMuted = false;

let bgmStep = 0;

let lastBgmNoteTime = 0;

let nativeAudioCtx = null;

function initAudioEngine() {
  try {
    let AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!nativeAudioCtx && AudioCtx) {
      nativeAudioCtx = new AudioCtx();
    }
    if (nativeAudioCtx && nativeAudioCtx.state === "suspended") {
      nativeAudioCtx.resume();
    }
    if (typeof userStartAudio === "function") userStartAudio();
  } catch (e) {}
}

function playTone(freq, type = 'square', duration = 0.1, vol = 0.14, slideTo = null) {
  if (audioMuted) return;
  try {
    initAudioEngine();
    if (!nativeAudioCtx) return;
    if (nativeAudioCtx.state === "suspended") nativeAudioCtx.resume();

    let now = nativeAudioCtx.currentTime;
    let osc = nativeAudioCtx.createOscillator();
    let gain = nativeAudioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    let boostedVol = min(0.55, vol * 3.0);
    gain.gain.linearRampToValueAtTime(boostedVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(nativeAudioCtx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {}
}

function playSFX(name) {
  if (audioMuted) return;
  if (name === "jump") {
    playTone(260, 'square', 0.16, 0.13, 580);
  } else if (name === "flap") {
    playTone(340, 'triangle', 0.12, 0.15, 660);
  } else if (name === "coin") {
    playTone(987.77, 'square', 0.07, 0.13);
    setTimeout(() => playTone(1318.51, 'square', 0.22, 0.13), 65);
  } else if (name === "powerup") {
    let notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((f, idx) => setTimeout(() => playTone(f, 'square', 0.08, 0.13), idx * 55));
  } else if (name === "1up") {
    let notes = [330, 392, 659, 523, 587, 784, 1046.5];
    notes.forEach((f, idx) => setTimeout(() => playTone(f, 'triangle', 0.09, 0.18), idx * 65));
  } else if (name === "shrink") {
    let notes = [523, 440, 349, 261, 196];
    notes.forEach((f, idx) => setTimeout(() => playTone(f, 'sawtooth', 0.08, 0.13), idx * 65));
  } else if (name === "stomp") {
    playTone(220, 'square', 0.09, 0.15, 440);
  } else if (name === "kick") {
    playTone(180, 'triangle', 0.12, 0.16, 520);
  } else if (name === "shoot") {
    playTone(720, 'sawtooth', 0.1, 0.12, 180);
  } else if (name === "fireball") {
    playTone(540, 'square', 0.11, 0.13, 240);
  } else if (name === "brick") {
    playTone(140, 'sawtooth', 0.12, 0.16, 65);
  } else if (name === "death") {
    let notes = [493.88, 698.46, 698.46, 659.25, 587.33, 523.25];
    notes.forEach((f, idx) => setTimeout(() => playTone(f, 'square', 0.13, 0.15), idx * 110));
  } else if (name === "clear") {
    let notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    notes.forEach((f, idx) => setTimeout(() => playTone(f, 'square', 0.14, 0.15), idx * 120));
  } else if (name === "mapMove") {
    playTone(440, 'triangle', 0.06, 0.11, 587);
  }
}

function updateBGM() {
  if (audioMuted || gameState !== "PLAYING") return;
  initAudioEngine();
  if (!nativeAudioCtx) return;

  const MELODY_1_1 = [659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0];
  const MELODY_1_2 = [261, 523, 220, 440, 233, 466, 0, 0, 261, 523, 220, 440, 233, 466, 0, 0];
  const MELODY_1_3 = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 880, 784, 659, 587];
  const MELODY_1_4 = [220, 233, 220, 246, 220, 261, 246, 233, 196, 207, 196, 220, 196, 233, 220, 196];
  const MELODY_STAR = [523, 523, 523, 440, 523, 0, 523, 440, 493, 493, 493, 392, 493, 0, 493, 392];

  let activeMelody = MELODY_1_1;
  let tempo = 175;

  if (starTimer > 0) {
    activeMelody = MELODY_STAR;
    tempo = 115;
  } else if (currentLevel === 2 && !is1_2Intro) {
    activeMelody = MELODY_1_2;
    tempo = 190;
  } else if (currentLevel === 3) {
    activeMelody = MELODY_1_3;
    tempo = 170;
  } else if (currentLevel === 4) {
    activeMelody = MELODY_1_4;
    tempo = 155;
  }

  if (millis() - lastBgmNoteTime >= tempo) {
    lastBgmNoteTime = millis();
    let freq = activeMelody[bgmStep % activeMelody.length];
    bgmStep++;
    if (freq > 0) {
      let wave = starTimer > 0 ? 'square' : (currentLevel === 4 ? 'sawtooth' : 'triangle');
      playTone(freq, wave, (tempo / 1000) * 0.72, 0.135);
    }
  }
}
