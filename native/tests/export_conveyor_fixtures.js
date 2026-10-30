'use strict';
// Real Android engine and board-features.js run at native CMake configure time.
// The desktop package ships neither Node nor JavaScript.
const fs=require('node:fs');
const path=require('node:path');
const Engine=require('../../web/engine.js');
const Features=require('../../web/board-features.js');
const destination=process.argv[2];
if(!destination)throw Error('Expected fixture output path');
const specialId=v=>v==null?0:v==='row'?1:v==='column'?2:(()=>{throw Error('Unsupported special '+v);})();
const elementalId=v=>v==null?0:({water:1,fire:2,ice:3,earth:4,wind:5,lightning:6}[v]??(()=>{throw Error('Unsupported elemental '+v);})());
const encode=c=>c?[
  c.type,c.ice||0,c.lock||0,c.chest||0,c.rock||0,c.frozen||0,
  c.aura==='nature-vines'&&c.auraTurns>0?1:0,c.jam||0,c.poison||0,
  specialId(c.special),elementalId(c.elemental),c.hold||0
]:[-2,0,0,0,0,0,0,0,0,0,0,0];
const cases=[];
function add(name,level,turn,configure=()=>{}){
  const g=Engine.create(level,level*7919);
  if(!g.cfg.features||!Array.isArray(g.cfg.features.conveyors))throw Error('Missing original board features');
  configure(g);
  const before=g.cells.map(encode);
  const belts=g.cfg.features.conveyors;
  Features.advance(g,turn,()=>g.cells.map(c=>c?{...c}:null));
  const after=g.cells.map(encode);
  cases.push({name,level,turn,w:g.cfg.width,h:g.cfg.height,before,after,belts});
}
function onBelt(g,change){
  const ids=g.cfg.features.conveyors[0]?.indices;
  if(!ids||ids.length<3)throw Error('Stage 125 lost its authored conveyor');
  // Isolate blockers while retaining the Android-authored mask and gem identities.
  for(const i of ids){const c=g.cells[i];c.ice=c.lock=c.chest=c.rock=c.frozen=0;c.aura=null;c.auraTurns=0;}
  change(ids,g.cells);
}
add('authored-odd',125,1);
add('authored-even',125,2);
add('authored-fourth',125,4);
add('clear-odd',125,1,g=>onBelt(g,()=>{}));
add('clear-even',125,2,g=>onBelt(g,()=>{}));
add('clear-fourth',125,4,g=>onBelt(g,()=>{}));
for(const [field,value] of [['ice',2],['lock',1],['chest',2],['rock',1],['frozen',1]]){
  add(field+'-split',125,2,g=>onBelt(g,(ids,cells)=>{cells[ids[2]][field]=value;}));
}
add('vines-split',125,2,g=>onBelt(g,(ids,cells)=>{cells[ids[2]].aura='nature-vines';cells[ids[2]].auraTurns=2;}));
add('payload-and-anchored-status',125,2,g=>onBelt(g,(ids,cells)=>{
  cells[ids[0]].special='row';cells[ids[0]].elemental='water';cells[ids[0]].hold=2;
  cells[ids[1]].jam=1;cells[ids[1]].poison=2;
}));
add('split-with-singleton',125,2,g=>onBelt(g,(ids,cells)=>{cells[ids[1]].ice=1;}));
add('before-unlock',124,2);
const lines=['RRCONVEYOR1 '+cases.length];
for(const c of cases){
  lines.push(['CASE',c.name,c.level,c.w,c.h,c.turn,c.before.length].join(' '));
  lines.push('BELTS '+c.belts.length);
  for(const belt of c.belts)lines.push([belt.indices.length,belt.direction==='right'?1:0,belt.every,...belt.indices].join(' '));
  lines.push('BEFORE',...c.before.map(row=>row.join(' ')),'AFTER',...c.after.map(row=>row.join(' ')));
}

// Export stage 125's ACTUAL starting objective, roster and board from Android.
// This is a native-import prerequisite, not authorization to unlock stage 125.
const sourceStage=Engine.create(125,125*7919);
const sourceSnapshot=Engine.snapshot(sourceStage);
const sourceCfg=sourceStage.cfg;
const sourceObjective=sourceCfg.objectives[0];
if(sourceCfg.number!==125||sourceCfg.width!==7||sourceCfg.height!==8||
   sourceCfg.objectives.length!==1||sourceObjective.kind!=='collect'||
   !sourceCfg.roster.includes(sourceObjective.color)||sourceSnapshot.cells.length!==56||
   !Number.isInteger(sourceObjective.target)||sourceObjective.target<1)
  throw Error('Source stage 125 objective/geometry changed: native importer review required');
const authoredTiles=sourceSnapshot.cells.map(c=>{
  if(!c)return [-2,...Array(12).fill(0)];
  if(c.fuse||c.ward||(c.aura!==null&&c.aura!=='fire'&&c.aura!=='nature-vines'))
    throw Error('Stage 125 has an unsupported authored status');
  const fields=[c.type,c.ice,c.lock,c.chest,c.jam,c.poison,c.rock,c.frozen,
    c.aura==='nature-vines'?c.auraTurns:0,c.aura==='fire'?c.auraTurns:0,
    specialId(c.special),elementalId(c.elemental),c.hold];
  if(fields.some(v=>!Number.isInteger(v)))throw Error('Stage 125 has a non-integer tile');
  return fields;
});
lines.push(['AUTHORED125',125,sourceCfg.width,sourceCfg.height,sourceCfg.moves,
  sourceCfg.goal,sourceObjective.target,sourceObjective.color,
  sourceSnapshot.rngState,authoredTiles.length].join(' '));
lines.push('ROSTER '+sourceCfg.roster.length+' '+sourceCfg.roster.join(' '));
lines.push('TILES '+authoredTiles.map(row=>row.join(' ')).join(' '));

fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,lines.join('\n')+'\n');
console.log('Android board-features conveyor fixtures:',cases.length,'cases including source-authored stage 125');
