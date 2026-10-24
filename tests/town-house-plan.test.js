'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const T=require('../web/town-garden.js');
const plan=require('../web/art/embryon/town/houses/plan.json');
test('all 40 planned house levels remain distinct and map to a staged asset contract',()=>{
 assert.equal(plan.entries.length,40);
 assert.equal(new Set(plan.entries.map(x=>x.name)).size,40);
 for(let i=0;i<40;i++){
  const x=plan.entries[i];assert.equal(x.level,i+1);assert.equal(x.plots,T.plotCount(x.level));
  assert.equal(x.houseArt,'pending_review');assert.equal(x.runtimeFile,null);
 }
});
test('Town hovel does not falsely escalate to royal manor by level 10',()=>{
 assert.match(plan.entries[0].name,/Hovel/);assert.match(plan.entries[9].name,/Homestead/);
 assert.match(plan.entries[39].name,/Royal Manor/);assert.equal(plan.plotUnlockLevels.at(-1),36);
});
