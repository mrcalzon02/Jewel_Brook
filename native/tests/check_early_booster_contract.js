'use strict';
// Source contract check only, does not bundle node or Javascript into desktop.
const Progress=require('../../web/progression.js');
const trio=[['hammer',1,3,'art/primary/powerups/hammer.png'],
            ['extra',5,3,'art/additions/economy/hourglass.png'],
            ['row',10,3,null]];
for(const [id,level,starter,art] of trio){
  const spec=Progress.LADDER.find(e=>e.id===id);
  if(!spec || spec.level!==level || spec.starter!==starter ||
    Progress.BOOSTER_ART[id]!==art)
    throw Error('Early booster contract changed for '+id);
}
console.log('Verified original Android starter inventory and booster artwork assignments');
