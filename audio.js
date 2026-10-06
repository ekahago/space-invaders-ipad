// Generate audio locally: no external MP3 downloads or per-element iOS unlocks.
const shootSound = "shoot", hitSound = "hit", shieldHitSound = "shield", explosionSound = "explosion";
let audioContext;
let soundsEnabled = true;
let musicEnabled = false;
let musicTimer = null;
let musicStep = 0;
let nextNoteTime = 0;
const voices = new Map();
const soundButton = document.getElementById("soundButton");
const musicButton = document.getElementById("musicButton");
const audioStatus = document.getElementById("audioStatus");
const melodies = [
  [60, 67, 72, 67, 63, 70, 75, 70],
  [57, 60, 64, 69, 67, 64, 60, 64],
  [62, 65, 69, 74, 72, 69, 65, 69],
  [60, 64, 67, 71, 72, 71, 67, 64]
];
async function unlockAudio() {
  try {
    if (!audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error("Web Audio unavailable");
      // On supported iPads, use media playback rather than the ambient session.
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (_) {}
      audioContext = new Context();
    }
    if (audioContext.state !== "running") await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("Audio suspended");
    audioStatus.textContent = "";
    return true;
  } catch (_) {
    audioStatus.textContent = "Ljudet kunde inte starta. Tryck på ljudknappen för att försöka igen.";
    return false;
  }
}
function tone(frequency, duration, type, volume, when, endFrequency, group = "effect") {
  if (!audioContext || audioContext.state !== "running") return;
  // Leave a small scheduling margin for immediate game sounds on mobile browsers.
  when = Math.max(when, audioContext.currentTime + 0.015);
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
  gain.gain.setValueAtTime(0.0001, when);
  if (group === "effect") {
    gain.gain.linearRampToValueAtTime(volume, when + 0.008);
    gain.gain.linearRampToValueAtTime(0, when + duration);
  } else {
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  }
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  voices.set(oscillator, group);
  oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(when);
  oscillator.stop(when + duration + 0.01);
}
function stopVoices(group) {
  for (const [voice, kind] of voices) {
    if (kind !== group) continue;
    try { voice.stop(); } catch (_) {}
    voices.delete(voice);
  }
}
function effect(kind) {
  if (!soundsEnabled || !audioContext || audioContext.state !== "running") return;
  const now = audioContext.currentTime;
  if (kind === "shoot") tone(1100, 0.16, "square", 0.13, now, 240);
  else if (kind === "hit") tone(720, 0.18, "triangle", 0.22, now, 190);
  else if (kind === "shield") tone(330, 0.22, "square", 0.13, now, 100);
  else tone(280, 0.32, "sawtooth", 0.18, now, 70);
}
function playExplosion() { effect(explosionSound); }
function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  stopVoices("music");
}
function scheduleMusic() {
  if (!musicEnabled || state !== "playing" || !audioContext || audioContext.state !== "running") return;
  const melody = melodies[Number(document.getElementById("musicSelect").value) - 1];
  if (nextNoteTime < audioContext.currentTime) nextNoteTime = audioContext.currentTime;
  while (nextNoteTime < audioContext.currentTime + 0.15) {
    const note = melody[musicStep % melody.length];
    tone(440 * Math.pow(2, (note - 69) / 12), 0.17, "triangle", 0.045, nextNoteTime, null, "music");
    if (musicStep % 2 === 0) tone(440 * Math.pow(2, (melody[0] - 24 - 69) / 12), 0.28, "sine", 0.07, nextNoteTime, null, "music");
    musicStep++;
    nextNoteTime += 0.22;
  }
}
function syncMusic() {
  if (!musicEnabled || state !== "playing" || !audioContext || audioContext.state !== "running") stopMusic();
  else if (musicTimer === null) {
    nextNoteTime = audioContext.currentTime;
    scheduleMusic();
    musicTimer = setInterval(scheduleMusic, 75);
  }
  musicButton.textContent = musicEnabled ? "Musik: på" : "Musik: av";
  musicButton.setAttribute("aria-pressed", String(musicEnabled));
}
async function resumeGameAudio(testSound = false) {
  if ((soundsEnabled || musicEnabled) && await unlockAudio()) {
    syncMusic();
    if (testSound && soundsEnabled) effect(shootSound);
  }
}
async function changeMusic() {
  stopMusic(); musicStep = 0;
  if (musicEnabled) await unlockAudio();
  syncMusic();
}
soundButton.addEventListener("click", async () => {
  soundButton.disabled = true;
  if (soundsEnabled) { soundsEnabled = false; stopVoices("effect"); }
  else {
    soundsEnabled = await unlockAudio();
    if (soundsEnabled) effect(shootSound);
  }
  soundButton.textContent = soundsEnabled ? "Ljudeffekter: på" : "Ljudeffekter: av";
  soundButton.setAttribute("aria-pressed", String(soundsEnabled));
  soundButton.disabled = false;
  soundButton.blur();
});
musicButton.addEventListener("click", async () => {
  musicButton.disabled = true;
  musicEnabled = musicEnabled ? false : await unlockAudio();
  syncMusic();
  musicButton.disabled = false;
  musicButton.blur();
});
document.getElementById("musicSelect").addEventListener("change", changeMusic);


