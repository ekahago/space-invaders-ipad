const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');process.chdir(path.resolve(__dirname,'..'));
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'1',width:800,height:600,handlers:{},classList:{add(){},remove(){}},addEventListener(k,f){this.handlers[k]=f;},setAttribute(){},setPointerCapture(){},blur(){},getContext(){return new Proxy({},{get:(o,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}});return nodes.get(id);}
const document={getElementById:node,querySelectorAll:()=>[],addEventListener(){}};
class Audio{constructor(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const audioParam={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};
class AudioContext { constructor(){this.state='suspended';this.currentTime=0;this.destination={};} resume(){this.state='running';return Promise.resolve();} createOscillator(){return {frequency:audioParam,connect(){},disconnect(){},start(){},stop(){}};} createGain(){return {gain:audioParam,connect(){},disconnect(){}};} }
let timerCount=0;
const context=vm.createContext({document,Audio,audioParam,localStorage:{getItem(){return '1200';},setItem(){}},window:{addEventListener(){},AudioContext},navigator:{audioSession:{}},setInterval(){timerCount++;return timerCount;},clearInterval(){timerCount--;},requestAnimationFrame(){},console,assert});
for(const file of ['audio.js','rendering.js','game.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
vm.runInContext(`
soundsEnabled=false;
restart();assert.equal(bestScore,1200);enemyBullets=[{x:player.x+10,y:player.y}];checkCollisions();assert.equal(player.lives,2);assert.equal(enemyBullets.length,0);
score=2000;checkPowerLevel();invulnerable=0;enemyBullets=[{x:player.x+10,y:player.y}];checkCollisions();checkPowerLevel();assert.equal(player.powerLevel,1);
score=3000;checkPowerLevel();assert.equal(player.powerLevel,2);
restart();enemyBullets=[{x:160,y:450}];checkCollisions();assert.equal(shields[0].hp,4);assert.equal(enemyBullets.length,0);
restart();enemies[0].y=550;update();assert.equal(state,'over');
restart();keys.ArrowLeft=true;setState('paused');assert.equal(keys.ArrowLeft,undefined);
Math.random=()=>1;
function simulate(hz){restart();keys.ArrowLeft=true;gameLoop(0);for(let i=1;i<=hz;i++)gameLoop(i*1000/hz);return player.x;}
assert.equal(simulate(60),75);assert.equal(simulate(120),75);
restart();const down=(id,pointerId)=>document.getElementById(id).handlers.pointerdown({pointerId,pointerType:'touch',preventDefault(){}});
down('leftButton',1);down('fireButton',2);assert.ok(held('left')&&held('fire'));update();assert.equal(player.x,370);assert.equal(player.bullets.length,1);
document.getElementById('leftButton').handlers.pointercancel({pointerId:1});assert.ok(!held('left')&&held('fire'));
setState('paused');assert.equal(pointers.size,0);
restart();assert.equal(player.lives,3);assert.equal(score,0);assert.equal(wave,1);assert.equal(player.powerLevel,0);
assert.ok(particles.length<=240);drawScene(2000);assert.equal(document.getElementById('waveValue').textContent,'01');
console.log('PASS: consumed bullets, shields, power loss/recovery, invasion, pause, restart, 60/120 Hz, simultaneous pointers/cancel.');
`,context);

vm.runInContext(`
soundsEnabled=false;
restart();const armor=enemies.find(e=>e.type===1);const oldScore=score;
player.bullets=[{x:armor.x+5,y:armor.y+2}];checkCollisions();assert.equal(armor.hp,1);assert.equal(armor.alive,true);assert.equal(score,oldScore);assert.equal(player.bullets.length,0);
player.bullets=[{x:armor.x+5,y:armor.y+2}];checkCollisions();assert.equal(armor.alive,false);assert.equal(stats.kills,1);assert.equal(score,150);
restart();for(let i=0;i<24;i++)while(enemies[i].alive)hitEnemy(enemies[i]);assert.equal(pickups.length,3);assert.equal(pickups.map(p=>p.type).join(','),'triple,bubble,laser');
restart();collectPickup({type:'triple'});cooldown=0;fire();assert.equal(player.bullets.length,3);assert.equal(player.bullets[0].vx,-1.8);assert.equal(tripleTime,12);bubbleTime=5;dropPickup(200,350,'bubble');drawScene(2700);
tripleTime=STEP/2;update();assert.equal(tripleTime,0);
collectPickup({type:'bubble'});const savedLives=player.lives;hitPlayer();assert.equal(player.lives,savedLives);assert.equal(bubbleTime,0);assert.equal(waveDamage,0);invulnerable=0;hitPlayer();assert.equal(player.lives,savedLives-1);assert.equal(waveDamage,1);
restart();dropPickup(player.x+14,player.y,'laser');update();assert.equal(pickups.length,0);assert.ok(laserTime>0);assert.equal(stats.bonuses,1);
const target=enemies[0];target.x=player.x+10;cooldown=0;fire();assert.equal(target.alive,false);assert.ok(laserFlash>0);drawScene(2800);
restart();startWave(5);assert.ok(boss);assert.equal(enemies.length,0);drawScene(2500);const fullHP=boss.hp;hitBoss();assert.equal(boss.hp,fullHP);bossIntro=0;boss.fireTimer=0;moveBoss();assert.equal(enemyBullets.length,1);assert.ok(enemyBullets[0].vy>0);
enemyBullets=[];boss.hp=boss.maxHp/2;boss.fireTimer=0;moveBoss();assert.equal(enemyBullets.length,5);
while(boss)hitBoss();assert.equal(stats.bosses,1);assert.equal(stats.kills,1);assert.ok(particles.length<=240);update();assert.ok(intermission>0);assert.equal(enemyBullets.length,0);const clearScore=score;finishWave();assert.equal(score,clearScore);
for(let i=0;i<160;i++)update();assert.equal(wave,6);assert.equal(boss,null);assert.equal(enemies.length,50);
restart();const diver=enemies.find(e=>e.type===2);diver.diving=true;diver.homeX=diver.x;diver.homeY=diver.y;diver.diveVx=0;diver.diveTime=0;diver.x=player.x;diver.y=player.y-21;update();assert.equal(player.lives,2);assert.equal(state,'playing');assert.equal(diver.diving,false);
restart();enemies.forEach(e=>e.alive=false);update();assert.equal(score,500);assert.ok(intermission>0);cooldown=0;fire();assert.equal(player.bullets.length,0);
restart();tripleTime=5;setState('paused');gameLoop(0);gameLoop(1000);assert.equal(tripleTime,5);
setState('playing');player.lives=1;invulnerable=0;hitPlayer();assert.equal(state,'over');assert.equal(document.getElementById('results').hidden,false);assert.equal(document.getElementById('resultWave').textContent,1);assert.equal(document.getElementById('resultKills').textContent,0);
restart();assert.equal(boss,null);assert.equal(stats.kills,0);assert.equal(stats.bonuses,0);assert.equal(pickups.length,0);assert.equal(tripleTime,0);assert.equal(laserTime,0);assert.equal(bubbleTime,0);assert.equal(document.getElementById('results').hidden,true);
console.log('PASS: armored enemies, three guaranteed bonus types, spread/laser/bubble, boss intro/attacks/defeat, wave progression, diving collision, single wave bonus, paused timers, results and restart.');
`,context);

vm.runInContext(`(async()=>{
soundsEnabled=true;await playButton.handlers.click();assert.equal(audioContext.state,'running');assert.equal(soundsEnabled,true);assert.equal(voices.size,1);
stopVoices('effect');cooldown=0;fire();assert.equal(voices.size,1);stopVoices('effect');
let linear=[];let scheduled=[];audioContext.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(value,time){linear.push([value,time]);}},connect(){},disconnect(){}});
audioContext.createOscillator=()=>({frequency:audioParam,connect(){},disconnect(){},start(time){scheduled.push(time);},stop(){}});
effect(shootSound);assert.equal(linear[0][0],0.13);assert.equal(linear[1][0],0);assert.ok(scheduled[0]>=audioContext.currentTime+0.015);
stopVoices('effect');soundsEnabled=false;
await soundButton.handlers.click();assert.equal(soundsEnabled,true);assert.equal(audioContext.state,'running');assert.equal(voices.size,1);
await soundButton.handlers.click();assert.equal(soundsEnabled,false);assert.equal(voices.size,0);
restart();await musicButton.handlers.click();assert.equal(musicEnabled,true);assert.notEqual(musicTimer,null);assert.ok(voices.size>0);
document.getElementById('musicSelect').value='2';await changeMusic();assert.ok(voices.size>0);
setState('paused');assert.equal(musicTimer,null);assert.equal(voices.size,0);
setState('playing');assert.notEqual(musicTimer,null);
await musicButton.handlers.click();assert.equal(musicEnabled,false);assert.equal(musicTimer,null);assert.equal(voices.size,0);
audioContext.state='suspended';await soundButton.handlers.click();assert.equal(audioContext.state,'running');
assert.equal(navigator.audioSession.type,'playback');
console.log('PASS: audio activation, local tones, stop, music switch, pause/resume, interrupted context recovery.');
})()`,context).catch(e=>{console.error(e);process.exitCode=1;});

