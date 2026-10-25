const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');process.chdir(path.resolve(__dirname,'..'));
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'1',width:800,height:600,handlers:{},classList:{add(){},remove(){}},addEventListener(k,f){this.handlers[k]=f;},setAttribute(){},setPointerCapture(){},blur(){},getContext(){return new Proxy({},{get:(o,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}});return nodes.get(id);}
const weaponSlots=['cannon','triple','laser','missile','bomb'].map(weapon=>({
 dataset:{weapon}, handlers:{}, attributes:{}, ammo:{textContent:''}, disabled:false,
 classList:{toggle(name,active){this[name]=active;},add(name){this[name]=true;},remove(name){this[name]=false;}},
 addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(name,value){this.attributes[name]=value;},
 querySelector(){return this.ammo;},blur(){}
}));
const document={getElementById:node,querySelectorAll:(selector)=>selector==='.weapon-slot'?weaponSlots:[],addEventListener(){}};
class Audio{constructor(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const audioParam={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};
class AudioContext { constructor(){this.state='suspended';this.currentTime=0;this.destination={};} resume(){this.state='running';return Promise.resolve();} createOscillator(){return {frequency:audioParam,connect(){},disconnect(){},start(){},stop(){}};} createGain(){return {gain:audioParam,connect(){},disconnect(){}};} }
let timerCount=0;
const context=vm.createContext({document,Audio,audioParam,localStorage:{getItem(){return '1200';},setItem(){}},window:{addEventListener(){},AudioContext},navigator:{audioSession:{}},setInterval(){timerCount++;return timerCount;},clearInterval(){timerCount--;},requestAnimationFrame(){},console,assert});
for(const file of ['audio.js','rendering.js','game.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
vm.runInContext(`
soundsEnabled=false;
restart();assert.equal(bestScore,1200);assert.equal(wavePattern,'classic');assert.equal(enemies.length,50);
startWave(2);assert.equal(wavePattern,'weave');
startWave(3);assert.equal(wavePattern,'split');
startWave(4);assert.equal(wavePattern,'survival');assert.equal(survivalTime,25);assert.equal(enemies.length,30);
startWave(5);assert.equal(wavePattern,'boss');assert.ok(boss);assert.equal(enemies.length,0);
startWave(8);assert.equal(enemySpeed,2.15);
startWave(13);assert.equal(enemySpeed,2.15);
restart();enemyBullets=[{x:player.x+10,y:player.y}];checkCollisions();assert.equal(player.lives,2);assert.equal(enemyBullets.length,0);
restart();const armor=enemies.find(e=>e.type===1);player.bullets=[{x:armor.x+5,y:armor.y+2}];checkCollisions();assert.equal(armor.hp,1);assert.equal(armor.alive,true);
player.bullets=[{x:armor.x+5,y:armor.y+2}];checkCollisions();assert.equal(armor.alive,false);assert.equal(stats.kills,1);assert.equal(score,150);
restart();for(let i=0;i<40;i++)while(enemies[i].alive)hitEnemy(enemies[i]);
assert.equal(pickups.length,5);assert.equal(pickups.map(p=>p.type).join(','),'triple,bubble,laser,missile,bomb');
restart();collectPickup({type:'triple'});assert.equal(arsenal.triple,true);assert.equal(selectedWeapon,'triple');
cooldown=0;fire();assert.equal(player.bullets.length,3);assert.equal(player.bullets[0].vx,-1.8);
collectPickup({type:'laser'});assert.equal(arsenal.laser,15);cooldown=0;fire();assert.equal(arsenal.laser,14);
collectPickup({type:'missile'});cooldown=0;fire();assert.equal(arsenal.missile,7);assert.ok(player.bullets.some(b=>b.kind==='missile'));
collectPickup({type:'bomb'});cooldown=0;fire();assert.equal(arsenal.bomb,2);assert.ok(player.bullets.some(b=>b.kind==='bomb'));
startWave(2);assert.equal(arsenal.triple,true);assert.equal(arsenal.laser,14);assert.equal(arsenal.missile,7);assert.equal(arsenal.bomb,2);
assert.equal(chooseWeapon('cannon'),true);cycleWeapon();assert.equal(selectedWeapon,'triple');assert.equal(chooseWeapon('laser'),true);
restart();assert.equal(arsenal.triple,false);assert.equal(arsenal.laser,0);assert.equal(arsenal.missile,0);assert.equal(arsenal.bomb,0);
restart();collectPickup({type:'bubble'});const saved=player.lives;hitPlayer();assert.equal(player.lives,saved);assert.equal(bubbleTime,0);
restart();startWave(4);survivalTime=STEP/2;update();assert.ok(intermission>0);
assert.equal(enemies.length,0);assert.match(toast.text,/FIENDER RETIRERAR/);
let ticks=0;while(intermission>0&&ticks++<180)update();
assert.ok(ticks<180);assert.equal(wave,5);assert.ok(boss);assert.equal(enemies.length,0);assert.equal(state,'playing');
restart();startWave(5);bossIntro=0;boss.fireTimer=0;moveBoss();assert.equal(enemyBullets.length,1);
enemyBullets=[];boss.hp=boss.maxHp/2;boss.fireTimer=0;moveBoss();assert.equal(enemyBullets.length,5);
restart();keys.ArrowLeft=true;setState('paused');assert.equal(keys.ArrowLeft,undefined);
Math.random=()=>1;
function simulate(hz){restart();keys.ArrowLeft=true;gameLoop(0);for(let i=1;i<=hz;i++)gameLoop(i*1000/hz);return player.x;}
assert.equal(simulate(60),75);assert.equal(simulate(120),75);
restart();const down=(id,pointerId)=>document.getElementById(id).handlers.pointerdown({pointerId,pointerType:'touch',preventDefault(){}});
down('leftButton',1);down('fireButton',2);assert.ok(held('left')&&held('fire'));update();assert.equal(player.x,370);assert.equal(player.bullets.length,1);
document.getElementById('leftButton').handlers.pointercancel({pointerId:1});assert.ok(!held('left')&&held('fire'));
setState('paused');assert.equal(pointers.size,0);
restart();drawScene(2000);assert.equal(document.getElementById('waveValue').textContent,'01');
assert.equal(document.querySelectorAll('.weapon-slot')[0].attributes['aria-pressed'],'true');
assert.equal(document.querySelectorAll('.weapon-slot')[2].disabled,true);
collectPickup({type:'laser'});drawScene(2001);
assert.equal(document.querySelectorAll('.weapon-slot')[2].attributes['aria-pressed'],'true');
assert.equal(document.querySelectorAll('.weapon-slot')[2].ammo.textContent,'15');
assert.equal(document.querySelectorAll('.weapon-slot')[2].disabled,false);
document.querySelectorAll('.weapon-slot')[0].handlers.click({currentTarget:document.querySelectorAll('.weapon-slot')[0]});
assert.equal(selectedWeapon,'cannon');
drawScene(2002);assert.equal(document.querySelectorAll('.weapon-slot')[0].attributes['aria-pressed'],'true');
console.log('PASS: v3.2.2 survival transition, waves, weapons, shield, input and frame-rate.');
`,context);

vm.runInContext(`(async()=>{
soundsEnabled=true;await playButton.handlers.click();assert.equal(audioContext.state,'running');assert.equal(soundsEnabled,true);assert.equal(voices.size,1);
stopVoices('effect');cooldown=0;fire();assert.equal(voices.size,1);stopVoices('effect');
let linear=[];let scheduled=[];audioContext.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(value,time){linear.push([value,time]);}},connect(){},disconnect(){}});
audioContext.createOscillator=()=>({frequency:audioParam,connect(){},disconnect(){},start(time){scheduled.push(time);},stop(){}});
effect(shootSound);assert.equal(linear[0][0],0.13);assert.equal(linear[1][0],0);assert.ok(scheduled[0]>=audioContext.currentTime+0.015);
stopVoices('effect');soundsEnabled=true;
let lifeTones=[];
audioContext.createOscillator=()=>({frequency:{setValueAtTime(value){lifeTones.push(value);},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}});
restart();hitPlayer();assert.equal(player.lives,2);assert.deepEqual(lifeTones,[820,310,145,90,660]);
lifeTones=[];hitPlayer();assert.deepEqual(lifeTones,[]);
invulnerable=0;hitPlayer();assert.equal(player.lives,1);assert.deepEqual(lifeTones,[820,310,145,90,660]);
lifeTones=[];restart();collectPickup({type:'bubble'});lifeTones=[];hitPlayer();assert.equal(player.lives,3);assert.deepEqual(lifeTones,[330]);
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
console.log('PASS: loss-of-ship warning, shield tone, audio activation, local tones, stop, music switch, pause/resume, interrupted context recovery.');
})()`,context).catch(e=>{console.error(e);process.exitCode=1;});

