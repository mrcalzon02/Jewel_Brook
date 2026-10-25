/* Rupee Rush / Heroes of Embryon: Town economy phase 1.
 * Pure deterministic transactions around a caller-provided save object.
 * No browser timers, network access, localStorage access, or UI side effects.
 */
(function(root){'use strict';
 const FIRST=1,LAST=40,MAX=1_000_000_000,MAX_QTY=1000;
 const CATEGORIES=Object.freeze(["roots","greens","grains","fruits","herbs","flowers","exotics","orchard"]);
 const DATA=[["carrot","Hawseed Carrot",1,12,5,2,12,"roots","carrot"],["wheat","Sunwheat",4,25,12,3,12,"grains","wheat"],["berry","Bluebell Berry",8,40,30,3,18,"fruits","blueberry"],["radish","Ruby Radish",1,10,3,2,9,"roots",null],["lettuce","Moonleaf Lettuce",1,15,6,3,10,"greens","lettuce"],["pea","Sweetpod Peas",1,16,7,3,10,"greens",null],["mint","Frostmint",1,18,8,3,12,"herbs",null],["potato","Copper Potato",2,20,10,4,9,"roots","potato"],["onion","Amber Onion",2,22,11,3,12,"roots","onion"],["spinach","Nightshade Spinach",3,22,10,4,10,"greens",null],["beet","Crimson Beet",3,24,13,3,14,"roots",null],["strawberry","Sunblush Strawberry",5,28,15,3,16,"fruits","strawberry"],["tomato","Blazevine Tomato",6,32,18,4,14,"fruits","tomato"],["cabbage","Pearl Cabbage",7,34,20,3,17,"greens","cabbage"],["bean","Goldrunner Beans",9,42,25,4,15,"greens",null],["garlic","Silver Garlic",10,44,29,3,21,"roots","garlic"],["corn","Golden Corn",11,47,35,4,17,"grains","corn"],["pepper","Firecrest Pepper",12,50,38,3,23,"fruits","pepper"],["broccoli","Evergreen Broccoli",13,55,40,3,24,"greens","broccoli"],["cucumber","Dewdrop Cucumber",14,58,45,4,22,"fruits",null],["cauliflower","Cloudbloom Cauliflower",15,62,50,3,30,"greens","cauliflower"],["kale","Ironleaf Kale",16,65,55,4,25,"greens",null],["raspberry","Velvet Raspberry",17,70,60,3,33,"fruits","raspberry"],["sunflower","Sungold Sunflower",18,75,70,3,36,"flowers","sunflower"],["zucchini","Duskstripe Zucchini",19,78,75,4,29,"fruits",null],["eggplant","Violet Eggplant",20,85,85,3,42,"fruits","eggplant"],["pumpkin","Harvest Pumpkin",21,95,95,2,65,"fruits","pumpkin"],["barley","Highland Barley",22,94,100,4,36,"grains",null],["rice","Moonwater Rice",23,98,110,5,34,"grains",null],["cotton","Cloud Cotton",24,110,120,4,43,"exotics","cotton"],["sugarcane","Crystal Sugarcane",25,115,135,4,45,"grains","sugarcane"],["herb-bundle","Emberleaf Herbs",26,120,140,5,42,"herbs","herb-bundle"],["lavender","Royal Lavender",27,130,150,4,55,"herbs","lavender"],["tea-leaves","Mistvale Tea",28,140,160,5,50,"herbs","tea-leaves"],["daisy","Sunburst Daisy",29,145,180,4,62,"flowers","daisy"],["tulip","Silverglow Tulip",30,160,200,4,67,"flowers","tulip"],["rose","Moonshadow Rose",31,170,220,4,72,"flowers","rose"],["coffee-beans","Nightfall Coffee",32,180,240,4,78,"exotics","coffee-beans"],["orchid","Arcane Orchid",33,200,265,3,110,"flowers","orchid"],["grape","Starlight Grapes",34,215,280,4,90,"fruits",null],["melon","Crystal Melon",35,235,300,3,125,"fruits",null],["watermelon","Royal Watermelon",36,250,330,3,137,"fruits",null],["apple","Gilded Apple",37,280,360,3,156,"orchard",null],["pear","Moonstone Pear",37,290,390,3,160,"orchard",null],["peach","Blushfire Peach",38,320,420,3,184,"orchard",null],["pineapple","Sunspire Pineapple",38,335,450,3,193,"exotics",null],["dragonfruit","Dragonheart Fruit",39,370,490,3,217,"exotics",null],["starfruit","Astral Starfruit",40,425,540,3,250,"exotics",null]];
 const CROPS=Object.freeze(Object.fromEntries(DATA.map(([id,name,house,seedCost,minutes,yieldAmount,sellEach,category,artId])=>[id,Object.freeze({id,name,house,seedCost,growMs:minutes*60_000,yield:yieldAmount,sellEach,category,artId})])));
 const FERTILIZERS=Object.freeze({
  compost:Object.freeze({id:'compost',name:'Garden Compost',house:1,cost:15,yieldBonus:1,speedPercent:90}),
  quality:Object.freeze({id:'quality',name:'Fortified Soil',house:11,cost:40,yieldBonus:2,speedPercent:80}),
  royal:Object.freeze({id:'royal',name:'Royal Crystal Feed',house:26,cost:80,yieldBonus:3,speedPercent:70})
 });
 const PLOT_UNLOCKS=Object.freeze([1,6,11,16,21,26,31,36]);
 const validInt=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 const clamped=(v,min,max,fallback=min)=>validInt(v,min,max)?v:fallback;
 const boundedHouse=level=>Number.isSafeInteger(level)?Math.max(FIRST,Math.min(LAST,level)):FIRST;
 const plotCount=level=>PLOT_UNLOCKS.filter(n=>n<=boundedHouse(level)).length;
 const upgradeCost=level=>validInt(level,FIRST,LAST-1)?40+20*level+8*level*level:null;
 function nowValue(at){return Number.isSafeInteger(at)&&at>=0?at:null;}
 function houseBand(level){return clamped(level,1,40)<=10?'Hawseed Homestead':level<=20?'Garden Cottage':level<=30?'Prosperous Townhouse':'Royal Manor';}
 function inventoryObject(obj,keys){
  const value=obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
  for(const k of keys)value[k]=clamped(value[k],0,MAX,0);
  // Preserve unrecognized items for future-version save interoperability.
  return value;
 }
 function ensure(save){
  if(!save||typeof save!=='object'||Array.isArray(save))throw TypeError('save object required');
  if(!save.town||typeof save.town!=='object'||Array.isArray(save.town))save.town={};
  const town=save.town;
  town.schemaVersion=1;
  town.houseLevel=boundedHouse(town.houseLevel);
  town.seeds=inventoryObject(town.seeds,Object.keys(CROPS));
  town.fertilizers=inventoryObject(town.fertilizers,Object.keys(FERTILIZERS));
  town.harvest=inventoryObject(town.harvest,Object.keys(CROPS));
  const slots=Array.isArray(town.plots)?town.plots:[];
  town.plots=Array.from({length:8},(_,index)=>{
   const p=slots[index];if(p===null||p===undefined)return null;
   if(!p||typeof p!=='object'||Array.isArray(p)||!Object.hasOwn(CROPS,p.crop)||!validInt(p.plantedAt,0,Number.MAX_SAFE_INTEGER)||!validInt(p.readyAt,p.plantedAt+1,Number.MAX_SAFE_INTEGER)||!validInt(p.yield,1,100))return null;
   return {crop:p.crop,plantedAt:p.plantedAt,readyAt:p.readyAt,yield:p.yield,fertilizer:Object.hasOwn(FERTILIZERS,p.fertilizer)?p.fertilizer:null};
  });
  return town;
 }
 function balance(save){return validInt(save.coins,0,MAX)?save.coins:0;}
 function pay(save,cost){if(!validInt(cost,1,MAX)||balance(save)<cost)return false;save.coins-=cost;return true;}
 function purchase(save,kind,id,quantity=1){
  const list=kind==='seed'?CROPS:kind==='fertilizer'?FERTILIZERS:null;
  const item=list&&Object.hasOwn(list,id)?list[id]:null;
  if(!item)return {valid:false,reason:'item'};
  if(!validInt(quantity,1,MAX_QTY))return {valid:false,reason:'quantity'};
  const town=ensure(save);
  if(town.houseLevel<item.house)return {valid:false,reason:'house'};
  const dest=kind==='seed'?town.seeds:town.fertilizers;
  if(dest[id]+quantity>MAX)return {valid:false,reason:'capacity'};
  const amount=(kind==='seed'?item.seedCost:item.cost)*quantity;
  if(!pay(save,amount))return {valid:false,reason:'coins'};
  dest[id]+=quantity;
  return {valid:true,id,quantity,cost:amount,balance:save.coins};
 }
 function upgradeHouse(save){
  const town=ensure(save),cost=upgradeCost(town.houseLevel);
  if(cost===null)return {valid:false,reason:'max'};
  if(!pay(save,cost))return {valid:false,reason:'coins',cost};
  town.houseLevel++;
  return {valid:true,houseLevel:town.houseLevel,plots:plotCount(town.houseLevel),cost};
 }
 function gloveTier(save){const e=save&&save.rupeeExpedition;return e&&validInt(e.gloveTier,0,39)?e.gloveTier:0;}
 function plant(save,plot,seedId,fertilizerId=null,at=Date.now()){
  const time=nowValue(at);if(time===null)return {valid:false,reason:'time'};
  const crop=Object.hasOwn(CROPS,seedId)?CROPS[seedId]:null,feed=fertilizerId===null?null:(Object.hasOwn(FERTILIZERS,fertilizerId)?FERTILIZERS[fertilizerId]:null);
  if(!crop)return {valid:false,reason:'seed'};
  if(fertilizerId!==null&&!feed)return {valid:false,reason:'fertilizer'};
  const town=ensure(save);
  if(!validInt(plot,0,plotCount(town.houseLevel)-1))return {valid:false,reason:'plot'};
  if(town.plots[plot])return {valid:false,reason:'occupied'};
  if(town.houseLevel<crop.house||(feed&&town.houseLevel<feed.house))return {valid:false,reason:'house'};
  if(!town.seeds[seedId])return {valid:false,reason:'inventory'};
  if(feed&&!town.fertilizers[feed.id])return {valid:false,reason:'fertilizer-inventory'};
  const houseSpeed=1-Math.min(.195,(town.houseLevel-1)*.005);
  const growth=Math.max(1000,Math.ceil(crop.growMs*houseSpeed*(feed?feed.speedPercent:100)/100));
  if(time+growth>Number.MAX_SAFE_INTEGER)return {valid:false,reason:'time'};
  const qty=crop.yield+Math.floor(gloveTier(save)/10)+(feed?feed.yieldBonus:0);
  town.seeds[seedId]--;
  if(feed)town.fertilizers[feed.id]--;
  const planted={crop:crop.id,plantedAt:time,readyAt:time+growth,yield:qty,fertilizer:feed?feed.id:null};
  town.plots[plot]=planted;
  return {valid:true,plot,...planted};
 }
 function plotStatus(save,plot,at=Date.now()){
  const town=ensure(save),time=nowValue(at);
  if(!validInt(plot,0,7)||time===null)return {valid:false,reason:'plot-or-time'};
  if(plot>=plotCount(town.houseLevel))return {valid:true,state:'locked',plot};
  const p=town.plots[plot];if(!p)return {valid:true,state:'empty',plot};
  const duration=Math.max(1,p.readyAt-p.plantedAt);
  const progress=Math.max(0,Math.min(1,(time-p.plantedAt)/duration));
  return {valid:true,state:time>=p.readyAt?'ready':progress<.25?'seed':progress<.5?'sprout':progress<.75?'growing':'maturing',plot,...p,progress};
 }
 function harvest(save,plot,at=Date.now()){
  const time=nowValue(at);if(time===null)return {valid:false,reason:'time'};
  const town=ensure(save);
  if(!validInt(plot,0,plotCount(town.houseLevel)-1))return {valid:false,reason:'plot'};
  const p=town.plots[plot];if(!p)return {valid:false,reason:'empty'};
  if(time<p.readyAt)return {valid:false,reason:'growing',readyAt:p.readyAt};
  if(town.harvest[p.crop]+p.yield>MAX)return {valid:false,reason:'capacity'};
  town.harvest[p.crop]+=p.yield;town.plots[plot]=null;
  return {valid:true,crop:p.crop,quantity:p.yield,plot};
 }
 function sell(save,cropId,quantity=1){
  const crop=Object.hasOwn(CROPS,cropId)?CROPS[cropId]:null;if(!crop)return {valid:false,reason:'crop'};
  if(!validInt(quantity,1,MAX))return {valid:false,reason:'quantity'};
  const town=ensure(save),earned=quantity*crop.sellEach;
  if(town.harvest[cropId]<quantity)return {valid:false,reason:'inventory'};
  if(balance(save)+earned>MAX)return {valid:false,reason:'capacity'};
  town.harvest[cropId]-=quantity;save.coins+=earned;
  return {valid:true,crop:cropId,quantity,earned,balance:save.coins};
 }
 function summary(save,at=Date.now()){
  const town=ensure(save),plots=plotCount(town.houseLevel);
  return {houseLevel:town.houseLevel,houseBand:houseBand(town.houseLevel),plots,gloveTier:gloveTier(save),nextUpgradeCost:upgradeCost(town.houseLevel),coins:balance(save),slots:town.plots.slice(0,plots).map((_,i)=>plotStatus(save,i,at)),seeds:{...town.seeds},fertilizers:{...town.fertilizers},harvest:{...town.harvest}};
 }
 const API=Object.freeze({name:'Town',FIRST,LAST,CROPS,FERTILIZERS,CATEGORIES,PLOT_UNLOCKS,ensure,plotCount,upgradeCost,upgradeHouse,gloveTier,purchase,plant,harvest,plotStatus,sell,summary,houseBand});
 root.RupeeTownGarden=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
