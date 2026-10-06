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
