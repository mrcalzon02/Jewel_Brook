/* Rupee Rush — kitchen phase 1. Harvested crops -> stored meals -> explicit serving.
 * Deterministic offline transactions. The other mode's canonical APIs grant every
 * reward; the kitchen never adds new life, move, mining or booster currencies.
 */
(function(root){'use strict';
const Farm=root.RupeeTownGarden,Daily=root.RupeeDailyMoves,Mine=root.RupeeMining,Progress=root.RupeeProgress,Power=root.RupeeModePowerups,Art=root.RupeeFarmingArt;
if(![Farm,Daily,Mine,Progress,Power,Art].every(Boolean))throw Error('Kitchen requires farming, daily moves, mining, progression, power-ups, and art');
const MAX=999999,MAX_BATCH=20;
const make=(id,name,house,ingredients,reward,artId)=>Object.freeze({
 id,name,house,ingredients:Object.freeze(ingredients.map(([item,quantity])=>Object.freeze({item,quantity}))),
 reward:Object.freeze(reward),art:Art.goods(artId),placeholderArt:true
});
const RECIPES=Object.freeze([
 make('garden-salad','Hawseed Garden Salad',1,[['carrot',3]],{kind:'farmPower',id:'farm-compost',amount:1},'herb-bundle'),
 make('hawseed-broth','Hawseed Broth',4,[['carrot',2],['wheat',1]],{kind:'hearts',amount:1},'plant-pot'),
 make('prospector-rations','Prospector Rations',4,[['wheat',2],['carrot',1]],{kind:'strikes',amount:3},'bread'),
 make('bluebell-tart','Bluebell Tart',8,[['berry',2],['wheat',1]],{kind:'moves',amount:3},'jam'),
 make('bluebell-infusion','Bluebell Infusion',8,[['berry',2],['carrot',1]],{kind:'scans',amount:2},'juice'),
 make('royal-platter','Royal Harvest Platter',11,[['carrot',2],['wheat',2],['berry',2]],{kind:'matchBooster',id:'hammer',amount:1},'cheese')
]);
const BY_ID=Object.freeze(Object.fromEntries(RECIPES.map(r=>[r.id,r])));
const inRange=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const reason=(code,more={})=>({valid:false,reason:code,...more});
function ensure(save){
 const town=Farm.ensure(save);
 if(!town.kitchen||typeof town.kitchen!=='object'||Array.isArray(town.kitchen))town.kitchen={};
 const kitchen=town.kitchen;
 if(!kitchen.meals||typeof kitchen.meals!=='object'||Array.isArray(kitchen.meals))kitchen.meals={};
 for(const r of RECIPES)if(!inRange(kitchen.meals[r.id],0,MAX))kitchen.meals[r.id]=0;
 kitchen.schemaVersion=1;
 return kitchen;
}
const stock=(save,id)=>BY_ID[id]?ensure(save).meals[id]:0;
function checkCook(save,id,quantity=1){
 const r=BY_ID[id];if(!r)return reason('recipe');
 if(!inRange(quantity,1,MAX_BATCH))return reason('quantity');
 const kitchen=ensure(save),town=save.town;
 if(town.houseLevel<r.house)return reason('house',{required:r.house});
 if(kitchen.meals[id]>MAX-quantity)return reason('capacity');
 for(const x of r.ingredients){
  if(!Object.hasOwn(Farm.CROPS,x.item))return reason('ingredient');
  if(!inRange(town.harvest[x.item],0,1_000_000_000)||town.harvest[x.item]<x.quantity*quantity)return reason('ingredients',{item:x.item,required:x.quantity*quantity,owned:town.harvest[x.item]});
 }
 return {valid:true,id,quantity,ingredients:r.ingredients};
}
function cook(save,id,quantity=1){
 const valid=checkCook(save,id,quantity);
 if(!valid.valid)return valid;
 const r=BY_ID[id],meals=save.town.kitchen.meals,harvest=save.town.harvest;
 for(const x of r.ingredients)harvest[x.item]-=x.quantity*quantity;
 meals[id]+=quantity;
 return {valid:true,id,quantity,stored:meals[id],reward:r.reward};
}
function checkServe(save,id,at=Date.now(),moveCap=36){
 const r=BY_ID[id];if(!r)return reason('recipe');
 if(!inRange(at,0,Number.MAX_SAFE_INTEGER))return reason('time');
 if(!inRange(moveCap,1,100))return reason('cap');
 const kitchen=ensure(save);
 if(kitchen.meals[id]<1)return reason('stock');
 const reward=r.reward,n=reward.amount;
 if(reward.kind==='hearts'){
  if(!inRange(save.hearts,0,5))return reason('hearts');
  if(save.hearts+n>5)return reason('full');
 }else if(reward.kind==='moves'){
  const bank=Daily.ensure(save,at,moveCap);
  if(!inRange(bank.remaining,0,999999-n)||!inRange(bank.bonus,0,999999-n))return reason('capacity');
 }else if(reward.kind==='strikes'||reward.kind==='scans'){
  const mine=Mine.ensure(save,at),field=reward.kind==='strikes'?'bonusStrikes':'bonusScans';
  if(!inRange(mine[field],0,999999-n))return reason('capacity');
 }else if(reward.kind==='farmPower'){
  if(!Power.CATALOG[reward.id]||Power.CATALOG[reward.id].family!=='farm')return reason('reward');
  if(Power.count(save,reward.id)>999999-n)return reason('capacity');
 }else if(reward.kind==='matchBooster'){
  if(!Progress.unlocked(save,reward.id))return reason('locked');
  if(Progress.count(save,reward.id)>999999-n)return reason('capacity');
 }else return reason('reward');
 return {valid:true,id,kind:reward.kind,amount:n};
}
function serve(save,id,at=Date.now(),moveCap=36){
 const checked=checkServe(save,id,at,moveCap);if(!checked.valid)return checked;
 const r=BY_ID[id],reward=r.reward,n=reward.amount;
 if(reward.kind==='hearts')save.hearts+=n;
 else if(reward.kind==='moves')Daily.topUp(save,n,at,moveCap);
 else if(reward.kind==='strikes')Mine.ensure(save,at).bonusStrikes+=n;
 else if(reward.kind==='scans')Mine.ensure(save,at).bonusScans+=n;
 else if(reward.kind==='farmPower'){
  const result=Power.acquire(save,reward.id,n);
  if(!result.valid)return reason('capacity');
 }else if(reward.kind==='matchBooster'){
  if(Progress.grant(save,{[reward.id]:n})!==n)return reason('capacity');
 }
 save.town.kitchen.meals[id]--;
 return {valid:true,id,kind:reward.kind,amount:n,remaining:save.town.kitchen.meals[id]};
}
function list(save,at=Date.now(),moveCap=36){
 const kitchen=ensure(save);
 return RECIPES.map(r=>Object.freeze({
  ...r,stored:kitchen.meals[r.id],
  ingredients:r.ingredients.map(x=>({item:x.item,quantity:x.quantity,owned:save.town.harvest[x.item]})),
  cook:checkCook(save,r.id),serve:kitchen.meals[r.id]?checkServe(save,r.id,at,moveCap):reason('stock')
 }));
}
const api=Object.freeze({RECIPES,BY_ID,ensure,stock,checkCook,cook,checkServe,serve,list,MAX,MAX_BATCH});
root.RupeeKitchen=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
