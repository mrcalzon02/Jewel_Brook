/* Rupee Rush / Heroes of Embryon offline background music.
   Frozen Glow 2 by the project owner; split only to fit the GitHub upload bridge.
   No network streaming: all 13 parts are bundled in web/audio/music in the APK. */
(function(root){'use strict';
const STORE='rupeerush.music.v1';
const TRACK=Object.freeze({
 title:'Frozen Glow 2',bytes:5060262,
 sha256:'a4235a9b0797c96fca9ad6d9e870983657bece455f35dfa75f406b8688679fc5',
 parts:Object.freeze(Array.from({length:13},(_,i)=>'audio/music/frozen-glow-2.part-'+String(i+1).padStart(2,'0')+'.bin'))
});
let enabled=true;
try{const old=JSON.parse(root.localStorage?.getItem(STORE)||'null');if(old&&old.music===false)enabled=false;}catch(_){}
let activated=false,player=null,loading=null,lastError='',objectUrl=null;
const visible=()=>!root.document||root.document.visibilityState!=='hidden';
const shouldPlay=()=>enabled&&activated&&visible();
function settings(){return {music:enabled};}
function status(){return {state:lastError?'error':player?'ready':loading?'loading':'idle',error:lastError,title:TRACK.title};}
function stop(){if(player)player.pause();}
function play(){if(!player||!shouldPlay())return false;
 try{const promise=player.play();if(promise&&typeof promise.catch==='function')promise.catch(()=>{});return true;}catch(_){return false;}}
async function load(){
 if(player)return player;
 if(loading)return loading;
 loading=(async()=>{
  if(typeof root.fetch!=='function'||typeof root.Audio!=='function')throw Error('Audio playback is unavailable');
  const chunks=await Promise.all(TRACK.parts.map(async path=>{
   const response=await root.fetch(path);
   if(!response.ok)throw Error('Missing packaged music part: '+path);
   return new Uint8Array(await response.arrayBuffer());
  }));
  const bytes=chunks.reduce((sum,chunk)=>sum+chunk.byteLength,0);
  if(bytes!==TRACK.bytes)throw Error('Incomplete music file ('+bytes+' / '+TRACK.bytes+' bytes)');
  const blob=new root.Blob(chunks,{type:'audio/mpeg'});
  objectUrl=root.URL.createObjectURL(blob);
  player=new root.Audio(objectUrl);player.loop=true;player.volume=0.28;
  lastError='';return player;
 })().catch(err=>{lastError=String(err?.message||err);loading=null;
  if(objectUrl){root.URL.revokeObjectURL(objectUrl);objectUrl=null;}return null;});
 return loading;
}
function activate(){activated=true;if(!shouldPlay())return false;
 if(player)return play();
 void load().then(audio=>{if(audio)play();});return true;
}
function configure(next){
 if(typeof next?.music!=='boolean')return settings();
 enabled=next.music;
 try{root.localStorage?.setItem(STORE,JSON.stringify({music:enabled}));}catch(_){}
 if(!enabled)stop();else if(activated)activate();
 return settings();
}
root.document?.addEventListener?.('visibilitychange',()=>{if(!visible())stop();else if(activated)activate();});
root.addEventListener?.('pagehide',stop);
const api=Object.freeze({TRACK,settings,status,configure,activate,stop});
root.RupeeMusic=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
