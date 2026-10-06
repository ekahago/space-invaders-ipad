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
  if (bubbleTime > 0) {
    ctx.globalAlpha = .65;ctx.strokeStyle="#77efc2";ctx.shadowColor="#77efc2";ctx.shadowBlur=12;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(center,y+10,39,30,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawEnemy(enemy, timestamp) {
  const sprite = alienPixels[enemy.type], color = enemy.hitFlash > 0 ? "#ffffff" : enemyColors[enemy.type];
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
  ctx.shadowBlur = 0;
  if (enemy.type === 1) {
    ctx.strokeStyle = enemy.hp === 2 ? "#d6b9ff" : "#876d9b"; ctx.lineWidth = 1;
    ctx.strokeRect(enemy.x-3, enemy.y-3, enemy.w+6, enemy.h+6);
    if (enemy.hp === 1) { ctx.globalAlpha=.4;ctx.fillStyle="#a6acc1";ctx.fillRect(enemy.x+12,enemy.y-9,5,6); }
  }
  if (enemy.diving) {
    ctx.strokeStyle="#ff8fa9";ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(enemy.x+15,enemy.y+10,23,0,Math.PI*2);ctx.stroke();
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
  const sector = Math.floor((wave-1)/5);
  document.getElementById("missionValue").textContent = "SEKTOR " + (sector+1) + " · " + ["ORBIT", "NEBULOSA", "DJUPRYMD"][sector%3] + (boss ? " · BOSS" : "");
  const active=[];
  if(tripleTime>0)active.push("TRIPPEL " + Math.ceil(tripleTime) + "s");
  if(laserTime>0)active.push("LASER " + Math.ceil(laserTime) + "s");
  if(bubbleTime>0)active.push("SKYDD " + Math.ceil(bubbleTime) + "s");
  document.getElementById("buffValue").textContent=active.join(" · ") || "Fånga bonusar för nya vapen";
}
function drawScene(timestamp) {
  const dt = renderTime === null ? 0 : Math.max(0,Math.min((timestamp-renderTime)/1000,.05));
  renderTime = timestamp;
  ctx.clearRect(0,0,800,600);
  const space = ctx.createLinearGradient(0,0,0,600);
  const sector=Math.floor((wave-1)/5)%3;
  space.addColorStop(0,["#060b19","#130a20","#071915"][sector]); space.addColorStop(1,["#111c31","#271338","#10372c"][sector]);
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
  if(boss)drawBoss(timestamp);
  pickups.forEach(p=>drawPickup(p,timestamp));
  if(laserFlash>0)drawLaser();
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
    ctx.fillStyle=bossIntro>0?"#ff93a3":"#a4efff";ctx.font="bold 22px monospace";ctx.textAlign="center";ctx.fillText(bossIntro>0?"MODERSKEPP / VÅG "+wave:"VÅG "+String(wave).padStart(2,"0"),400,315);ctx.restore();
  }
  if(toast.time>0&&state==="playing"){
    ctx.save();ctx.globalAlpha=Math.min(1,toast.time);ctx.fillStyle="#071523cc";ctx.fillRect(130,380,540,32);
    ctx.fillStyle=toast.color;ctx.font="bold 13px monospace";ctx.textAlign="center";ctx.fillText(toast.text,400,401);ctx.restore();
  }
  updateHUD();
}


function drawPickup(p,timestamp){
  ctx.save();ctx.translate(p.x+14,p.y+14);
  const pulse=reducedMotion?1:1+Math.sin(timestamp/140)*.08;ctx.scale(pulse,pulse);
  ctx.shadowColor=pickupColors[p.type];ctx.shadowBlur=12;ctx.fillStyle="#10223a";ctx.strokeStyle=pickupColors[p.type];ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(17,0);ctx.lineTo(0,17);ctx.lineTo(-17,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle=pickupColors[p.type];ctx.font="bold 17px monospace";ctx.textAlign="center";ctx.fillText({triple:"T",bubble:"S",laser:"L"}[p.type],0,6);ctx.restore();
}
function drawLaser(){
  ctx.save();ctx.shadowColor="#a696ff";ctx.shadowBlur=20;ctx.fillStyle="#9476ff66";ctx.fillRect(laserX-7,0,14,player.y);
  ctx.fillStyle="#edddff";ctx.fillRect(laserX-2,0,4,player.y);ctx.restore();
}
function drawBoss(timestamp){
  const b=boss;ctx.save();ctx.translate(b.x,b.y);
  ctx.shadowColor="#ff7498";ctx.shadowBlur=12;
  path([[0,35],[22,9],[57,14],[68,0],[112,0],[123,14],[158,9],[180,35],[153,55],[112,52],[105,64],[75,64],[68,52],[27,55]],b.hitFlash>0?"#ffffff":"#715681");
  ctx.shadowBlur=0;
  path([[48,19],[65,7],[115,7],[132,19],[123,41],[57,41]],"#b2bfd4");
  ctx.fillStyle=b.hp<=b.maxHp/2?"#ff5f85":"#ffcf7b";ctx.fillRect(66,21,48,10);
  ctx.fillStyle="#19223b";ctx.fillRect(18,31,23,9);ctx.fillRect(139,31,23,9);
  ctx.fillStyle="#ff89b1";ctx.fillRect(30,49,10,7);ctx.fillRect(140,49,10,7);ctx.restore();
  ctx.save();ctx.fillStyle="#132337";ctx.fillRect(210,22,380,9);ctx.fillStyle=b.hp<=b.maxHp/2?"#ff7498":"#ffcc7f";ctx.fillRect(210,22,380*Math.max(0,b.hp/b.maxHp),9);
  ctx.fillStyle="#d8e6ff";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText("MODERSKEPP · "+Math.max(0,b.hp)+" / "+b.maxHp,400,16);ctx.restore();
}
