'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const T=require('../web/town-garden.js');
const fresh=()=>({unlocked:999,coins:5000,rupeeExpedition:{gloveTier:0}});
const HOUR=60*60*1000;
test('Town builds separately from avatar/campaign/mining',()=>{
 const s=fresh();T.ensure(s);assert.equal(T.name,'Town');assert.equal(s.town.houseLevel,1);assert.equal(T.plotCount(1),1);assert.equal(T.plotCount(6),2);assert.equal(T.plotCount(40),8);assert.equal(s.unlocked,999);assert.equal(s.rupeeExpedition.gloveTier,0);assert.equal(T.summary(s).houseBand,'Hawseed Homestead');
});
test('house upgrades spend Rupees exactly once and never consume mining dollars',()=>{
 const s=fresh();s.rupeeMine={dollars:350};const cost=T.upgradeCost(1);const r=T.upgradeHouse(s);assert.equal(r.valid,true);assert.equal(r.houseLevel,2);assert.equal(s.coins,5000-cost);assert.equal(s.rupeeMine.dollars,350);
 const poor={coins:0};assert.equal(T.upgradeHouse(poor).reason,'coins');assert.equal(poor.town.houseLevel,1);
});
test('seed and fertilizer store enforce tier, quantity and funds atomically',()=>{
 const s=fresh();assert.equal(T.purchase(s,'seed','wheat').reason,'house');assert.equal(T.purchase(s,'fertilizer','royal').reason,'house');assert.equal(T.purchase(s,'seed','carrot',0).reason,'quantity');assert.equal(T.purchase(s,'seed','carrot',1.2).reason,'quantity');
 const before=s.coins;assert.equal(T.purchase(s,'seed','carrot',2).valid,true);assert.equal(s.town.seeds.carrot,2);assert.equal(s.coins,before-24);
 const low={coins:0};assert.equal(T.purchase(low,'seed','carrot').reason,'coins');assert.equal(low.town.seeds.carrot,0);
});
test('planting uses real elapsed time; failed premature harvest does not consume crop',()=>{
 const s=fresh(),start=1_700_000_000_000;
 T.purchase(s,'seed','carrot');const p=T.plant(s,0,'carrot',null,start);assert.equal(p.valid,true);assert.equal(s.town.seeds.carrot,0);
 assert.equal(T.plant(s,0,'carrot',null,start).reason,'occupied');
 assert.equal(T.plotStatus(s,0,start).state,'seed');assert.equal(T.plotStatus(s,0,p.readyAt).state,'ready');
 assert.equal(T.harvest(s,0,p.readyAt-1).reason,'growing');assert.ok(s.town.plots[0]);
 const h=T.harvest(s,0,p.readyAt);assert.equal(h.quantity,2);assert.equal(s.town.plots[0],null);assert.equal(s.town.harvest.carrot,2);
 assert.equal(T.harvest(s,0,p.readyAt).reason,'empty');
});
test('glove tiers are read from the existing mine and fixed at planting, not invented',()=>{
 const s=fresh();s.rupeeExpedition.gloveTier=29;T.purchase(s,'seed','carrot');T.purchase(s,'fertilizer','compost');
 const p=T.plant(s,0,'carrot','compost',1234567);assert.equal(p.yield,5);assert.ok(p.readyAt-1234567<5*60*1000);
 s.rupeeExpedition.gloveTier=39;assert.equal(T.harvest(s,0,p.readyAt).quantity,5);
});
test('harvest can be sold once; coins and inventory conserved',()=>{
 const s=fresh();T.purchase(s,'seed','carrot');const start=1000,p=T.plant(s,0,'carrot',null,start);T.harvest(s,0,p.readyAt);const balance=s.coins;
 assert.equal(T.sell(s,'carrot',2).earned,24);assert.equal(s.coins,balance+24);assert.equal(s.town.harvest.carrot,0);assert.equal(T.sell(s,'carrot').reason,'inventory');
});
test('locked plots never accept seeds; bad inputs never mint money',()=>{
 const s=fresh();T.purchase(s,'seed','carrot');const before=s.coins;
 assert.equal(T.plant(s,7,'carrot',null,1000).reason,'plot');assert.equal(s.town.seeds.carrot,1);assert.equal(s.coins,before);
 assert.equal(T.plant(s,0,'carrot','unknown',1000).reason,'fertilizer');assert.equal(T.plant(s,0,'carrot',null,-10).reason,'time');
 assert.equal(T.sell(s,'carrot',-1).reason,'quantity');assert.equal(T.purchase(s,'seed','carrot',Infinity).reason,'quantity');assert.equal(s.coins,before);
});
test('pre-existing saves migrate additively and preserve active plots',()=>{
 const s={coins:100,stars:{1:3},rupeeExpedition:{gloveTier:10},town:{houseLevel:6,seeds:{carrot:4},plots:[{crop:'carrot',plantedAt:10,readyAt:50,yield:3,fertilizer:null}]}};
 T.ensure(s);assert.equal(T.ensure(s).plots[0].readyAt,50);assert.equal(s.stars[1],3);assert.equal(T.summary(s,20).plots,2);
});

test('preexisting values outside current 40-level catalog clamp safely without wiping unknown inventory',()=>{
 const s={coins:100,town:{houseLevel:50,seeds:{futureCrop:9},plots:[]}};
 T.ensure(s);assert.equal(s.town.houseLevel,40);assert.equal(T.plotCount(50),8);assert.equal(s.town.seeds.futureCrop,9);
 assert.equal(T.upgradeHouse(s).reason,'max');
});

test('48-crop deep catalog has functional progression, bulk seed purchases and complete harvest liquidation',()=>{
 assert.equal(Object.keys(T.CROPS).length,48);
 assert.equal(new Set(Object.values(T.CROPS).map(c=>c.house)).size,40,'crops unlock at every house tier');
 assert.equal(T.CATEGORIES.length,8);
 const s={coins:1_000_000,stars:{}};T.ensure(s);s.town.houseLevel=40;
 for(const c of Object.values(T.CROPS)){
  const b=s.coins;
  const a=T.purchase(s,'seed',c.id,5);assert(a.valid,c.id);
  assert.equal(s.town.seeds[c.id],5);assert.equal(s.coins,b-5*c.seedCost);
  const planted=T.plant(s,0,c.id,null,1_700_000_000_000);assert(planted.valid,c.id);
  assert.equal(T.plotStatus(s,0,planted.readyAt).state,'ready');
  const taken=T.harvest(s,0,planted.readyAt);assert(taken.valid,c.id);
  assert.equal(s.town.harvest[c.id],c.yield);
  assert.equal(T.sell(s,c.id,c.yield).earned,c.yield*c.sellEach);
  assert.equal(s.town.harvest[c.id],0);
 }
 s.town.harvest.carrot=1200;
 assert.equal(T.sell(s,'carrot',1200).earned,14400,'Sell All must support inventories above the store purchase batch cap');
 assert.equal(s.town.harvest.carrot,0);
 for(const invalid of ['constructor','__proto__','toString']){
  assert.equal(T.purchase(s,'seed',invalid).valid,false);
  assert.equal(T.plant(s,0,invalid,null,100).valid,false);
  assert.equal(T.sell(s,invalid).valid,false);
 }
});

test('Elaranth seasonal forecast covers all 48 authored crops with 1–6 mission days',()=>{
 const S=T.Seasons;assert.equal(Object.keys(S.PROFILES).length,48);
 assert.deepEqual(Object.keys(S.PROFILES).sort(),Object.keys(T.CROPS).sort());
 for(const id of Object.keys(T.CROPS))for(const day of [0,13,90,180,280,364,600,1000]){
  const f=S.forecast(id,day);assert(f&&f.baseDays>=1&&f.baseDays<=6,id+' / '+day);
  assert.equal(S.forecast(id,day).baseDays,f.baseDays,'Deterministic seasonal forecast');
 }
 assert.equal(S.baseDays('mint',321),1,'Frostmint peaks in the Elaranthi winter');
 assert.equal(S.baseDays('mint',503),6,'Winter mint at summer opposite takes six missions');
 assert.equal(S.baseDays('tomato',195),1,'Tomatoes reach peak during summer');
 assert.ok(S.baseDays('tomato',0)>S.baseDays('tomato',195),'Summer fruit grows slowly in winter');
});
test('Peak season matures with one newly cleared main mission, without wall-clock growth',()=>{
 const s={coins:10000,stars:{320:1},unlocked:321};T.ensure(s);
 assert.equal(T.purchase(s,'seed','mint').valid,true);
 const planted=T.plantCampaign(s,0,'mint');assert(planted.valid);
 assert.equal(planted.mode,'campaign-day');assert.equal(planted.plantedDay,320);
 assert.equal(T.plotStatus(s,0,Number.MAX_SAFE_INTEGER).state,'seed','Wall clock must not grow a campaign plot');
 assert.equal(T.advanceCampaign(s,321).reason,'uncleared','Day must be an actually cleared level');
 s.stars[321]=1;s.unlocked=322;
 assert.equal(T.advanceCampaign(s,321).advanced,1);
 assert.equal(T.plotStatus(s,0,0).state,'ready');
 assert.equal(T.advanceCampaign(s,321).advanced,0,'Cannot exploit same-day replay');
 const got=T.harvest(s,0);assert.equal(got.valid,true);
 assert.equal(s.town.harvest.mint,T.CROPS.mint.yield);
});
test('Off-season winter crop takes six missions; replay, optional trials and reloading cannot advance growth',()=>{
 const s={coins:10000,stars:{502:1},unlocked:503};T.ensure(s);
 T.purchase(s,'seed','mint');assert(T.plantCampaign(s,0,'mint').valid);
 const planted=s.town.plots[0];assert.equal(T.Seasons.baseDays('mint',503),6);
 for(let day=503;day<=507;day++){
  s.stars[day]=1;s.unlocked=day+1;
  assert.equal(T.advanceCampaign(s,day).valid,true);
  assert.notEqual(T.plotStatus(s,0).state,'ready','Still growing after '+(day-502)+' missions');
  assert.equal(T.advanceCampaign(s,day).advanced,0);
 }
 const restored=JSON.parse(JSON.stringify(s));T.ensure(restored);
 assert.deepEqual(restored.town.plots[0],s.town.plots[0],'Serialized campaign work survives reload');
 restored.stars[508]=1;restored.unlocked=509;
 assert.equal(T.advanceCampaign(restored,508).ready,1);
 assert.equal(T.harvest(restored,0).valid,true);
});
test('Fertilizer accelerates off-season mission growth while retaining yield and stock accounting',()=>{
 const s={coins:10000,stars:{502:1},unlocked:503,town:{houseLevel:30}};T.ensure(s);
 T.purchase(s,'seed','mint');T.purchase(s,'fertilizer','royal');
 const planted=T.plantCampaign(s,0,'mint','royal');assert.equal(planted.valid,true);
 assert.equal(planted.yield,T.CROPS.mint.yield+T.FERTILIZERS.royal.yieldBonus);
 const before=T.Seasons.forecast('mint',503,null,30).estimatedDays;
 const after=T.Seasons.forecast('mint',503,T.FERTILIZERS.royal,30).estimatedDays;
 assert(after<before,'Royal fertilizer reduces mission days at off season');
 for(let day=503;day<503+after;day++){s.stars[day]=1;T.advanceCampaign(s,day);}
 assert.equal(T.plotStatus(s,0).state,'ready');
 assert.equal(T.harvest(s,0).quantity,planted.yield);
});
test('Legacy real-time crop timers survive additive campaign save migration',()=>{
 const old={coins:1000,stars:{4:1},town:{houseLevel:2,plots:[{crop:'carrot',plantedAt:100,readyAt:400,yield:3,fertilizer:null}]}};
 T.ensure(old);assert.equal(old.town.schemaVersion,2);assert.equal(old.town.plots[0].readyAt,400);
 assert.equal(T.plotStatus(old,0,399).state!=='ready',true);
 old.stars[5]=1;T.advanceCampaign(old,5);
 assert.equal(old.town.plots[0].readyAt,400,'Campaign-day advancement does not overwrite legacy crop clock');
 assert.equal(T.harvest(old,0,400).quantity,3);
});
