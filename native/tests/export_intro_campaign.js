'use strict';
// Build-time only: export *authoritative* Rupee Rush stage-1..14 state from
// web/engine.js. No JavaScript/Chromium is shipped in the native desktop game.
const fs=require('node:fs');
const path=require('node:path');
const E=require('../../web/engine.js');
const out=process.argv[2];
if(!out)throw Error('Export path required');
const content=['RRCAMPAIGN2 14'];
for(let stage=1;stage<=14;stage++){
  const g=E.create(stage,stage*7919);
  const snapshot=E.snapshot(g);
  const cfg=g.cfg;
  if(cfg.width!==(stage<=10?4:5)||cfg.height!==cfg.width+1||cfg.objectives.length!==1)
    throw Error('Intro stage '+stage+' changed dimensions/objective contract');
  const objective=cfg.objectives[0];
  const kind=objective.kind==='score'?0:objective.kind==='ice'?1:-1;
  if(kind<0)throw Error('Unsupported intro objective '+objective.kind+' at '+stage);
  const cells=snapshot.cells;
  if(cells.length!==cfg.width*cfg.height)throw Error('Malformed board at '+stage);
  for(const c of cells){
    if(!c)continue; // preserve Android's intentionally void silhouette cells
    if(!Number.isInteger(c.type)||c.type<0||c.type>=3||
      !Number.isInteger(c.ice)||c.ice<0||c.ice>3||
      c.lock||c.chest||c.jam||c.fuse||c.special||c.hold||c.elemental||c.rock||
      c.ward||c.frozen||c.poison||c.aura)
      throw Error('Stage '+stage+' added a feature not yet ported to desktop');
  }
  content.push([stage,cfg.width,cfg.height,cfg.moves,cfg.goal,kind,objective.target,
    snapshot.rngState,cells.length].join(' '));
  content.push(cells.map(c=>c?c.type:-2).join(' '));
  content.push(cells.map(c=>c?c.ice:0).join(' '));
  console.log('Android authored stage',stage,'moves',cfg.moves,'goal',cfg.goal,
    'objective',objective.kind,objective.target,
    'ice',cells.reduce((n,c)=>n+(c?c.ice:0),0),'voids',cells.filter(c=>!c).length,'seed',snapshot.rngState);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,content.join('\n')+'\n');
