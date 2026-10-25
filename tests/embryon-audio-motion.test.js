'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../web/embryon-audio.js'),'utf8');
class AudioClip{
 constructor(url){this.url=url;this.volume=1;this.playbackRate=1;AudioClip.created.push(this);}
 play(){return Promise.resolve();}
 pause(){this.paused=true;}
}
AudioClip.created=[];
const timers=[],store={};
const win={Audio:AudioClip,localStorage:{getItem:id=>store[id]||null,setItem:(id,v)=>{store[id]=v;}},
 setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;}};
vm.runInNewContext(src,{window:win,Math,Date,Number,Promise,setTimeout:win.setTimeout});
const s=win.RupeeAudio;
assert(s.settings().sfx);
assert.equal(s.settings().voice,false,'narrator remains opt-in');
assert.equal(s.burst(6,2),6);
for(const timer of timers)timer.fn();
assert.equal(AudioClip.created.length,6,'cascade emits individual staggered pops');
assert(AudioClip.created.some(a=>a.url.endsWith('cascade.wav')),'cascade has initial accent');
assert(new Set(AudioClip.created.map(a=>a.playbackRate)).size>1,'consecutive gem pops vary in pitch');
assert(AudioClip.created.every(a=>a.volume>0&&a.volume<1));
s.configure({sfx:false});
assert.equal(s.burst(6),0,'muted mode suppresses all layered sounds');
assert.equal(AudioClip.created.length,6);
console.log('PASS Embryon audio: staggered layered crystals, pitch variation, SFX mute and independent voice setting');
