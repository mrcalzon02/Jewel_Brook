'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Farm=require('../web/town-garden.js'),Daily=require('../web/daily-moves.js'),Mine=require('../web/mining.js');
const Progress=require('../web/progression.js'),Power=require('../web/mode-powerups.js'),Art=require('../web/farming-art.js');
const Cook=require('../web/kitchen-cooking.js');
const at=Date.UTC(2026,9,25,12),cap=36;
const fresh=(house=1)=>{const save={unlocked:1,coins:3000,gems:5,hearts:3,stars:{}};Progress.migrate(save);Farm.ensure(save);Mine.ensure(save,at);Power.ensure(save);Daily.ensure(save,at,cap);save.town.houseLevel=house;Cook.ensure(save);return save;};
const add=(save,items)=>{for(const [k,v] of Object.entries(items))save.town.harvest[k]=v;};
test('kitchen migrates additively and never changes the save key or farming crop IDs',()=>{
 const s=fresh();s.town.kitchen.meals['future-recipe']=8;s.town.kitchen.meals['garden-salad']=2;Cook.ensure(s);Cook.ensure(s);
 assert.equal(s.town.kitchen.schemaVersion,1);assert.equal(s.town.kitchen.meals['future-recipe'],8);
 assert.equal(Cook.stock(s,'garden-salad'),2);assert.equal(Cook.stock(s,'future-recipe'),0);
 assert.equal(Cook.RECIPES.length,6);assert.deepEqual(Object.keys(Farm.CROPS),['carrot','wheat','berry']);
 assert(Cook.RECIPES.every(r=>r.art&&r.placeholderArt));
});
test('kitchen cannot craft locked recipe or phantom future pantry ingredients',()=>{
 const s=fresh();add(s,{carrot:12,wheat:12,berry:12});
 const previous=JSON.stringify(s.town.harvest),wallet=s.coins;
 assert.equal(Cook.cook(s,'bluebell-tart').reason,'house');
 assert.equal(Cook.cook(s,'future-royal-feast').reason,'recipe');
 assert.equal(Cook.cook(s,'garden-salad',0).reason,'quantity');
 assert.equal(Cook.cook(s,'garden-salad',21).reason,'quantity');
 assert.equal(JSON.stringify(s.town.harvest),previous);
 assert.equal(s.coins,wallet,'no magic currency changes');
});
test('atomic recipe crafting stores food; consuming a meal is a distinct action',()=>{
 const s=fresh();add(s,{carrot:8});
 assert.equal(Cook.cook(s,'garden-salad',2).valid,true);
 assert.equal(s.town.harvest.carrot,2);assert.equal(Cook.stock(s,'garden-salad'),2);
 assert.equal(Power.count(s,'farm-compost'),0,'crafting alone must not grant boost');
 assert.equal(Cook.serve(s,'garden-salad',at,cap).valid,true);
 assert.equal(Power.count(s,'farm-compost'),1);assert.equal(Cook.stock(s,'garden-salad'),1);
 assert.equal(Cook.serve(s,'garden-salad',at,cap).valid,true);assert.equal(Cook.serve(s,'garden-salad',at,cap).reason,'stock');
});
test('failed batch crafting never partially consumes harvest',()=>{
 const s=fresh(8);add(s,{berry:3,wheat:4,carrot:7});
 const a=JSON.stringify(s.town.harvest);
 assert.equal(Cook.cook(s,'bluebell-tart',2).reason,'ingredients');
 assert.equal(JSON.stringify(s.town.harvest),a);assert.equal(Cook.stock(s,'bluebell-tart'),0);
});
test('cooked broth grants life only on serve, and refuses full heart meter without using stock',()=>{
 const s=fresh(4);add(s,{carrot:5,wheat:3});
 assert.equal(Cook.cook(s,'hawseed-broth',2).valid,true);
 assert.equal(s.hearts,3);s.hearts=5;
 assert.equal(Cook.serve(s,'hawseed-broth',at,cap).reason,'full');assert.equal(Cook.stock(s,'hawseed-broth'),2);
 s.hearts=4;
 assert.equal(Cook.serve(s,'hawseed-broth',at,cap).valid,true);assert.equal(s.hearts,5);
 assert.equal(Cook.stock(s,'hawseed-broth'),1);
});
test('bluebell tart adds moves through existing daily wallet, not a new currency',()=>{
 const s=fresh(8);add(s,{berry:4,wheat:2});
 const before=Daily.left(s,at,cap),bonus=s.dailyMoves.bonus,reset=s.dailyMoves.resetAt;
 Cook.cook(s,'bluebell-tart',2);
 assert.equal(Daily.left(s,at,cap),before,'cooking alone does not grant moves');
 assert.equal(Cook.serve(s,'bluebell-tart',at,cap).valid,true);
 assert.equal(Daily.left(s,at,cap),before+3);assert.equal(s.dailyMoves.bonus,bonus+3);
 assert.equal(s.dailyMoves.resetAt,reset);
 assert.equal(Cook.stock(s,'bluebell-tart'),1);
});
test('mining dishes use existing bonus strikes and scans; ordinary daily budgets remain',()=>{
 const s=fresh(8);add(s,{carrot:9,wheat:4,berry:4});
 const strikeBase=s.rupeeExpedition.strikesLeft,scanBase=s.rupeeExpedition.scansLeft;
 Cook.cook(s,'prospector-rations');Cook.cook(s,'bluebell-infusion');
 assert.equal(Cook.serve(s,'prospector-rations',at,cap).valid,true);
 assert.equal(Cook.serve(s,'bluebell-infusion',at,cap).valid,true);
 assert.equal(s.rupeeExpedition.bonusStrikes,3);
 assert.equal(s.rupeeExpedition.bonusScans,2);
 assert.equal(s.rupeeExpedition.strikesLeft,strikeBase);
 assert.equal(s.rupeeExpedition.scansLeft,scanBase);
});
test('royal meal rewards only already-unlocked match-3 booster via canonical progression',()=>{
 const s=fresh(11);add(s,{carrot:3,wheat:3,berry:3});
 const prev=Progress.count(s,'hammer');
 assert.equal(Cook.cook(s,'royal-platter').valid,true);assert.equal(Progress.count(s,'hammer'),prev);
 assert.equal(Cook.serve(s,'royal-platter',at,cap).valid,true);
 assert.equal(Progress.count(s,'hammer'),prev+1);
});
test('capacity and malformed requests cannot spend meals or grant currency',()=>{
 const s=fresh(8);add(s,{carrot:8,wheat:8,berry:8});
 Cook.cook(s,'bluebell-tart');Cook.cook(s,'prospector-rations');
 s.dailyMoves.remaining=999999;s.dailyMoves.bonus=999999;
 assert.equal(Cook.serve(s,'bluebell-tart',at,cap).reason,'capacity');
 assert.equal(Cook.stock(s,'bluebell-tart'),1);
 s.rupeeExpedition.bonusStrikes=999999;
 assert.equal(Cook.serve(s,'prospector-rations',at,cap).reason,'capacity');
 assert.equal(Cook.stock(s,'prospector-rations'),1);
 assert.equal(Cook.serve(s,'bluebell-tart',-1,cap).reason,'time');
 assert.equal(Cook.serve(s,'bluebell-tart',at,0).reason,'cap');
});
test('catalog, cook book, and game integration have tested script ordering',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
 assert(html.indexOf('town-garden.js')<html.indexOf('farming-art.js'));
 assert(html.indexOf('mode-powerups.js')<html.indexOf('kitchen-cooking.js'));
 assert(html.indexOf('kitchen-cooking.js')<html.indexOf('game.js'));
 const g=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
 for(const x of ['Cook.list(saved','Cook.cook(saved','Cook.serve(saved','kitchen-cook','kitchen-serve','Cook.ensure(saved)'])assert(g.includes(x),x);
});
