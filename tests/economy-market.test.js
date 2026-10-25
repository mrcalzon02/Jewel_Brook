/* Economy/shop regression suite: node tests/economy-market.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const G=require('../web/mining-gear.js');
const M=require('../web/mining.js');
const P=require('../web/progression.js');
const E=require('../web/economy.js');
const MA=require('../web/mining-economy-art.js');
const root=path.resolve(__dirname,'../web');
function make(){const s={coins:9000,gems:300,styleShards:2000,unlocked:1,stars:{},hearts:5};P.migrate(s);M.ensure(s);E.ensure(s);return s;}
assert.equal(E.CATALOG.length,178,'32 characters + 40 outfits + 86 mining skins + 20 frames');
assert.equal(E.CATALOG.filter(x=>x.type==='character').length,32);
assert.equal(E.CATALOG.filter(x=>x.type==='outfit').length,40);
assert.equal(E.CATALOG.filter(x=>x.type==='frame').length,20);
assert.equal(E.CATALOG.filter(x=>x.type==='pickSkin').length,44);
assert.equal(E.CATALOG.filter(x=>x.type==='gloveSkin').length,42);
assert.equal(Object.keys(E.PACKS).length,8);
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
assert.equal(MA.credits(0),'art/nutvale/mining-economy/currency/copper-coins.png');
const canonical={
 'currency/copper-coins.png':'7fabb0f01b737c59e8fa569bb49846edc382ab07',
 'currency/rainbow-coin.png':'8ddda5aa83b215c49890e8e0af334797285e7af1',
 'goods/crate-mining-supplies.png':'7dc16e57b8cb859d100c4a0a74a46d1350e55bd7',
 'writs/royal-blue-writ.png':'ea7037a4a40c0a8688b03f33533402eb4d4a9720'
};
for(const [name,sha] of Object.entries(canonical)){
 const file=path.join(root,'art/nutvale/mining-economy',name),data=fs.readFileSync(file);
 assert.equal(crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex'),sha,'source-art hash '+name);
}
const game=fs.readFileSync(path.join(root,'game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.indexOf('economy.js')<html.indexOf('game.js'),'economy loaded before UI');
assert.ok(html.includes('id="style-shards"'),'Style Shards displayed');
assert.ok(game.includes('Economy.claimDaily'),'daily reward wired');
assert.ok(game.includes('Economy.buyPack'),'loot purchases wired');
assert.ok(game.includes('Economy.equip'),'cosmetic equip wired');
assert.ok(game.includes('MineArt.goods'),'original resource art integrated');
assert.ok(!game.includes('class="mine-rock-art" src="art/primary/blockers/rock.png"'),'flat blocker removed');
console.log('Economy market OK: 178 collectibles, 8 chests, 4 weighted tables, free upgrades, 27 restored neutral sprites.');
