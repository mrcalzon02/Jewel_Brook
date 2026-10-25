'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Farm=require('../web/town-garden.js'),Art=require('../web/farming-art.js');
const root={RupeeTownGarden:Farm,RupeeFarmingArt:Art};
const code=fs.readFileSync(path.resolve(__dirname,'../web/kitchen-catalog.js'),'utf8');
vm.runInNewContext(code,{window:root});
const K=root.RupeeKitchenCatalog;
assert.equal(K.ACTIVE.length,48);
assert.equal(K.pantry({town:{harvest:{carrot:5,wheat:2,berry:9}}})[2].quantity,9);
assert.equal(K.pantry({town:{harvest:{carrot:-9,wheat:Infinity}}})[0].quantity,0);
assert.equal(K.pantry({})[0].quantity,0,'read-only missing-save behavior');
assert.equal(K.get('berry').art,Art.goods('blueberry'),'existing Bluebell Berry uses blue berry art');
assert.equal(K.get('wheat').art,Art.goods('wheat'));
assert(K.FUTURE_ITEMS.length>=11);
assert.equal(K.RECIPES.length,4);
for(const recipe of K.RECIPES){
 assert.equal(recipe.status,'preview-only');assert.equal(recipe.craftable,false);
 assert(K.image(recipe.output),'Recipe preview output must have local art');
 for(const x of recipe.ingredients){assert(K.get(x.item),'Recipe references unknown ingredient '+x.item);assert(x.quantity>0);}
}
const save={coins:200,town:{harvest:{carrot:12,berry:7,wheat:3}}},before=JSON.stringify(save);
K.pantry(save);K.count(save,'carrot');
assert.equal(JSON.stringify(save),before,'pantry browsing is non-mutating');
assert.equal(K.count(save,'not-real'),0);
const html=fs.readFileSync(path.resolve(__dirname,'../web/index.html'),'utf8');
assert(html.indexOf('farming-art.js')<html.indexOf('kitchen-catalog.js'));
assert(html.indexOf('kitchen-catalog.js')<html.indexOf('game.js'));
const game=fs.readFileSync(path.resolve(__dirname,'../web/game.js'),'utf8');
for(const req of ['Kitchen.pantry(saved)','Kitchen.RECIPES','FarmArt.harvest(c.id)','FarmArt.powerup(p.id)','farmEquipmentPreview()','Cooking not yet available'])assert(game.includes(req),req+' not wired');
assert(!game.includes('Kitchen.craft('),'Cooking remains preview-only');
console.log('PASS farm-to-kitchen: canonical existing crops, reserved art, recipe previews, no economy changes');
