
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = { x: 375, y: 550, w: 50, h: 20, speed: 5, bullets: [], lives: 3, powerLevel: 0 };
let keys = {};
let enemies = [];
let enemyDirection = 1;
let enemySpeed = 1;
let enemyBullets = [];
let shields = [];
let score = 0;
let wave = 1;
let bestScore = 0;
try { bestScore = Number(localStorage.getItem("spaceShooterBest")) || 0; } catch (_) {}
function recordScore() {
  if (score > bestScore) {
    bestScore = score;
    try { localStorage.setItem("spaceShooterBest", String(bestScore)); } catch (_) {}
  }
}
let state = "ready";
let cooldown = 0;
let invulnerable = 0;
let nextPowerScore = 1000;
let accumulator = 0;
let lastTime = null;
const STEP = 1 / 60;
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const pauseButton = document.getElementById("pauseButton");
const playButton = document.getElementById("playButton");
const pointers = new Map();
function clearInput() {
  keys = {};
  pointers.clear();
  document.querySelectorAll(".controls button").forEach(b => b.classList.remove("active"));
}
function setState(value) {
  state = value;
  clearInput();
  accumulator = 0;
  lastTime = null;
  overlay.hidden = value === "playing";
  pauseButton.disabled = value !== "playing";
  if (value === "paused") { message.textContent = "Paus"; playButton.textContent = "Fortsätt"; }
  if (value === "over") { recordScore(); message.textContent = "Game over! Poäng: " + score; playButton.textContent = "Spela igen"; }
  syncMusic();
}
function restart() {
  Object.assign(player, { x: 375, bullets: [], lives: 3, powerLevel: 0 });
  enemyBullets = [];
  score = 0; wave = 1; enemySpeed = 1; enemyDirection = 1;
  cooldown = 0; invulnerable = 0; nextPowerScore = 1000;
  particles.length = 0; waveFlash = 2;
  createEnemies(); createShields(); setState("playing");
}

const enemyColors = ["#68e3ff", "#d094ff", "#ffcb77"];

function createEnemies() {
  enemies = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 10; j++) {
      enemies.push({ x: 60 + j * 60, y: 60 + i * 40, w: 30, h: 20, type: i % 3, alive: true });
    }
  }
}

function createShields() {
  shields = [];
  for (let i = 0; i < 3; i++) {
    shields.push({ x: 150 + i * 200, y: 450, w: 60, h: 20, hp: 5 });
  }
}

createEnemies();
createShields();

const gameKeys = new Set(["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "KeyP", "Escape"]);
document.addEventListener("keydown", e => {
  if (/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName) || (e.target.tagName === "BUTTON" && e.code === "Space")) return;
  if (!gameKeys.has(e.code)) return;
  e.preventDefault();
  if (e.code === "KeyP" || e.code === "Escape") {
    if (!e.repeat && (state === "playing" || state === "paused")) { resumeGameAudio(); setState(state === "playing" ? "paused" : "playing"); }
  } else if (state === "playing") keys[e.code] = true;
});
document.addEventListener("keyup", e => { delete keys[e.code]; });
for (const [id, action] of [["leftButton", "left"], ["rightButton", "right"], ["fireButton", "fire"]]) {
  const button = document.getElementById(id);
  button.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (state !== "playing") return;
    if ((soundsEnabled || musicEnabled) && (!audioContext || audioContext.state !== "running")) resumeGameAudio();
    button.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, action);
    button.classList.add("active");
  });
  const release = e => {
    pointers.delete(e.pointerId);
    if (![...pointers.values()].includes(action)) button.classList.remove("active");
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", e => e.preventDefault());
}
function held(action) { return [...pointers.values()].includes(action); }
playButton.addEventListener("click", () => {
  const audioReady = resumeGameAudio(state !== "paused");
  state === "paused" ? setState("playing") : restart();
  playButton.blur();
  return audioReady;
});
pauseButton.addEventListener("click", () => setState("paused"));
document.getElementById("restartButton").addEventListener("click", e => { resumeGameAudio(true); restart(); e.currentTarget.blur(); });
window.addEventListener("blur", () => { if (state === "playing") setState("paused"); else clearInput(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && state === "playing") setState("paused"); });
function checkPowerLevel() {
  while (score >= nextPowerScore) {
    player.powerLevel = Math.min(2, player.powerLevel + 1);
    nextPowerScore += 1000;
  }
}

function fire() {
  let fireRate = player.powerLevel === 2 ? 0.15 : 0.3;
  if (cooldown <= 0) {
    if (player.powerLevel >= 1) {
      player.bullets.push({ x: player.x + 10, y: player.y });
      player.bullets.push({ x: player.x + player.w - 14, y: player.y });
    } else {
      player.bullets.push({ x: player.x + player.w / 2 - 2, y: player.y });
    }
    cooldown = fireRate;
    effect(shootSound);
  }
}

function enemyFire() {
  if (Math.random() < 0.02) {
    let shooters = enemies.filter(e => e.alive);
    if (shooters.length > 0) {
      let e = shooters[Math.floor(Math.random() * shooters.length)];
      enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h });
    }
  }
}

function moveEnemies() {
  let hitEdge = false;
  enemies.forEach(e => {
    if (e.alive) {
      e.x += enemyDirection * enemySpeed;
      if (e.x < 0 || e.x + e.w > canvas.width) hitEdge = true;
    }
  });
  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach(e => e.y += 10);
  }
}

function checkCollisions() {
  player.bullets.forEach(b => {
    enemies.forEach(e => {
      if (!b.dead && e.alive && b.x < e.x + e.w && b.x + 4 > e.x && b.y < e.y + e.h && b.y + 10 > e.y) {
        e.alive = false;
        b.dead = true;
        score += 100 * wave;
        recordScore();
        burst(e.x + e.w / 2, e.y + e.h / 2, enemyColors[e.type]);
        effect(hitSound);
        playExplosion();
      }
    });
  });

  if (enemies.every(e => !e.alive)) {
    enemySpeed += 0.5;
    wave++;
    waveFlash = 2;
    createEnemies();
    createShields();
    player.bullets = []; enemyBullets = [];
    enemyDirection = 1;
  }

  enemyBullets.forEach(b => {
    if (!b.dead && b.x < player.x + player.w && b.x + 4 > player.x && b.y < player.y + player.h && b.y + 10 > player.y) {
      b.dead = true;
      if (invulnerable > 0) return;
      invulnerable = 1;
      player.lives--;
      burst(player.x + player.w / 2, player.y, "#77e8ff", 24);
      effect(shieldHitSound);
      playExplosion();
      if (player.powerLevel > 0) player.powerLevel--;
      if (player.lives <= 0) {
        setState("over");
      }
    }
  });

  shields.forEach(shield => {
    player.bullets.forEach(b => {
      if (!b.dead && shield.hp > 0 && b.x < shield.x + shield.w && b.x + 4 > shield.x && b.y < shield.y + shield.h && b.y + 10 > shield.y) {
        b.dead = true;
      }
    });
    enemyBullets.forEach(b => {
      if (!b.dead && shield.hp > 0 && b.x < shield.x + shield.w && b.x + 4 > shield.x && b.y < shield.y + shield.h && b.y + 10 > shield.y) {
        b.dead = true;
        shield.hp--;
        burst(b.x, b.y, "#56eab5", 8);
        effect(shieldHitSound);
        playExplosion();
      }
    });
  });

  shields = shields.filter(s => s.hp > 0);
  player.bullets = player.bullets.filter(b => !b.dead);
  enemyBullets = enemyBullets.filter(b => !b.dead);
}

function update() {
  cooldown = Math.max(0, cooldown - STEP);
  invulnerable = Math.max(0, invulnerable - STEP);
  if (keys["ArrowLeft"] || keys["KeyA"] || held("left")) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["KeyD"] || held("right")) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  if (keys["Space"] || held("fire")) fire();

  player.bullets.forEach(b => b.y -= 7);
  player.bullets = player.bullets.filter(b => b.y > 0);

  enemyBullets.forEach(b => b.y += 4);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

  moveEnemies();
  checkCollisions();
  if (enemies.some(e => e.alive && e.y + e.h >= player.y)) setState("over");
  if (state !== "playing") return;
  enemyFire();
  checkPowerLevel();
}

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  if (state === "playing") {
    accumulator += Math.min((timestamp - lastTime) / 1000, 0.1);
    while (accumulator + 1e-9 >= STEP && state === "playing") {
      accumulator -= STEP;
      update();
    }
  }
  lastTime = timestamp;
  drawScene(timestamp);
  requestAnimationFrame(gameLoop);
}
drawScene(0);
requestAnimationFrame(gameLoop);

