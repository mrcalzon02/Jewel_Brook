/* Jewel Brook: offline world reference and chronology; no new save state. */
(function(root){'use strict';
const CALENDAR=Object.freeze({
 name:'Elaranth calendar',months:13,
 monthNames:null,monthLengths:null,epochYear:null,epochMonth:null,epochDay:null,
 status:'awaiting-canon-anchor'
});
const WIKI_URL='https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/EMBRYON_WORLD_WIKI.md';
function mainDay(level){
 if(!Number.isInteger(level)||level<1||level>1000)return null;
 return Object.freeze({level,day:level,label:'Campaign Day '+level,
  calendarDate:null,calendarStatus:CALENDAR.status,
  storyRule:'Finishing this level advances the player and royal family to the same day.'});
}
function trialDay(id,Trials){
 const spec=Trials?.profile(id);
 if(!spec)return null;
 return Object.freeze({trial:id,day:null,earliestMainDay:spec.requiredMainLevel,
  label:'Optional trial '+id,calendarDate:null,
  note:'Available no earlier than Campaign Day '+spec.requiredMainLevel+
  '; the day it is attempted is not fixed by its unlock milestone.'});
}
const TABS=Object.freeze([
 Object.freeze({id:'calendar',title:'Calendar'}),
 Object.freeze({id:'world',title:'World'}),
 Object.freeze({id:'gems',title:'Gems & Stones'}),
 Object.freeze({id:'crops',title:'Foods & Crops'}),
 Object.freeze({id:'dishes',title:'Cooking'}),
 Object.freeze({id:'tools',title:'Tools'}),
 Object.freeze({id:'story',title:'Royal Chronicle'})
]);
function catalog(tab,systems,save){
 const {E,Garden,Cook,G,Royal,Chapters}=systems;
 switch(tab){
 case 'world':return [
  {name:'Elaranth',detail:'The nation whose thirteen-month calendar provides the chronology shared by Jewel Brook and the royal stories.'},
  {name:'Embryon',detail:'The kingdom where gem prospectors, growers, cooks, merchants, craftspeople, and the royal household form one living economy.'},
  ...Chapters.CHAPTERS.map(c=>({name:c.title,detail:'Expedition chapter '+c.id+' · stages '+c.start+'–'+c.end+' · '+c.description}))
 ];
 case 'gems':return E.TYPES.filter(n=>!E.RETIRED_NUTS.includes(n)).map(name=>{
  const arrival=E.NEW_INTRODUCTIONS.find(x=>x.name===name);
  return {name:name[0].toUpperCase()+name.slice(1),detail:arrival?'First added to the campaign at stage '+arrival.level+'.':'An established gemstone type in the original campaign roster.'};
 });
 case 'crops':return Object.values(Garden.CROPS).map(c=>({
  name:c.name,detail:'Category: '+c.category+' · residence tier '+c.house+
   ' · '+c.yield+' harvested per crop · '+c.growMs/60000+' real-time growth minutes.'
 }));
 case 'dishes':return Cook.RECIPES.map(c=>({
  name:c.name,detail:'Kitchen residence tier '+c.house+' · '+c.ingredients.map(i=>(Garden.CROPS[i.item]?.name||i.item)+' ×'+i.quantity).join(', ')+
  ' · prepared servings support '+c.reward.kind+'.'
 }));
 case 'tools':return [
  ...G.ART.pickaxe.map((t,i)=>({name:'Pickaxe '+(i+1)+': '+t.name.replace(/-/g,' '),detail:'Existing mining equipment tier '+i+' · strike capacity '+G.dailyLimit('pickaxe',i)})),
  ...G.ART.gloves.map((t,i)=>({name:'Gloves '+(i+1)+': '+t.name.replace(/-/g,' '),detail:'Existing survey equipment tier '+i+' · scan capacity '+G.dailyLimit('gloves',i)})),
  ...E.BOOSTERS.map(id=>({name:E.BOOSTER_META[id]?.label||id,detail:E.BOOSTER_META[id]?.tip||'Campaign booster.'}))
 ];
 case 'story':return Royal.EVENTS.filter(e=>e.revealLevel<=1000&&Royal.unlocked(save,e)).map(e=>({
  name:e.title,detail:'Campaign Day '+e.historicalDay+' (Level '+e.revealLevel+'). '+e.summary+' '+e.tradeNote+
  ' The full Elaranth calendar date is not yet resolved.'
 }));
 default:return [];
 }
}
const api=Object.freeze({CALENDAR,WIKI_URL,TABS,mainDay,trialDay,catalog});
root.JewelBrookWorldGuide=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
