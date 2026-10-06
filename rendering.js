// Canvas graphics are drawn locally, without downloaded artwork.
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
const stars = Array.from({ length: 100 }, (_, i) => ({
  x: (i * 173.31) % 800, y: (i * 97.73) % 600,
  size: i % 6 === 0 ? 1.8 : 0.8, speed: 5 + i % 22
}));
const particles = [];
let waveFlash = 0;
let renderTime = null;
const alienPixels = [
  ["0010000100", "0001001000", "0011111100", "0110110110", "1111111111", "1011111101", "1010000101", "0001100000"],
  ["0001111000", "0111111110", "1111111111", "1100110011", "1111111111", "0011001100", "0110110110", "1100000011"],
  ["0000110000", "0001111000", "0011111100", "0110110110", "1111111111", "0010110100", "0100000010", "1010000101"]
];
function burst(x, y, color, count = 15) {
  if (reducedMotion) count = 4;
  for (let i = 0; i < count && particles.length < 240; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 35 + Math.random() * 130;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: .3 + Math.random() * .45, color });
  }
}
function path(points, fill) {
  ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function drawShip(timestamp) {
  const x = player.x, y = player.y, center = x + player.w / 2;
  ctx.save();
  if (invulnerable > 0 && Math.floor(invulnerable * 12) % 2) ctx.globalAlpha = .35;
  const flame = reducedMotion ? 10 : 10 + Math.sin(timestamp / 60) * 5;
  ctx.shadowColor = "#64cfff"; ctx.shadowBlur = 14;
  path([[center-8,y+17],[center,y+20+flame],[center+8,y+17]], "#479dff");
  path([[center-4,y+17],[center,y+25],[center+4,y+17]], "#c2f7ff");
  ctx.shadowBlur = 0;
  // The ship body fits the original 50 x 20 collision box.
  path([[center,y],[x+50,y+20],[center+8,y+16],[center,y+19],[center-8,y+16],[x,y+20]], "#a3bfd4");
  path([[center,y],[center+9,y+16],[center,y+19],[center-9,y+16]], "#edf5ff");
  path([[center,y+4],[center+4,y+12],[center-4,y+12]], "#46cee8");
  ctx.fillStyle="#6ee6ff"; ctx.fillRect(x+4,y+16,7,3); ctx.fillRect(x+39,y+16,7,3);
  if (player.powerLevel > 0) {
    ctx.fillStyle="#ffd07e"; ctx.fillRect(x+9,y+7,3,9); ctx.fillRect(x+38,y+7,3,9);
  }
  ctx.restore();
}
function drawEnemy(enemy, timestamp) {
  const sprite = alienPixels[enemy.type], color = enemyColors[enemy.type];
  ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 7;
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col] === "1") ctx.fillRect(enemy.x + col * 3, enemy.y + row * 2.5, 3, 2.5);
    }
  }
  // Small engine trails give enemies a sense of flight.
  if (!reducedMotion) {
    ctx.globalAlpha = .25 + .15 * Math.sin(timestamp / 170 + enemy.x);
    ctx.fillRect(enemy.x+7,enemy.y-6,3,4); ctx.fillRect(enemy.x+20,enemy.y-6,3,4);
  }
  ctx.restore();
}
function drawShield(shield) {
  ctx.save();
  ctx.fillStyle = "#143f40"; ctx.strokeStyle = "#59dab9"; ctx.lineWidth = 1.5;
  ctx.shadowColor = "#4fffd0"; ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.moveTo(shield.x,shield.y+20); ctx.lineTo(shield.x+5,shield.y+5);
  ctx.lineTo(shield.x+16,shield.y); ctx.lineTo(shield.x+44,shield.y);
  ctx.lineTo(shield.x+55,shield.y+5); ctx.lineTo(shield.x+60,shield.y+20);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur=0; ctx.fillStyle="#65e2c2";
  for (let i=0;i<shield.hp;i++) ctx.fillRect(shield.x+9+i*9,shield.y+9,6,3);
  ctx.restore();
}
function updateHUD() {
  document.getElementById("scoreValue").textContent = String(score).padStart(6,"0");
  document.getElementById("bestValue").textContent = String(bestScore).padStart(6,"0");
  document.getElementById("waveValue").textContent = String(wave).padStart(2,"0");
  document.getElementById("livesValue").textContent = "♥ ".repeat(Math.max(0,player.lives)).trim() || "—";
  document.getElementById("powerValue").textContent = ["I","II","III"][player.powerLevel];
}
function drawScene(timestamp) {
  const dt = renderTime === null ? 0 : Math.max(0,Math.min((timestamp-renderTime)/1000,.05));
  renderTime = timestamp;
  ctx.clearRect(0,0,800,600);
  const space = ctx.createLinearGradient(0,0,0,600);
  space.addColorStop(0,"#060b19"); space.addColorStop(1,"#111c31");
  ctx.fillStyle=space; ctx.fillRect(0,0,800,600);
  const nebula=ctx.createRadialGradient(660,100,10,660,100,330);
  nebula.addColorStop(0,"#35245660"); nebula.addColorStop(1,"#35245600");
  ctx.fillStyle=nebula;ctx.fillRect(0,0,800,600);
  ctx.save();
  const planet=ctx.createRadialGradient(715,76,0,732,84,51);
  planet.addColorStop(0,"#376180");planet.addColorStop(.7,"#152d48");planet.addColorStop(1,"#0c162b");
  ctx.fillStyle=planet;ctx.beginPath();ctx.arc(732,84,51,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#6c8aac35";ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(732,84,75,15,-.35,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  for (const star of stars) {
    if (!reducedMotion && state === "playing") star.y=(star.y+star.speed*dt)%600;
    ctx.globalAlpha = star.size > 1 ? .8 : .35;
    ctx.fillStyle="#d8efff"; ctx.fillRect(star.x,star.y,star.size,star.size);
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle="#6ee6ff0c";ctx.lineWidth=1;
  for (let y=490;y<600;y+=25) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke(); }
  drawShip(timestamp);
  enemies.forEach(e=>{if(e.alive)drawEnemy(e,timestamp);});
  shields.forEach(drawShield);
  ctx.save();ctx.shadowBlur=10;ctx.shadowColor="#7cf1ff";ctx.fillStyle="#b1f4ff";
  player.bullets.forEach(b=>{ctx.fillRect(b.x,b.y,4,10);ctx.globalAlpha=.25;ctx.fillRect(b.x,b.y+10,4,10);ctx.globalAlpha=1;});
  ctx.shadowColor="#ff829c";ctx.fillStyle="#ff93a3";
  enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,4,10));ctx.restore();
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    if(state==="playing"){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    if(p.age>=p.life){particles.splice(i,1);continue;}
    ctx.globalAlpha=1-p.age/p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);
  }
  ctx.globalAlpha=1;
  if(waveFlash>0&&state==="playing"){
    waveFlash=Math.max(0,waveFlash-dt);
    ctx.save();ctx.globalAlpha=Math.min(1,waveFlash);ctx.fillStyle="#07121ec0";ctx.fillRect(260,284,280,46);
    ctx.fillStyle="#a4efff";ctx.font="bold 22px monospace";ctx.textAlign="center";ctx.fillText("VÅG "+String(wave).padStart(2,"0"),400,315);ctx.restore();
  }
  updateHUD();
}
