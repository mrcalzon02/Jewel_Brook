/* Cross-mode consumable power-ups. Transactions are save-local and validated before spending stock.
 * Match-3 uses the existing RupeeProgress booster inventory; farm and mine use independent inventories.
 */
(function(root){'use strict';
const Farm=root.RupeeTownGarden, Mine=root.RupeeMining, Progress=root.RupeeProgress;
if(!Farm||!Mine||!Progress)throw Error('Town, mining and match-3 progression must load before mode powerups');
const MAX=999999, LIMIT=1000000000;
const items=[
 ['farm','farm-sunrise','Sunrise Elixir','Matures one planted plot immediately, regardless of season',220,'art/embryon/town/gardening/icons/fertilizer-crystal-tonic.png',true],
 ['farm','farm-rainfall','Raincaller Bell','Halves the remaining growth needed on all planted plots',300,'art/embryon/town/gardening/icons/fertilizer-enriched.png',false],
 ['farm','farm-bounty','Bounty Charm','Adds 2 crops to a ready plot before harvesting',260,'art/embryon/town/gardening/icons/seed-store-bundle.png',true],
 ['farm','farm-seeds','Seed Satchel','Grants 3 seeds of a selected unlocked crop',170,'art/embryon/town/gardening/icons/seeds-carrot.png',false],
 ['farm','farm-compost','Compost Cache','Grants 2 units of selected unlocked fertilizer',210,'art/embryon/town/gardening/icons/fertilizer-compost.png',false],
 ['farm','farm-market','Festival Cart','Sells all stored harvests for 20% extra Rupees',360,'art/embryon/town/gardening/icons/seed-store-bundle.png',false],
 ['mine','mine-strikes','Stamina Tonic','Adds 5 bonus excavation strikes, retained until used',250,'art/nutvale/mining-tools/pickaxes/brass-anthem.png',false],
 ['mine','mine-surveys','Survey Flask','Adds 3 bonus ore-presence surveys',210,'art/nutvale/mining-tools/gloves/harvest-petal.png',false],
 ['mine','mine-dynamite','Stonebreaker Charge','Delivers two free strikes to the selected rock',380,'art/nutvale/mining-tools/pickaxes/flamecrest-gold.png',true],
 ['mine','mine-oracle','Prospector Lens','Surveys one rock without spending a scan',190,'art/nutvale/mining-tools/gloves/sapphire-royal.png',true],
 ['mine','mine-ore','Ore Cache','Deposits 5 raw ore directly in storage',320,'art/nutvale/mining-economy/currency/rainbow-coin.png',false],
 ['mine','mine-credit','Trade Voucher','Grants 200 Mining Credits',290,'art/nutvale/mining-economy/currency/gold-coins.png',false]
].map(([family,id,name,description,price,art,targeted])=>Object.freeze({family,id,name,description,price,art,targeted}));
const CATALOG=Object.freeze(Object.fromEntries(items.map(i=>[i.id,i])));
const MATCH_IDS=Object.freeze(Progress.LADDER.map(i=>i.id));
const BUNDLES=Object.freeze({
 seedling:Object.freeze({family:'farm',name:'Seedling Starter Kit',currency:'coins',cost:650,contents:{'farm-seeds':2,'farm-compost':1,'farm-sunrise':1}}),
 harvest:Object.freeze({family:'farm',name:'Harvest Festival Kit',currency:'gems',cost:16,contents:{'farm-rainfall':2,'farm-bounty':2,'farm-market':1}}),
 prospect:Object.freeze({family:'mine',name:'Prospector Supply Case',currency:'coins',cost:720,contents:{'mine-strikes':2,'mine-surveys':2,'mine-oracle':1}}),
 demolition:Object.freeze({family:'mine',name:'Deep Mines Cache',currency:'gems',cost:18,contents:{'mine-dynamite':2,'mine-ore':2,'mine-credit':1}}),
 expedition:Object.freeze({family:'match',name:'Match-3 Expedition Kit',currency:'coins',cost:800,matchCount:4}),
 cascade:Object.freeze({family:'match',name:'Cascade Treasure Kit',currency:'gems',cost:18,matchCount:8})
});
const money=v=>Number.isSafeInteger(v)&&v>=0?Math.min(LIMIT,v):0;
const count= (save,id)=>money(save?.modePowerups?.[id]);
function ensure(save){
 if(!save.modePowerups||typeof save.modePowerups!=='object'||Array.isArray(save.modePowerups))save.modePowerups={};
 for(const {id} of items)save.modePowerups[id]=Math.min(MAX,count(save,id));
 return save.modePowerups;
}
function availableMatch(save){return Progress.available(save).filter(id=>MATCH_IDS.includes(id));}
function acquire(save,id,qty=1){
 const item=CATALOG[id];if(!item||!Number.isSafeInteger(qty)||qty<1||qty>MAX)return {valid:false,reason:'item'};
 const inv=ensure(save);if(inv[id]>MAX-qty)return {valid:false,reason:'capacity'};
 inv[id]+=qty;return {valid:true,id,quantity:qty};
}
function purchase(save,id,qty=1){
 const item=CATALOG[id];if(!item||!Number.isSafeInteger(qty)||qty<1||qty>100)return {valid:false,reason:'item'};
 ensure(save);const cost=item.price*qty;
 if(count(save,id)>MAX-qty)return {valid:false,reason:'capacity'};
 if(money(save.coins)<cost)return {valid:false,reason:'funds',need:cost-money(save.coins)};
 save.coins-=cost;save.modePowerups[id]+=qty;
 return {valid:true,id,quantity:qty,cost};
}
function buyBundle(save,key){
 const pack=BUNDLES[key];if(!pack)return {valid:false,reason:'item'};
 ensure(save);
 const current=money(save[pack.currency]);if(current<pack.cost)return {valid:false,reason:'funds'};
 const contents=pack.contents||{};
 for(const [id,qty] of Object.entries(contents))if(count(save,id)>MAX-qty)return {valid:false,reason:'capacity'};
 const eligible=pack.family==='match'?availableMatch(save):[];
 if(pack.family==='match'&&!eligible.length)return {valid:false,reason:'locked'};
 if(pack.family==='match')for(let i=0;i<pack.matchCount;i++){
  const id=eligible[i%eligible.length];if(Progress.count(save,id)+Math.ceil(pack.matchCount/eligible.length)>MAX)return {valid:false,reason:'capacity'};
 }
 save[pack.currency]=current-pack.cost;
 const granted={};
 if(pack.family==='match'){
  for(let i=0;i<pack.matchCount;i++){const id=eligible[i%eligible.length];granted[id]=(granted[id]||0)+1;}
  Progress.grant(save,granted);
 }else for(const [id,qty] of Object.entries(contents)){save.modePowerups[id]+=qty;granted[id]=qty;}
 return {valid:true,bundle:key,contents:granted,currency:pack.currency,cost:pack.cost};
}
function use(save,id,options={},at=Date.now()){
 const item=CATALOG[id];if(!item)return {valid:false,reason:'item'};
 ensure(save);if(!count(save,id))return {valid:false,reason:'stock'};
 if(!Number.isSafeInteger(at)||at<0)return {valid:false,reason:'time'};
 const o=options&&typeof options==='object'?options:{};
 let result={valid:false,reason:'target'};
 if(item.family==='farm'){
  const t=Farm.ensure(save),slot=o.plot,p=Number.isInteger(slot)&&slot>=0&&slot<Farm.plotCount(t.houseLevel)?t.plots[slot]:null;
  if(id==='farm-sunrise'&&p){
   if(p.mode==='campaign-day'&&p.work<Farm.Seasons.WORK){p.work=Farm.Seasons.WORK;result={valid:true,plot:slot};}
   else if(p.mode!=='campaign-day'&&p.readyAt>at){p.readyAt=Math.max(p.plantedAt+1,at);result={valid:true,plot:slot};}
  }
  if(id==='farm-rainfall'){
   let affected=0;for(const q of t.plots){
    if(!q)continue;
    if(q.mode==='campaign-day'){
     if(q.work<Farm.Seasons.WORK){
      const next=q.work+Math.ceil((Farm.Seasons.WORK-q.work)/2);
      if(next>q.work){q.work=Math.min(Farm.Seasons.WORK,next);affected++;}
     }
    }else if(q.readyAt>at){
     const next=Math.max(q.plantedAt+1,at+Math.ceil((q.readyAt-at)/2));
     if(next<q.readyAt){q.readyAt=next;affected++;}
    }
   }
   if(affected)result={valid:true,affected};
  }
  if(id==='farm-bounty'&&p&&Farm.plotStatus(save,slot,at).state==='ready'&&p.yield<=98){t.plots[slot].yield+=2;result={valid:true,plot:slot,yield:t.plots[slot].yield};}
  if(id==='farm-seeds'){
   const crop=Farm.CROPS[o.crop];if(crop&&t.houseLevel>=crop.house&&t.seeds[crop.id]<=LIMIT-3){t.seeds[crop.id]+=3;result={valid:true,crop:crop.id,quantity:3};}
  }
  if(id==='farm-compost'){
   const feed=Farm.FERTILIZERS[o.fertilizer];if(feed&&t.houseLevel>=feed.house&&t.fertilizers[feed.id]<=LIMIT-2){t.fertilizers[feed.id]+=2;result={valid:true,fertilizer:feed.id,quantity:2};}
  }
  if(id==='farm-market'){
   let value=0,qty=0;for(const crop of Object.values(Farm.CROPS)){const n=t.harvest[crop.id];value+=n*crop.sellEach;qty+=n;}
   const earned=Math.floor(value*1.2);
   if(qty>0&&money(save.coins)+earned<=LIMIT){for(const crop of Object.values(Farm.CROPS))t.harvest[crop.id]=0;save.coins+=earned;result={valid:true,quantity:qty,earned};}
  }
 }else{
  const n=Mine.ensure(save,at);
  if(id==='mine-strikes'&&n.bonusStrikes<=MAX-5){n.bonusStrikes+=5;result={valid:true,quantity:5};}
  if(id==='mine-surveys'&&n.bonusScans<=MAX-3){n.bonusScans+=3;result={valid:true,quantity:3};}
  if(id==='mine-ore'&&n.ore<=LIMIT-5){n.ore+=5;result={valid:true,quantity:5};}
  if(id==='mine-credit'&&save.rupeeMine.dollars<=LIMIT-200){save.rupeeMine.dollars+=200;result={valid:true,quantity:200};}
  if(id==='mine-dynamite'){
   const target=Mine.currentBoard(save,at).find(c=>c.x===o.x&&c.y===o.y);
   if(target&&!target.done){
    const first=Mine.excavate(save,o.x,o.y,at,true);
    if(first.valid){let hits=1;if(!first.cleared){const second=Mine.excavate(save,o.x,o.y,at,true);if(second.valid)hits++;}
     result={valid:true,hits,cleared:first.cleared||hits>1};}
   }
  }
  if(id==='mine-oracle'){const r=Mine.survey(save,o.x,o.y,at,true);if(r.valid)result={valid:true,orePresent:r.orePresent};}
 }
 if(result.valid)save.modePowerups[id]--;
 return {...result,id};
}
function grantRandom(save,rng=Math.random){
 const r=Number(rng()),fraction=Number.isFinite(r)?Math.min(.999999,Math.max(0,r)):0;
 const family=['farm','mine','match'][Math.floor(fraction*3)];
 if(family==='match'){
  const unlocked=availableMatch(save);if(unlocked.length){
   const id=unlocked[Math.min(unlocked.length-1,Math.floor(fraction*997)%unlocked.length)];
   if(Progress.count(save,id)<MAX){Progress.grant(save,{[id]:1});return {valid:true,id,family,label:'1 × '+id+' match-3 booster'};}
  }
 }
 const list=items.filter(i=>i.family===(family==='match'?'farm':family));
 const item=list[Math.floor(fraction*997)%list.length],r2=acquire(save,item.id,1);
 return {...r2,family:item.family,label:'1 × '+item.name};
}
const api=Object.freeze({CATALOG,MATCH_IDS,BUNDLES,ensure,count,acquire,purchase,buyBundle,use,grantRandom,availableMatch});
root.RupeeModePowerups=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
