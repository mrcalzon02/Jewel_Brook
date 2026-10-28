'use strict';
// Build-time only: export *authoritative* Rupee Rush stage-1..124 state from
// web/engine.js. No JavaScript/Chromium is shipped in the native desktop game.
const fs=require('node:fs');
const path=require('node:path');
const E=require('../../web/engine.js');
const out=process.argv[2];
if(!out)throw Error('Export path required');
const content=['RRCAMPAIGN14 124'];
for(let stage=1;stage<=124;stage++){
  const g=E.create(stage,stage*7919);
  const snapshot=E.snapshot(g);
  const cfg=g.cfg;
  if(cfg.width!==(stage<=10?4:stage<=30?5:stage<=70?6:7)||cfg.height!==cfg.width+1||(cfg.objectives.length!==1&&cfg.objectives.length!==2))
    throw Error('Intro stage '+stage+' changed dimensions/objective contract');
  const objective=cfg.objectives[0];
  const secondary=cfg.objectives[1]||null;
  const base=objective.kind==='score'?0:objective.kind==='ice'?1:objective.kind==='collect'?2:objective.kind==='locks'?3:objective.kind==='chests'?4:objective.kind==='jam'?6:-1;
  const secondaryKind=secondary?(secondary.kind==='ice'?1:secondary.kind==='locks'?3:secondary.kind==='chests'?4:-1):-1;
  const kind=secondary?5:base;
  if(secondary && (base!==2||secondaryKind<0))throw Error('Unported dual objective '+stage);
  if(kind<0)throw Error('Unsupported intro objective '+objective.kind+' at '+stage);
  const cells=snapshot.cells;
  if(cells.length!==cfg.width*cfg.height)throw Error('Malformed board at '+stage);
  for(const c of cells){
    if(!c)continue; // preserve Android's intentionally void silhouette cells
    if(!Number.isInteger(c.type)||c.type<0||!cfg.roster.includes(c.type)||
      !Number.isInteger(c.ice)||c.ice<0||c.ice>5||
      (!Number.isInteger(c.lock)||c.lock<0||c.lock>5)||(!Number.isInteger(c.chest)||c.chest<0||c.chest>5)||(!Number.isInteger(c.jam)||c.jam<0||c.jam>1)||c.fuse||c.special||c.hold||c.rock||
      c.ward||c.frozen||(!Number.isInteger(c.poison)||c.poison<0||c.poison>2)||
      (c.aura!==null && !(stage>=45 && c.aura==='fire' && c.auraTurns===2))||
      (c.aura===null && c.auraTurns!==0)||
      (c.elemental!==null && !(stage>=15 && (stage===15||stage===35||stage%7===0) && c.elemental===cfg.elementPool[Math.floor(stage/7)%cfg.elementPool.length])))
      throw Error('Stage '+stage+' added a feature not yet ported to desktop');
  }
  const expectedRoster=stage<15?[0,1,2]:stage<35?[0,1,2,11]:stage<80?[0,1,2,11,18]:stage<=100?[0,1,2,15,Math.floor((stage-1)/16)%2===0?11:18]:[0,1,2,3,15,Math.floor((stage-1)/16)%2===0?11:18];
  if(cfg.roster.join(',')!==expectedRoster.join(','))
    throw Error('Authoritative gem roster changed at stage '+stage);
  const powered=cells.filter(c=>c?.elemental).length;
  const powerId={water:1,fire:2,ice:3,earth:4,wind:5,lightning:6};
  if(cells.some(c=>c?.elemental && powerId[c.elemental]===undefined))
    throw Error('Unknown authored elemental power at '+stage);
  if(powered!==((stage>=15 && (stage===15||stage===35||stage%7===0))?1:0))
    throw Error('Stage '+stage+' has unexpected number of elemental pieces: '+powered);
  content.push([stage,cfg.width,cfg.height,cfg.moves,cfg.goal,kind,objective.target,
    snapshot.rngState,cells.length,(kind===2||kind===5)?objective.color:-1,secondaryKind,secondary?secondary.target:0].join(' '));
  content.push(cells.map(c=>c?c.type:-2).join(' '));
  content.push(cells.map(c=>c?c.ice:0).join(' '));
  content.push(cells.map(c=>c?c.lock:0).join(' '));
  content.push(cells.map(c=>c?c.chest:0).join(' '));
  content.push(cells.map(c=>c?c.jam:0).join(' '));
  content.push(cells.map(c=>c?c.poison:0).join(' '));
  content.push(cfg.roster.length+' '+cfg.roster.join(' '));
  // 0=ordinary, 1=Water, 2=Fire, 3=Ice; reject unported powers.
  content.push(cells.map(c=>c?.elemental?powerId[c.elemental]:0).join(' '));
  const burning=cells.filter(c=>c?.aura==='fire');
  if(burning.length!==(stage>=45 && (stage<115||Math.floor(stage/7)%2===0)?1:0))
    throw Error('Stage '+stage+' has unexpected Fire aura stock: '+burning.length);
  const seededPoison=cells.filter(c=>c?.poison>0);
  if(seededPoison.length!==(stage>=115&&Math.floor(stage/7)%2!==0?1:0))
    throw Error('Stage '+stage+' has unexpected poison tile stock: '+seededPoison.length);
  content.push(cells.map(c=>c?.aura==='fire'?c.auraTurns:0).join(' '));
  console.log('Android authored stage',stage,'moves',cfg.moves,'goal',cfg.goal,
    'objective',objective.kind,objective.target,
    'ice',cells.reduce((n,c)=>n+(c?c.ice:0),0),'locks',cells.reduce((n,c)=>n+(c?c.lock:0),0),'chests',cells.reduce((n,c)=>n+(c?c.chest:0),0),'jam',cells.reduce((n,c)=>n+(c?c.jam:0),0),'poison',seededPoison.length,'voids',cells.filter(c=>!c).length,'color',objective.color??'none','seed',snapshot.rngState);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,content.join('\n')+'\n');
