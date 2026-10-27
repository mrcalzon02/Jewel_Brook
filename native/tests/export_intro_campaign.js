'use strict';
// Build-time only: export *authoritative* Rupee Rush stage-1..38 state from
// web/engine.js. No JavaScript/Chromium is shipped in the native desktop game.
const fs=require('node:fs');
const path=require('node:path');
const E=require('../../web/engine.js');
const out=process.argv[2];
if(!out)throw Error('Export path required');
const content=['RRCAMPAIGN9 38'];
for(let stage=1;stage<=38;stage++){
  const g=E.create(stage,stage*7919);
  const snapshot=E.snapshot(g);
  const cfg=g.cfg;
  if(cfg.width!==(stage<=10?4:stage<=30?5:6)||cfg.height!==cfg.width+1||cfg.objectives.length!==1)
    throw Error('Intro stage '+stage+' changed dimensions/objective contract');
  const objective=cfg.objectives[0];
  const kind=objective.kind==='score'?0:objective.kind==='ice'?1:objective.kind==='collect'?2:objective.kind==='locks'?3:-1;
  if(kind<0)throw Error('Unsupported intro objective '+objective.kind+' at '+stage);
  const cells=snapshot.cells;
  if(cells.length!==cfg.width*cfg.height)throw Error('Malformed board at '+stage);
  for(const c of cells){
    if(!c)continue; // preserve Android's intentionally void silhouette cells
    if(!Number.isInteger(c.type)||c.type<0||!cfg.roster.includes(c.type)||
      !Number.isInteger(c.ice)||c.ice<0||c.ice>3||
      (!Number.isInteger(c.lock)||c.lock<0||c.lock>3)||c.chest||c.jam||c.fuse||c.special||c.hold||c.rock||
      c.ward||c.frozen||c.poison||c.aura||
      (c.elemental!==null && !(stage===15 && c.elemental==='water') && !(stage===21 && c.elemental==='fire') && !(stage===28 && c.elemental==='ice') && !(stage===35 && c.elemental==='water')))
      throw Error('Stage '+stage+' added a feature not yet ported to desktop');
  }
  const expectedRoster=stage<15?[0,1,2]:stage<35?[0,1,2,11]:[0,1,2,11,18];
  if(cfg.roster.join(',')!==expectedRoster.join(','))
    throw Error('Authoritative gem roster changed at stage '+stage);
  const powered=cells.filter(c=>c?.elemental).length;
  if(powered!==(stage===15||stage===21||stage===28||stage===35?1:0))
    throw Error('Stage '+stage+' has unexpected number of elemental pieces: '+powered);
  content.push([stage,cfg.width,cfg.height,cfg.moves,cfg.goal,kind,objective.target,
    snapshot.rngState,cells.length,kind===2?objective.color:-1].join(' '));
  content.push(cells.map(c=>c?c.type:-2).join(' '));
  content.push(cells.map(c=>c?c.ice:0).join(' '));
  content.push(cells.map(c=>c?c.lock:0).join(' '));
  content.push(cfg.roster.length+' '+cfg.roster.join(' '));
  // 0=ordinary, 1=Water, 2=Fire, 3=Ice; reject unported powers.
  content.push(cells.map(c=>c?.elemental==='water'?1:c?.elemental==='fire'?2:c?.elemental==='ice'?3:0).join(' '));
  console.log('Android authored stage',stage,'moves',cfg.moves,'goal',cfg.goal,
    'objective',objective.kind,objective.target,
    'ice',cells.reduce((n,c)=>n+(c?c.ice:0),0),'locks',cells.reduce((n,c)=>n+(c?c.lock:0),0),'voids',cells.filter(c=>!c).length,'color',objective.color??'none','seed',snapshot.rngState);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,content.join('\n')+'\n');
