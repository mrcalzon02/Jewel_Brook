/* Versioned, isolated player-level data for the real Jewel Brook match-three engine. */
(function(root){'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.RupeeEngine;
if(!E)throw Error('Custom levels require the Jewel Brook engine');
const VERSION=1, KEY='jewelbrook.custom-levels.v1', MAX_BYTES=32768, MAX_LEVELS=40;
const KINDS=new Set(['score','collect','ice','locks','chests','jam']);
const CELL_KEYS=new Set(['type','ice','lock','chest','jam','fuse']);
const ROOT_KEYS=new Set(['version','id','title','width','height','mask','cells','moves','goal','seed','objectives']);
function fail(reason){throw new Error('Custom level: '+reason);}
function integer(n,min,max,name){if(!Number.isInteger(n)||n<min||n>max)fail(name+' must be '+min+'–'+max);return n;}
function object(x,name){if(!x||typeof x!=='object'||Array.isArray(x))fail(name+' must be an object');return x;}
function parse(input){
 if(typeof input!=='string')return input;
 if(input.length>MAX_BYTES)fail('import exceeds 32 KiB');
 try{return JSON.parse(input);}catch(_){fail('invalid JSON');}
}
function instantiateValidated(s){
 const g=E.create(1,s.seed),roster=[...new Set(s.cells.filter(Boolean).map(c=>c.type))].sort((a,b)=>a-b);
 const totals={ice:0,locks:0,chests:0,jam:0,bombs:0};
 for(const c of s.cells)if(c){totals.ice+=c.ice>0?1:0;totals.locks+=c.lock>0?1:0;totals.chests+=c.chest>0?1:0;totals.jam+=c.jam>0?1:0;totals.bombs+=c.fuse>0?1:0;}
 g.cfg={...g.cfg,number:1,trial:null,chapter:1,width:s.width,height:s.height,mask:[...s.mask],
  moves:s.moves,goal:s.goal,roster,typeCount:roster.length,
  objectives:s.objectives.map(o=>({...o})),features:{conveyors:[],portals:[],wind:[]},
  tileOverlays:[],elementPool:[],ice:totals.ice,locks:totals.locks,chests:totals.chests,
  jam:totals.jam,bombs:totals.bombs,
  iceLayers:Math.max(0,...s.cells.filter(Boolean).map(c=>c.ice)),
  lockLayers:Math.max(0,...s.cells.filter(Boolean).map(c=>c.lock)),
  chestLayers:Math.max(0,...s.cells.filter(Boolean).map(c=>c.chest)),
  fuseTurns:Math.max(0,...s.cells.filter(Boolean).map(c=>c.fuse)),
  title:'Player levels',stageTitle:s.title,hint:'Player-authored level. Campaign progress and daily moves are unaffected.'};
 g.cells=s.cells.map(c=>c?{type:c.type,ice:c.ice,lock:c.lock,chest:c.chest,jam:c.jam,fuse:c.fuse,
  special:null,hold:0,elemental:null,frozen:0,poison:0,ward:0,rock:0,aura:null,auraTurns:0}:null);
 g.moves=s.moves;g.customLevelId=s.id;
 return g;
}
function normalize(input){
 const raw=object(parse(input),'document');
 for(const key of Object.keys(raw))if(!ROOT_KEYS.has(key))fail('unsupported field '+key);
 if(raw.version!==VERSION)fail('unsupported version (expected 1)');
 if(typeof raw.id!=='string'||!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(raw.id))fail('id must be 1–40 lowercase letters, numbers, _ or -');
 if(typeof raw.title!=='string'||raw.title.trim().length<1||raw.title.length>80)fail('title must be 1–80 characters');
 const width=integer(raw.width,4,8,'width'),height=integer(raw.height,5,9,'height');
 if(!Array.isArray(raw.mask)||raw.mask.length!==width*height||!raw.mask.every(v=>typeof v==='boolean'))fail('mask must contain one boolean per board cell');
 if(raw.mask.filter(Boolean).length<12)fail('at least 12 playable cells are required');
 if(!Array.isArray(raw.cells)||raw.cells.length!==width*height)fail('cells must match the board dimensions');
 const cells=raw.cells.map((c,i)=>{
  if(!raw.mask[i]){if(c!==null)fail('masked-out cells must be null');return null;}
  object(c,'cell '+i);
  for(const key of Object.keys(c))if(!CELL_KEYS.has(key))fail('unsupported cell field '+key);
  const type=integer(c.type,0,E.TYPES.length-1,'gem type');
  if(E.RETIRED_NUTS.includes(E.TYPES[type]))fail('retired gem type '+E.TYPES[type]);
  const ice=integer(c.ice??0,0,5,'ice'),lock=integer(c.lock??0,0,5,'lock');
  const chest=integer(c.chest??0,0,5,'chest'),jam=integer(c.jam??0,0,1,'jam');
  const fuse=integer(c.fuse??0,0,8,'fuse');
  if([ice,lock,chest].filter(Boolean).length>1)fail('overlapping fixed blockers at cell '+i);
  return {type,ice,lock,chest,jam,fuse};
 });
 const roster=new Set(cells.filter(Boolean).map(c=>c.type));
 if(roster.size<3)fail('at least three distinct gem types are required');
 const moves=integer(raw.moves,1,60,'moves'),goal=integer(raw.goal,1,1000000,'score goal');
 const seed=integer(raw.seed,1,4294967295,'seed');
 if(!Array.isArray(raw.objectives)||raw.objectives.length<1||raw.objectives.length>2)fail('one or two objectives are required');
 const objectives=raw.objectives.map((o,i)=>{
  object(o,'objective '+i);
  if(!KINDS.has(o.kind))fail('unsupported objective '+o.kind);
  for(const key of Object.keys(o))if(!['kind','target','color'].includes(key))fail('unsupported objective field '+key);
  const target=integer(o.target,1,1000000,'objective target');
  if(o.kind==='collect'){
   const color=integer(o.color,0,E.TYPES.length-1,'objective gem');
   if(!roster.has(color))fail('collection gem must occur on the board');
   return {kind:o.kind,color,target};
  }
  if(o.color!==undefined)fail('color applies only to collect objectives');
  if(o.kind==='score'&&target!==goal)fail('score objective must equal score goal');
  const stock=o.kind==='ice'?cells.reduce((n,c)=>n+(c?.ice||0),0):
   o.kind==='locks'?cells.reduce((n,c)=>n+(c?.lock||0),0):
   o.kind==='chests'?cells.reduce((n,c)=>n+(c?.chest||0),0):
   o.kind==='jam'?cells.reduce((n,c)=>n+(c?.jam||0),0):Infinity;
  if(target>stock)fail(o.kind+' target exceeds available starting stock');
  return {kind:o.kind,target};
 });
 const spec={version:VERSION,id:raw.id,title:raw.title.trim(),width,height,mask:[...raw.mask],
  cells,moves,goal,seed,objectives};
 const game=instantiateValidated(spec);
 if(E.matches(game).hit.size)fail('starting board already contains an unresolved match');
 if(!E.hasMove(game))fail('starting board has no legal match-three move');
 return spec;
}
function instantiate(input){return instantiateValidated(normalize(input));}
function encode(input){return JSON.stringify(normalize(input),null,2);}
function readStore(storage){
 let raw;
 try{raw=storage.getItem(KEY);}catch(_){fail('storage cannot be read');}
 if(!raw)return [];
 if(raw.length>MAX_BYTES*MAX_LEVELS)fail('saved level collection is too large');
 let data;try{data=JSON.parse(raw);}catch(_){fail('saved level collection is corrupt');}
 if(!data||data.version!==VERSION||!Array.isArray(data.levels)||data.levels.length>MAX_LEVELS)fail('saved level collection has an unsupported format');
 const levels=data.levels.map(normalize),ids=new Set(levels.map(x=>x.id));
 if(ids.size!==levels.length)fail('duplicate saved level IDs');
 return levels;
}
function writeStore(storage,levels){
 try{storage.setItem(KEY,JSON.stringify({version:VERSION,levels}));}
 catch(_){fail('storage is full or unavailable');}
}
function saveLevel(storage,input){
 const level=normalize(input),levels=readStore(storage),index=levels.findIndex(x=>x.id===level.id);
 if(index>=0)levels[index]=level;else{if(levels.length>=MAX_LEVELS)fail('40 saved levels maximum');levels.push(level);}
 writeStore(storage,levels);return level;
}
function loadLevel(storage,id){return readStore(storage).find(x=>x.id===id)||null;}
function listLevels(storage){return readStore(storage).map(x=>({id:x.id,title:x.title,width:x.width,height:x.height}));}
function removeLevel(storage,id){const levels=readStore(storage),next=levels.filter(x=>x.id!==id);if(next.length===levels.length)return false;writeStore(storage,next);return true;}
function template(){
 const g=E.create(1,7919),s=E.snapshot(g);
 return normalize({version:1,id:'my-level-1',title:'My Crystal Trial',width:g.cfg.width,height:g.cfg.height,
  mask:g.cfg.mask,cells:s.cells.map(c=>c?{type:c.type}:null),
  moves:24,goal:1200,seed:7919,objectives:[{kind:'score',target:1200}]});
}
function unlocked(save){return Number(save?.stars?.[500])>0;}
const api={VERSION,KEY,MAX_LEVELS,normalize,encode,instantiate,saveLevel,loadLevel,listLevels,removeLevel,template,unlocked};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JewelBrookCustomLevels=api;
})(typeof window!=='undefined'?window:globalThis);
