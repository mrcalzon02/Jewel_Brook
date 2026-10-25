'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../web/mining-gear.js');
const Farm=require('../web/town-garden.js');
const Daily=require('../web/daily-moves.js'),Mine=require('../web/mining.js'),Progress=require('../web/progression.js');
const Power=require('../web/mode-powerups.js'),Art=require('../web/farming-art.js');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={RupeeTownGarden:Farm,RupeeDailyMoves:Daily,RupeeMining:Mine,RupeeProgress:Progress,RupeeModePowerups:Power,RupeeFarmingArt:Art};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/kitchen-cooking.js'),'utf8'),{window});
const Cook=window.RupeeKitchen;
test('all 43 real kitchen recipes use actual harvested crop IDs, valid art, and unlockable house tiers',()=>{
 assert.equal(Cook.RECIPES.length,43);
 const seen=new Set();
 for(const r of Cook.RECIPES){
  assert(!seen.has(r.id),r.id);seen.add(r.id);
  assert(r.art&&r.placeholderArt&&r.ingredients.length>0,r.id);
  assert(r.house>=1&&r.house<=40);
  for(const x of r.ingredients){const item=Farm.CROPS[x.item];assert(item,r.id+'/'+x.item);assert(item.house<=r.house,r.id+'/'+x.item);}
 }
 const high=Cook.BY_ID['astral-banquet'];assert.equal(high.house,40);
 assert(Cook.BY_ID['sunspire-feast'].house===39);
});
test('new crops become functional kitchen ingredients, consumed only by successful cooking',()=>{
 const s={coins:1_000_000,hearts:3,unlocked:1,stars:{}};
 Progress.migrate(s);Farm.ensure(s);Mine.ensure(s,1700000000000);Power.ensure(s);Daily.ensure(s,1700000000000,36);
 s.town.houseLevel=40;
 for(const recipe of Cook.RECIPES){
  for(const x of recipe.ingredients)s.town.harvest[x.item]=100;
  const before=JSON.stringify(s.town.harvest);
  const r=Cook.cook(s,recipe.id);
  assert.equal(r.valid,true,recipe.id);
  assert.notEqual(JSON.stringify(s.town.harvest),before,'Harvest must be spent when cooking '+recipe.id);
  assert.equal(Cook.stock(s,recipe.id),1);
 }
 assert.equal(Cook.checkCook(s,'this-does-not-exist').reason,'recipe');
});
