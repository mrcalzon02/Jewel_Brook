'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'web/embryon-music.js'),'utf8');
const game=fs.readFileSync(path.join(root,'web/game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
const android=fs.readFileSync(path.join(root,'android/app/src/main/java/io/github/mrcalzon02/rupeerush/MainActivity.java'),'utf8');
class FakeAudio {constructor(url){this.url=url;this.loop=false;this.volume=1;this.plays=0;this.pauses=0;FakeAudio.all.push(this);}play(){this.plays++;return Promise.resolve();}pause(){this.pauses++;}}
FakeAudio.all=[];
const listeners={},docListeners={},store=new Map();
const fake={
 document:{visibilityState:'visible',addEventListener:(name,fn)=>docListeners[name]=fn},
 addEventListener:(name,fn)=>listeners[name]=fn,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 Audio:FakeAudio,Blob,URL:{createObjectURL:blob=>{fake.blob=blob;return 'blob:rupee-music';},revokeObjectURL:()=>{}},
 fetch:async url=>({ok:fs.existsSync(path.join(root,'web',url)),arrayBuffer:async()=>fs.readFileSync(path.join(root,'web',url))})
};
vm.runInNewContext(js,{window:fake,Uint8Array,Array,Promise,String,Error});
const Music=fake.RupeeMusic;
assert.equal(Music.settings().music,true,'Music enabled by default independently of SFX');
assert.equal(Music.TRACK.parts.length,13);
assert.equal(Music.TRACK.bytes,5060262);
let hash=crypto.createHash('sha256'),size=0;
for(const part of Music.TRACK.parts){const file=fs.readFileSync(path.join(root,'web',part));hash.update(file);size+=file.length;}
assert.equal(size,Music.TRACK.bytes,'No missing or doubled audio bytes');
assert.equal(hash.digest('hex'),Music.TRACK.sha256,'Chunk reconstruction exactly matches Google Drive original');
assert.equal(FakeAudio.all.length,0,'No autoplay before a user action');
assert(html.indexOf('embryon-music.js')>=0&&html.indexOf('embryon-music.js')<html.indexOf('game.js'));
assert(game.includes("if(a==='toggle-music')"),'Music toggle routed in game');
assert(game.includes('Music.activate();handle(b);'),'Music starts from game button interaction');
assert(android.includes('setMediaPlaybackRequiresUserGesture(false)'),'WebView allows playback after asynchronous offline chunk load');
(async()=>{
 Music.activate();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(FakeAudio.all.length,1);
 assert(FakeAudio.all[0].plays>=1,'First gesture starts looping music');
 assert.equal(FakeAudio.all[0].loop,true);
 assert.equal(fake.blob.size,5060262,'Audio blob is complete');
 Music.configure({music:false});
 assert.equal(Music.settings().music,false);
 assert(FakeAudio.all[0].pauses>=1);
 assert.equal(JSON.parse(store.get('rupeerush.music.v1')).music,false);
 const plays=FakeAudio.all[0].plays;
 Music.activate();assert.equal(FakeAudio.all[0].plays,plays,'No playback while music disabled');
 Music.configure({music:true});assert(FakeAudio.all[0].plays>plays,'Can resume independently of SFX');
 fake.document.visibilityState='hidden';docListeners.visibilitychange();assert(FakeAudio.all[0].pauses>=2,'Pauses when backgrounded');
 const hiddenPlays=FakeAudio.all[0].plays;
 fake.document.visibilityState='visible';docListeners.visibilitychange();assert(FakeAudio.all[0].plays>hiddenPlays,'Resumes when foregrounded');
 listeners.pagehide();assert(FakeAudio.all[0].pauses>=3);
 console.log('Rupee Rush Frozen Glow 2 integration tests passed');
})().catch(err=>{console.error(err);process.exitCode=1;});
