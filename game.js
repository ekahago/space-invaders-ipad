
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
let boss = null;
let bossIntro = 0;
let intermission = 0;
let waveDamage = 0;
let pickupSequence = 0;
let pickups = [];
let tripleTime = 0;
let laserTime = 0;
let bubbleTime = 0;
let laserFlash = 0;
let laserX = 0;
let runBest = 0;
let stats = { kills: 0, bosses: 0, bonuses: 0 };
let toast = { text: "", color: "#6ee6ff", time: 0 };
function notify(text, color = "#6ee6ff") { toast = { text, color, time: 2.2 }; }
const pickupTypes = ["triple", "bubble", "laser"];
const pickupColors = { triple: "#ffce7b", bubble: "#77efc2", laser: "#b5a1ff" };
const pickupLabels = { triple: "TRIPPELSKOTT", bubble: "SKYDDSBUBBLA", laser: "LASER" };
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
  overlay.setAttribute("data-mode", value);
  pauseButton.disabled = value !== "playing";
  const results = document.getElementById("results");
  results.hidden = value !== "over";
  document.getElementById("overlaySubtitle").textContent = value === "paused" ? "Ditt uppdrag väntar. Fortsätt när du är redo." : "Håll linjen. Stoppa invasionen.";
  if (value === "paused") { message.textContent = "Paus"; playButton.textContent = "Fortsätt"; }
  if (value === "over") {
    recordScore();
    message.textContent = score > runBest ? "Nytt rekord!" : "Uppdrag avslutat";
    document.getElementById("overlaySubtitle").textContent = "En ny omgång. Ett nytt försök att rädda jorden.";
    for (const [id, val] of Object.entries({ resultScore: score, resultBest: bestScore, resultWave: wave, resultKills: stats.kills, resultBosses: stats.bosses, resultBonuses: stats.bonuses })) document.getElementById(id).textContent = val;
    playButton.textContent = "Spela igen";
  }
  syncMusic();
}
function restart() {
  Object.assign(player, { x: 375, bullets: [], lives: 3, powerLevel: 0 });
  enemyBullets = [];
  boss = null; bossIntro = 0; intermission = 0; waveDamage = 0;
  pickups = []; pickupSequence = 0; tripleTime = 0; laserTime = 0; bubbleTime = 0; laserFlash = 0;
  stats = { kills: 0, bosses: 0, bonuses: 0 }; runBest = bestScore;
  toast.time = 0;
  score = 0; wave = 1; enemySpeed = 1; enemyDirection = 1;
  cooldown = 0; invulnerable = 0; nextPowerScore = 1000;
  particles.length = 0; waveFlash = 2;
  startWave(1); setState("playing");
}

const enemyColors = ["#68e3ff", "#d094ff", "#ffcb77"];

function createEnemies() {
  enemies = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 10; j++) {
      const type = i % 3;
      enemies.push({ x: 60 + j * 60, y: 60 + i * 40, w: 30, h: 20, type, hp: type === 1 ? 2 : 1, alive: true, diving: false, hitFlash: 0, diveTime: 0 });
    }
  }
}
function startWave(number) {
  wave = number; waveDamage = 0; intermission = 0;
  player.bullets = []; enemyBullets = []; enemyDirection = 1;
  enemySpeed = Math.min(3.5, 1 + (wave - 1) * .18);
  createShields(); waveFlash = 2;
  boss = null; bossIntro = 0;
  if (wave % 5 === 0) {
    enemies = [];
    const hp = 40 + (wave / 5 - 1) * 15;
    boss = { x: 310, y: 82, w: 180, h: 64, hp, maxHp: hp, age: 0, fireTimer: .8, hitFlash: 0 };
    bossIntro = 2.2;
    notify("ALERT · MODERSKEPP NÄRMAR SIG", "#ff93a3");
  } else {
    createEnemies();
    if (wave === 1) notify("FÅNGA BONUSAR · UNDVIK DYKANDE SKEPP");
  }
}
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + (a.w || 4) > b.x && a.y < b.y + b.h && a.y + (a.h || 10) > b.y;
}
function dropPickup(x, y, forcedType) {
  const type = forcedType || pickupTypes[pickupSequence++ % pickupTypes.length];
  pickups.push({ x: x - 14, y, w: 28, h: 28, type, age: 0 });
}
function collectPickup(pickup) {
  if (pickup.type === "triple") tripleTime = 12;
  if (pickup.type === "laser") laserTime = 7;
  if (pickup.type === "bubble") bubbleTime = 15;
  stats.bonuses++;
  notify(pickupLabels[pickup.type] + " AKTIVERAD", pickupColors[pickup.type]);
  burst(player.x + 25, player.y, pickupColors[pickup.type], 22);
  effect(hitSound);
}
function hitPlayer() {
  if (state !== "playing" || invulnerable > 0) return;
  if (bubbleTime > 0) {
    bubbleTime = 0; invulnerable = .6;
    notify("SKYDDSBUBBLAN TOG TRÄFFEN", "#77efc2");
    burst(player.x + 25, player.y, "#77efc2", 24); effect(shieldHitSound);
    return;
  }
  invulnerable = 1.2; player.lives--; waveDamage++;
  burst(player.x + 25, player.y, "#77e8ff", 24);
  effect(shieldHitSound); playExplosion();
  if (player.powerLevel > 0) player.powerLevel--;
  if (player.lives <= 0) setState("over");
}
function hitEnemy(enemy) {
  if (!enemy.alive) return;
  enemy.hp--; enemy.hitFlash = .12;
  effect(hitSound);
  if (enemy.hp > 0) { burst(enemy.x + 15, enemy.y + 10, "#ffffff", 5); return; }
  enemy.alive = false; stats.kills++;
  score += (enemy.type === 1 ? 150 : enemy.diving ? 200 : 100) * wave;
  recordScore(); burst(enemy.x + 15, enemy.y + 10, enemyColors[enemy.type]); playExplosion();
  // A guaranteed drop every eight kills keeps bonuses useful without relying on luck.
  if (stats.kills % 8 === 0) dropPickup(enemy.x + 15, enemy.y + 20);
}
function hitBoss() {
  if (!boss || bossIntro > 0) return;
  boss.hp--; boss.hitFlash = .09; effect(hitSound);
  burst(boss.x + boss.w / 2, boss.y + boss.h, "#ffcc7f", 3);
  if (boss.hp <= 0) {
    const x = boss.x, y = boss.y;
    for (let i = 0; i < 5; i++) burst(x + 20 + i * 35, y + 30, i % 2 ? "#ff93a3" : "#ffce7b", 20);
    stats.bosses++; stats.kills++; score += 2500 * wave; recordScore();
    dropPickup(x + 90, y + 65); boss = null; playExplosion();
    notify("MODERSKEPP BESEGRAT", "#ffce7b");
  }
}
function finishWave() {
  if (state !== "playing" || intermission > 0) return;
  const bonus = (waveDamage === 0 ? 500 : 200) * wave;
  score += bonus; recordScore();
  notify((waveDamage === 0 ? "PERFEKT VÅG" : "VÅG KLAR") + " · +" + bonus, "#77efc2");
  intermission = 2.4; enemyBullets = []; player.bullets = [];
}
function moveBoss() {
  if (!boss) return;
  boss.hitFlash = Math.max(0, boss.hitFlash - STEP);
  if (bossIntro > 0) { bossIntro = Math.max(0, bossIntro - STEP); return; }
  boss.age += STEP;
  boss.x = 310 + Math.sin(boss.age * .8) * 245;
  boss.y = 82 + Math.sin(boss.age * 1.6) * 14;
  boss.fireTimer -= STEP;
  if (boss.fireTimer > 0) return;
  const furious = boss.hp <= boss.maxHp / 2;
  boss.fireTimer = furious ? .65 : 1;
  const x = boss.x + boss.w / 2, y = boss.y + boss.h;
  if (furious) {
    for (const vx of [-2.8, -1.4, 0, 1.4, 2.8]) enemyBullets.push({ x, y, vx, vy: 3.1 });
  } else {
    const dx = player.x + 25 - x, dy = player.y - y, length = Math.hypot(dx, dy);
    enemyBullets.push({ x, y, vx: dx / length * 3.4, vy: dy / length * 3.4 });
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
  if (cooldown > 0 || intermission > 0 || bossIntro > 0) return;
  if (laserTime > 0) {
    cooldown = .14; laserFlash = .10; laserX = player.x + 25;
    for (const e of enemies) if (e.alive && laserX + 5 > e.x && laserX - 5 < e.x + e.w) hitEnemy(e);
    if (boss && laserX + 5 > boss.x && laserX - 5 < boss.x + boss.w) hitBoss();
  } else {
    cooldown = player.powerLevel === 2 ? .15 : .3;
    if (tripleTime > 0) {
      for (const vx of [-1.8, 0, 1.8]) player.bullets.push({ x: player.x + 23, y: player.y, vx });
    } else if (player.powerLevel >= 1) {
      player.bullets.push({ x: player.x + 10, y: player.y });
      player.bullets.push({ x: player.x + player.w - 14, y: player.y });
    } else player.bullets.push({ x: player.x + player.w / 2 - 2, y: player.y });
  }
  effect(shootSound);
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
  let divers = enemies.filter(e => e.alive && e.diving).length;
  enemies.forEach(e => {
    if (!e.alive) return;
    e.hitFlash = Math.max(0, e.hitFlash - STEP);
    if (e.diving) {
      e.diveTime += STEP;
      e.y += 3.2;
      e.x = Math.max(0, Math.min(770, e.x + e.diveVx + Math.sin(e.diveTime * 6) * .9));
      if (overlaps(e, player)) { hitPlayer(); e.y = 620; }
      if (e.y > 610) { e.diving = false; e.x = e.homeX; e.y = e.homeY; e.diveTime = 0; }
    } else {
      e.x += enemyDirection * enemySpeed * (e.type === 0 ? 1.15 : 1);
      if (e.x < 0 || e.x + e.w > canvas.width) hitEdge = true;
      if (e.type === 2 && divers < 2 && e.y < 330 && Math.random() < .0009) {
        divers++; e.diving = true; e.homeX = e.x; e.homeY = e.y; e.diveVx = Math.max(-1.4, Math.min(1.4, (player.x - e.x) / 130));
      }
    }
  });
  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach(e => { if (e.alive && !e.diving) { e.x = Math.max(0, Math.min(770, e.x)); e.y += 10; } });
  }
}
function checkCollisions() {
  for (const b of player.bullets) {
    // Barriers block normal shots; the temporary laser shoots over them.
    for (const shield of shields) if (!b.dead && shield.hp > 0 && overlaps(b, shield)) b.dead = true;
    for (const e of enemies) if (!b.dead && e.alive && overlaps(b, e)) { b.dead = true; hitEnemy(e); }
    if (!b.dead && boss && overlaps(b, boss)) { b.dead = true; hitBoss(); }
  }
  for (const b of enemyBullets) {
    for (const shield of shields) {
      if (!b.dead && shield.hp > 0 && overlaps(b, shield)) {
        b.dead = true; shield.hp--; burst(b.x, b.y, "#56eab5", 8); effect(shieldHitSound);
      }
    }
    if (!b.dead && overlaps(b, player)) { b.dead = true; hitPlayer(); }
  }
  shields = shields.filter(s => s.hp > 0);
  player.bullets = player.bullets.filter(b => !b.dead);
  enemyBullets = enemyBullets.filter(b => !b.dead);
}
function update() {
  cooldown = Math.max(0, cooldown - STEP);
  invulnerable = Math.max(0, invulnerable - STEP);
  tripleTime = Math.max(0, tripleTime - STEP); laserTime = Math.max(0, laserTime - STEP); bubbleTime = Math.max(0, bubbleTime - STEP);
  laserFlash = Math.max(0, laserFlash - STEP); toast.time = Math.max(0, toast.time - STEP);
  if (keys["ArrowLeft"] || keys["KeyA"] || held("left")) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["KeyD"] || held("right")) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  for (const pickup of pickups) {
    pickup.y += 2; pickup.age += STEP;
    if (overlaps(pickup, player)) { collectPickup(pickup); pickup.collected = true; }
  }
  pickups = pickups.filter(p => !p.collected && p.y < 600);
  if (intermission > 0) {
    intermission = Math.max(0, intermission - STEP);
    if (intermission === 0) startWave(wave + 1);
    checkPowerLevel(); return;
  }
  if (keys["Space"] || held("fire")) fire();
  player.bullets.forEach(b => { b.y -= 7; b.x += b.vx || 0; });
  player.bullets = player.bullets.filter(b => b.y > -10 && b.x > -4 && b.x < 800);
  enemyBullets.forEach(b => { b.y += b.vy ?? 4; b.x += b.vx || 0; });
  enemyBullets = enemyBullets.filter(b => b.y < 600 && b.x > -4 && b.x < 800);
  if (boss) moveBoss(); else moveEnemies();
  checkCollisions();
  if (enemies.some(e => e.alive && !e.diving && e.y + e.h >= player.y)) setState("over");
  if (state !== "playing") return;
  if (!boss && enemies.every(e => !e.alive)) finishWave();
  else if (!boss) enemyFire();
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


