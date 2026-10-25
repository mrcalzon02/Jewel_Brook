/* Rupee Rush collectible economy: cosmetic-only Style Shards, transparent weighted drops.
 * Local/offline game currency, never a real-money checkout.
 */
(function(root){'use strict';
const MAX=999999999;
const CURRENCY=Object.freeze({coins:'Rupees',gems:'Star Gems',styleShards:'Style Shards',credits:'Mining Credits'});
const RARITIES=Object.freeze({common:80,rare:160,epic:340,legendary:700});
const PREFIX=['Aster','Briar','Celeste','Dorian','Elara','Fen','Galen','Hazel','Isolde','Juniper','Kael','Lyra','Mira','Nolan','Orion','Petra','Quill','Rhea','Sable','Tarin','Uma','Vesper','Wren','Xara','Ysolde','Zephyr','Arden','Dahlia','Ember','Fiora','Garrick','Seren'];
const ROLES=['the Stargazer','the Wayfinder','the Guardian','the Tinker','the Dreamer','the Prospector','the Courtier','the Adventurer'];
const HAIR=['#5f3468','#3a2535','#ca8d3d','#e8d6a1','#4b5d85','#9d476e','#a6c3dd','#553524'];
const SKIN=['#e8bd9c','#9b644b','#dfac82','#754a38','#f7ceb0','#b98561','#8b584a','#d7a080'];
const COATS=['#694a9d','#358a92','#b8585d','#587a3d','#c1944c','#436ea3','#895c89','#bd855f'];
const money=n=>Number.isSafeInteger(n)&&n>=0?Math.min(MAX,n):0;
const day=at=>{const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function portrait(i){
 const hair=HAIR[i%HAIR.length],skin=SKIN[(i*3)%SKIN.length],coat=COATS[(i*5)%COATS.length],shine=['#f1d7a0','#d7c6f8','#9debdc','#ffc3e3'][i%4];
 const style=i%4;
 const back=style===0?'<path d="M28 69 Q6 36 27 16 Q48 -4 70 18 Q91 39 67 70Z" fill="'+hair+'"/>':
  style===1?'<path d="M16 71 Q20 0 49 8 Q80 7 84 73Z" fill="'+hair+'"/>':
  style===2?'<path d="M18 58 Q1 11 42 12 Q90 1 84 66Z" fill="'+hair+'"/>':
  '<path d="M25 80Q8 10 47 5Q90 11 76 81Z" fill="'+hair+'"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="'+coat+'"/><stop offset="1" stop-color="#211b37"/></linearGradient></defs>'+
 '<rect width="100" height="100" rx="14" fill="url(#b)"/><circle cx="50" cy="42" r="36" fill="'+shine+'" opacity=".12"/>'+
 back+'<path d="M6 100 Q9 69 42 68L58 68Q91 71 94 100" fill="'+coat+'" stroke="'+shine+'" stroke-width="3"/>'+
 '<path d="M40 61L40 76Q50 85 60 76L60 61" fill="'+skin+'"/><ellipse cx="50" cy="42" rx="22" ry="27" fill="'+skin+'"/>'+
 '<path d="M29 36Q22 11 51 16Q72 8 74 39L67 27Q51 39 29 36Z" fill="'+hair+'"/>'+
 '<circle cx="41" cy="45" r="2" fill="#282236"/><circle cx="59" cy="45" r="2" fill="#282236"/>'+
 '<path d="M44 57Q50 61 56 57" fill="none" stroke="#8e4b5e" stroke-width="1.5"/>'+
 '<path d="M47 80L50 87L53 80" fill="'+shine+'"/>'+
 (style===3?'<path d="M25 20L38 7L50 17L62 7L75 20" fill="none" stroke="'+shine+'" stroke-width="4"/>':'')+'</svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
const CATALOG=[];
const rarity=i=>i%19===0?'legendary':i%7===0?'epic':i%3===0?'rare':'common';
for(let i=0;i<PREFIX.length;i++)CATALOG.push(Object.freeze({id:'character-'+String(i+1).padStart(2,'0'),name:PREFIX[i]+' '+ROLES[i%ROLES.length],type:'character',rarity:rarity(i),image:portrait(i),cost:RARITIES[rarity(i)]*2}));
for(let i=0;i<40;i++){const n=String(i+1).padStart(2,'0'),r=rarity(i+5);CATALOG.push(Object.freeze({id:'outfit-'+n,name:'Daysha Royal Look '+n,type:'outfit',rarity:r,image:'art/embryon/town/avatars/daysha_lv_'+n+'.png',cost:RARITIES[r]}));}
const G=root.RupeeMiningGear;
if(G){for(const [kind,type] of [['pickaxe','pickSkin'],['gloves','gloveSkin']]){
  for(const [i,item] of G.ART[kind].entries()){const r=rarity(i+11);CATALOG.push(Object.freeze({id:type+'-'+item.id,name:item.name+' '+(kind==='pickaxe'?'Pickaxe':'Gloves'),type,rarity:r,image:item.image,cost:RARITIES[r]}));}
  for(const [i,item] of G.BONUS[kind].entries())CATALOG.push(Object.freeze({id:type+'-'+item.id,name:item.name+' Collector '+(kind==='pickaxe'?'Pickaxe':'Gloves'),type,rarity:'legendary',image:item.image,cost:RARITIES.legendary}));
 }}
function frameArt(i){
 const colors=['#bcb4ef','#a9dcff','#a2f1ca','#f6d78d','#ef9aa9'];
 const c=colors[i%colors.length],n=5+i%4,inner=8+(i%3)*2;
 const ornaments=Array.from({length:n},(_,k)=>{const a=2*Math.PI*k/n,x=65+54*Math.cos(a),y=65+54*Math.sin(a);return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(3+i%3)+'" fill="'+c+'" stroke="#fff5c4" stroke-width="1"/>';}).join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130"><rect x="7" y="7" width="116" height="116" rx="'+(10+i%5)+'" fill="none" stroke="'+c+'" stroke-width="'+(4+i%3)+'"/>'+
 '<rect x="'+inner+'" y="'+inner+'" width="'+(130-inner*2)+'" height="'+(130-inner*2)+'" rx="7" fill="none" stroke="#f5e7b5" stroke-width="2"/>'+
 '<path d="M10 30L10 10L32 10 M98 10L120 10L120 30 M120 100L120 120L98 120 M32 120L10 120L10 100" fill="none" stroke="#fff6ca" stroke-width="4"/>'+
 ornaments+'</svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
for(let i=0;i<20;i++){const n=String(i+1).padStart(2,'0'),r=rarity(i+9);CATALOG.push(Object.freeze({id:'frame-'+n,name:['Amethyst','Sapphire','Emerald','Gold','Ruby'][i%5]+' Portrait Frame '+n,type:'frame',rarity:r,image:frameArt(i),cost:RARITIES[r]}));}
const BY_ID=Object.freeze(Object.fromEntries(CATALOG.map(x=>[x.id,x])));
const POOLS=Object.freeze({
 basic:Object.freeze([{kind:'coins',weight:24,min:250,max:650},{kind:'gems',weight:10,min:2,max:5},{kind:'styleShards',weight:18,min:35,max:90},{kind:'credits',weight:12,min:100,max:250},{kind:'booster',weight:16,min:1,max:3},{kind:'cosmetic',weight:10},{kind:'character',weight:6},{kind:'upgrade',weight:4}]),
 vanity:Object.freeze([{kind:'styleShards',weight:30,min:90,max:180},{kind:'cosmetic',weight:45},{kind:'character',weight:25}]),
 expedition:Object.freeze([{kind:'credits',weight:30,min:300,max:950},{kind:'coins',weight:20,min:350,max:1100},{kind:'booster',weight:20,min:2,max:4},{kind:'upgrade',weight:15},{kind:'styleShards',weight:15,min:45,max:120}]),
 royal:Object.freeze([{kind:'gems',weight:20,min:5,max:12},{kind:'styleShards',weight:25,min:100,max:260},{kind:'cosmetic',weight:25},{kind:'character',weight:15},{kind:'booster',weight:10,min:3,max:5},{kind:'upgrade',weight:5}])
});
const PACKS=Object.freeze({
 satchel:Object.freeze({name:'Prospector Satchel',currency:'coins',cost:350,rolls:2,pool:'basic',description:'Two independent treasure drops'}),
 crate:Object.freeze({name:'Explorer Crate',currency:'coins',cost:950,rolls:4,pool:'basic',description:'Four assorted reward rolls'}),
 vault:Object.freeze({name:'Crystal Vault',currency:'gems',cost:15,rolls:5,pool:'royal',description:'Five royal reward rolls'}),
 caravan:Object.freeze({name:'Caravan Cargo',currency:'coins',cost:1400,rolls:4,pool:'expedition',description:'Credits, boosters, upgrade chances'}),
 minecache:Object.freeze({name:'Miner’s Cache',currency:'gems',cost:12,rolls:4,pool:'expedition',description:'Four mining supply rolls'}),
 vanity:Object.freeze({name:'Wardrobe Trunk',currency:'coins',cost:800,rolls:3,pool:'vanity',description:'Three purely cosmetic rewards'}),
 masquerade:Object.freeze({name:'Masquerade Chest',currency:'gems',cost:18,rolls:5,pool:'vanity',description:'Five cosmetic draws'}),
 coronation:Object.freeze({name:'Royal Coronation',currency:'gems',cost:38,rolls:9,pool:'royal',description:'Nine royal reward rolls'})
});
function ensure(save){
 for(const id of ['coins','gems','styleShards'])save[id]=money(save[id]);
 if(!save.cosmeticsOwned||typeof save.cosmeticsOwned!=='object'||Array.isArray(save.cosmeticsOwned))save.cosmeticsOwned={};
 if(!save.cosmeticEquipped||typeof save.cosmeticEquipped!=='object'||Array.isArray(save.cosmeticEquipped))save.cosmeticEquipped={};
 if(!save.rewardHistory||Array.isArray(save.rewardHistory)===false)save.rewardHistory=[];
 if(!save.cosmeticsOwned['character-01'])save.cosmeticsOwned['character-01']=true;
 if(!save.cosmeticsOwned['outfit-01'])save.cosmeticsOwned['outfit-01']=true;
 if(!BY_ID[save.cosmeticEquipped.character]||!save.cosmeticsOwned[save.cosmeticEquipped.character])save.cosmeticEquipped.character='character-01';
 if(!BY_ID[save.cosmeticEquipped.outfit]||!save.cosmeticsOwned[save.cosmeticEquipped.outfit])save.cosmeticEquipped.outfit='outfit-01';
 return save;
}
function weighted(pool,rng=Math.random){
 const total=pool.reduce((n,x)=>n+x.weight,0);if(total<=0)throw Error('empty reward table');
 const raw=Number(rng()),r=Number.isFinite(raw)?Math.max(0,Math.min(.999999999,raw)):0;
 let ticket=r*total;
 for(const item of pool){ticket-=item.weight;if(ticket<0)return item;}
 return pool[pool.length-1];
}
function randRange(min,max,rng){const x=Number(rng());return min+Math.floor(Math.max(0,Math.min(.999999999,Number.isFinite(x)?x:0))*(max-min+1));}
function credit(save,id,amount){if(id==='credits'){const n=root.RupeeMining?.ensure(save);if(!n)return 0;save.rupeeMine.dollars=Math.min(MAX,money(save.rupeeMine.dollars)+amount);return amount;}save[id]=Math.min(MAX,money(save[id])+amount);return amount;}
function awardCosmetic(save,type,rng){
 const pool=CATALOG.filter(c=>type==='character'?c.type==='character':c.type!=='character');
 const item=pool[randRange(0,pool.length-1,rng)];
 if(save.cosmeticsOwned[item.id]){const amount=Math.ceil(item.cost/4);credit(save,'styleShards',amount);return {kind:'duplicate',label:'Duplicate '+item.name+' → '+amount+' Style Shards',id:item.id,amount};}
 save.cosmeticsOwned[item.id]=true;return {kind:item.type,label:'Unlocked '+item.name,id:item.id};
}
function freeUpgrade(save,rng){
 const M=root.RupeeMining,gear=root.RupeeMiningGear;
 if(!M||!gear)return {kind:'styleShards',label:'60 Style Shards',amount:credit(save,'styleShards',60)};
 const n=M.ensure(save);
 const choices=[['pickaxe','pickTier',gear.LAST],['gloves','gloveTier',gear.LAST],['mineTier','mineTier',5],['cartTier','cartTier',5],['refineryTier','refineryTier',5]].filter(([_,key,max])=>n[key]<max);
 if(!choices.length)return {kind:'styleShards',label:'60 Style Shards (maxed equipment)',amount:credit(save,'styleShards',60)};
 const [track,key]=choices[randRange(0,choices.length-1,rng)],old=n[key];
 n[key]=old+1;
 if(track==='pickaxe'||track==='gloves'){
  const budget=track==='pickaxe'?'strikesLeft':'scansLeft';
  n[budget]=Math.min(gear.dailyLimit(track,n[key]),money(n[budget])+gear.dailyLimit(track,n[key])-gear.dailyLimit(track,old));
 }
 M.ensure(save);return {kind:'upgrade',label:'FREE '+track+' upgrade → tier '+(n[key]+1),track,tier:n[key]};
}
function grantRoll(save,entry,rng=Math.random,P=root.RupeeProgress){
 ensure(save);
 const kind=entry.kind;
 if(kind==='cosmetic'||kind==='character')return awardCosmetic(save,kind,rng);
 if(kind==='upgrade')return freeUpgrade(save,rng);
 if(kind==='booster'){
  if(!P||!P.available||!P.grant)return {kind:'styleShards',label:'40 Style Shards',amount:credit(save,'styleShards',40)};
  const unlocked=P.available(save);
  if(!unlocked.length)return {kind:'styleShards',label:'40 Style Shards',amount:credit(save,'styleShards',40)};
  const id=unlocked[randRange(0,unlocked.length-1,rng)],qty=randRange(entry.min||1,entry.max||1,rng),before=P.count(save,id);
  const count=Math.max(0,Math.min(qty,999999-before));
  if(!count)return {kind:'styleShards',label:'40 Style Shards',amount:credit(save,'styleShards',40)};
  P.grant(save,{[id]:count});return {kind,label:count+' × '+id+' booster',id,amount:count};
 }
 if(!Object.prototype.hasOwnProperty.call(CURRENCY,kind))return {kind:'invalid',label:'Invalid reward'};
 const amount=randRange(entry.min||1,entry.max||1,rng);
 credit(save,kind,amount);return {kind,label:amount+' '+CURRENCY[kind],amount};
}
function buyPack(save,id,rng=Math.random,P=root.RupeeProgress){
 ensure(save);const p=PACKS[id];if(!p)return {valid:false,reason:'unknown'};
 const initial=money(save[p.currency]);if(initial<p.cost)return {valid:false,reason:'funds'};
 save[p.currency]=initial-p.cost;
 const results=[];for(let i=0;i<p.rolls;i++)results.push(grantRoll(save,weighted(POOLS[p.pool],rng),rng,P));
 remember(save,'Opened '+p.name,results);
 return {valid:true,pack:id,spent:p.cost,currency:p.currency,results};
}
function buyCosmetic(save,id){ensure(save);const item=BY_ID[id];if(!item)return {valid:false,reason:'unknown'};
 if(save.cosmeticsOwned[id])return {valid:false,reason:'owned'};
 if(save.styleShards<item.cost)return {valid:false,reason:'funds'};
 save.styleShards-=item.cost;save.cosmeticsOwned[id]=true;return {valid:true,id,item};
}
function equip(save,id){ensure(save);const item=BY_ID[id];if(!item||!save.cosmeticsOwned[id])return {valid:false,reason:'locked'};
 save.cosmeticEquipped[item.type]=id;return {valid:true,id,item};
}
function remember(save,label,results){ensure(save);save.rewardHistory.unshift({at:Date.now(),label,items:results.map(r=>r.label)});save.rewardHistory.length=Math.min(save.rewardHistory.length,30);}
function dailyState(save,at=Date.now()){ensure(save);const today=day(at);return {ready:save.lastFreeChestDay!==today&&(!save.lastFreeChestAt||at>=save.lastFreeChestAt),today};}
function claimDaily(save,at=Date.now(),rng=Math.random,P=root.RupeeProgress){
 ensure(save);const state=dailyState(save,at);if(!state.ready)return {valid:false,reason:'claimed'};
 const result=grantRoll(save,weighted(POOLS.basic,rng),rng,P);
 save.lastFreeChestDay=state.today;save.lastFreeChestAt=at;remember(save,'Daily treasure',[result]);
 return {valid:true,results:[result],day:state.today};
}
function odds(id){const pool=POOLS[id]||POOLS[PACKS[id]?.pool]||POOLS.basic;const total=pool.reduce((a,b)=>a+b.weight,0);return pool.map(x=>({kind:x.kind,percent:Math.round(10000*x.weight/total)/100}));}
const api=Object.freeze({MAX,CURRENCY,RARITIES,CATALOG,BY_ID,POOLS,PACKS,portrait,ensure,weighted,grantRoll,buyPack,buyCosmetic,equip,dailyState,claimDaily,odds,freeUpgrade});
root.RupeeEconomy=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);