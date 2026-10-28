/* Economy/shop regression suite: node tests/economy-market.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const G=require('../web/mining-gear.js');
const M=require('../web/mining.js');
const P=require('../web/progression.js');
const E=require('../web/economy.js');
const root=path.resolve(__dirname,'../web');
function make(){const s={coins:9000,gems:300,styleShards:2000,unlocked:1,stars:{},hearts:5};P.migrate(s);M.ensure(s);E.ensure(s);return s;}
assert.ok(Object.keys(E.PACKS).length>0,'At least one shop package can be purchased');
for(const [key,pool] of Object.entries(E.POOLS)){
 assert.equal(pool.reduce((x,r)=>x+r.weight,0),100,key+' odds sum 100%');
 assert.equal(E.odds(key).reduce((x,r)=>x+r.percent,0),100,key+' displayed odds');
}
const s=make(),coins=s.coins;
const b=E.buyPack(s,'satchel',()=>0);
assert.equal(b.valid,true);assert.equal(b.results.length,2);assert.equal(s.coins,coins-350+500,'debit before granting rewards');
assert.equal(E.buyPack(s,'missing').valid,false);
s.gems=0;assert.equal(E.buyPack(s,'vault').valid,false,'cannot open unaffordable loot chest');
const c=E.CATALOG.find(x=>x.type==='frame'),oldCoins=s.coins,oldShards=s.styleShards;
assert.equal(E.buyCosmetic(s,c.id).valid,true);assert.equal(s.coins,oldCoins);
assert.equal(s.styleShards,oldShards-c.cost,'Style Shards only spend on cosmetics');
assert.equal(E.equip(s,c.id).valid,true);assert.equal(s.cosmeticEquipped.frame,c.id);
assert.equal(E.buyCosmetic(s,c.id).valid,false,'no duplicate purchase');
assert.equal(E.equip(s,'not-an-item').valid,false,'equip requires owned valid item');
const dup=E.grantRoll(s,{kind:'character'},()=>0,P);
assert.equal(dup.kind,'duplicate','duplicate starter character refunds shards');
const at=Date.UTC(2026,9,25,12);
assert.equal(E.claimDaily(s,at,()=>0).valid,true);
assert.equal(E.claimDaily(s,at,()=>0).valid,false,'daily once per calendar day');
assert.equal(E.claimDaily(s,at+86400000,()=>0).valid,true,'next day available');
const beforeTier=M.stats(s).pickTier,beforeCredits=s.rupeeMine.dollars;
const reward=E.freeUpgrade(s,()=>0);
assert.equal(reward.kind,'upgrade');assert.equal(M.stats(s).pickTier,beforeTier+1);
assert.equal(s.rupeeMine.dollars,beforeCredits,'free upgrade never charges mine wallet');
const s2=make();s2.styleShards=0;assert.equal(E.buyCosmetic(s2,c.id).valid,false);
for(const id of ['coins','gems','styleShards'])assert.ok(E.CURRENCY[id]);
const game=fs.readFileSync(path.join(root,'game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.indexOf('economy.js')<html.indexOf('game.js'),'economy loaded before UI');
assert.ok(html.includes('id="style-shards"'),'Style Shards displayed');
assert.ok(game.includes('Economy.claimDaily'),'daily reward wired');
assert.ok(game.includes('Economy.buyPack'),'loot purchases wired');
assert.ok(game.includes('Economy.equip'),'cosmetic equip wired');

// Character and wardrobe state are distinct collectibles, but the equipped
// full-body outfit is Daysha's sole live avatar, never a generated card SVG.
const TownCharacter=require('../web/town-character.js');
const avatar0=TownCharacter.fromSave(s);
assert.equal(avatar0.character,'Daysha');
assert.equal(avatar0.outfitId,'outfit-01');
assert.equal(avatar0.image,'art/embryon/town/avatars/daysha_lv_01.png');
s.cosmeticsOwned['outfit-02']=true;
assert.equal(E.equip(s,'outfit-02').valid,true);
const avatar1=TownCharacter.fromSave(s);
assert.equal(avatar1.image,'art/embryon/town/avatars/daysha_lv_02.png');
s.cosmeticsOwned['character-05']=true;
assert.equal(E.equip(s,'character-05').valid,true);
assert.equal(TownCharacter.fromSave(s).image,avatar1.image,
 'Character-card selection must not replace the illustrated Daysha outfit');
assert.equal(s.cosmeticEquipped.outfit,'outfit-02','Save keeps equipped wardrobe choice');
console.log('PASS economy: store purchases, package rewards, cosmetic transactions, daily claims and upgrades');
