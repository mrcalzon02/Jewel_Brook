'use strict';
// Build-time only: export *authoritative* Rupee Rush stage-1..10 state from
// web/engine.js. No JavaScript/Chromium is shipped in the native desktop game.
const fs=require('node:fs');
const path=require('node:path');
const E=require('../../web/engine.js');
const out=process.argv[2];
if(!out)throw Error('Export path required');
const content=['RRINTRO1 10'];
for(let stage=1;stage<=10;stage++){
  const g=E.create(stage,stage*7919);
  const snapshot=E.snapshot(g);
  const cfg=g.cfg;
  if(cfg.width!==4||cfg.height!==5||cfg.objectives.length!==1)
    throw Error('Intro stage '+stage+' changed dimensions/objective contract');
  const objective=cfg.objectives[0];
  const kind=objective.kind==='score'?0:objective.kind==='ice'?1:-1;
  if(kind<0)throw Error('Unsupported intro objective '+objective.kind+' at '+stage);
  const cells=snapshot.cells;
  if(cells.length!==20)throw Error('Malformed board at '+stage);
  for(const c of cells){
    if(!c||!Number.isInteger(c.type)||c.type<0||c.type>=5||
      !Number.isInteger(c.ice)||c.ice<0||c.ice>3||
      c.lock||c.chest||c.jam||c.fuse||c.special||c.hold||c.elemental||c.rock||
      c.ward||c.frozen||c.poison||c.aura)
      throw Error('Intro stage '+stage+' added an unsupported native feature');
  }
  content.push([stage,cfg.width,cfg.height,cfg.moves,cfg.goal,kind,objective.target,
    snapshot.rngState,cells.length].join(' '));
  content.push(cells.map(c=>c.type).join(' '));
  content.push(cells.map(c=>c.ice).join(' '));
  console.log('Android authored stage',stage,'moves',cfg.moves,'goal',cfg.goal,
    'objective',objective.kind,objective.target,
    'ice',cells.reduce((n,c)=>n+c.ice,0),'seed',snapshot.rngState);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,content.join('\n')+'\n');
