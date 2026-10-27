/* Rupee Rush farm-to-kitchen presentation contract. No crafting, costs or rewards
 * are enabled here. Existing Town harvest IDs remain the save authority.
 */
(function(root){'use strict';
const Farm=root.RupeeTownGarden,Art=root.RupeeFarmingArt;
if(!Farm||!Art)throw Error('Town garden and refined farming art must load before kitchen catalog');
const FAMILIES=Object.freeze({"roots":"crop","greens":"vegetable","grains":"grain","fruits":"fruit","herbs":"herb","flowers":"flower","exotics":"specialty","orchard":"fruit"});
const ACTIVE=Object.freeze(Object.values(Farm.CROPS).map(c=>Object.freeze({id:c.id,name:c.name,source:'town.harvest.'+c.id,artId:c.artId||c.id,family:FAMILIES[c.category]||'crop'})));
const FUTURE=Object.freeze({animal:['milk','eggs','honey'],pantry:['flour','sugar','butter','cheese','bread','jam','pickles','juice']});
const future=[];
for(const [family,ids] of Object.entries(FUTURE))for(const id of ids){
 const art=Art.goods(id);
 if(!art)throw Error('Missing reserved kitchen ingredient art: '+id);
 future.push(Object.freeze({id,name:id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),family,source:null,art,available:false}));
}
const FUTURE_ITEMS=Object.freeze(future);
const ITEMS=Object.freeze(Object.fromEntries([
 ...ACTIVE.map(item=>[item.id,Object.freeze({...item,art:Art.harvest(item.id),available:true})]),
 ...FUTURE_ITEMS.map(item=>[item.id,item])
]));
const recipe=(id,name,output,ingredients)=>Object.freeze({id,name,output,ingredients:Object.freeze(ingredients.map(([item,quantity])=>Object.freeze({item,quantity}))),status:'preview-only',craftable:false});
const RECIPES=Object.freeze([
 recipe('berry-preserves','Bluebell Preserves','jam',[['berry',2],['sugar',1]]),
 recipe('garden-stew','Garden Vegetable Stew','carrot',[['carrot',2],['potato',1],['onion',1]]),
 recipe('harvest-loaf','Harvest Loaf','bread',[['wheat',2],['flour',1],['eggs',1]]),
 recipe('honey-toast','Golden Honey Toast','bread',[['wheat',1],['honey',1],['butter',1]])
]);
function count(save,id){
 if(!Object.hasOwn(Farm.CROPS,id))return 0;
 const value=save?.town?.harvest?.[id];
 return Number.isSafeInteger(value)&&value>=0?Math.min(1_000_000_000,value):0;
}
function pantry(save){return ACTIVE.map(x=>Object.freeze({...ITEMS[x.id],quantity:count(save,x.id)}));}
const get=id=>Object.hasOwn(ITEMS,id)?ITEMS[id]:null;
const image=id=>get(id)?.art||Art.goods(id)||null;
const api=Object.freeze({ACTIVE,FUTURE_ITEMS,ITEMS,RECIPES,get,image,pantry,count});
root.RupeeKitchenCatalog=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
