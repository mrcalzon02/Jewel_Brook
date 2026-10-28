/* Jewel Brook seasonal farming — game-balanced translation of planting guidance.
 * Canon Elaranth: Thawcall is late winter, Seedwake/Leafrise spring,
 * Sunsreach/Haycrest/Deepdelve summer, Amberfall/Casktide autumn,
 * Frostgate/Longnight/Hearthwane winter. The fictional month indices are
 * deliberately NOT Gregorian dates. Maturity days in real gardening are source
 * context only, never the campaign growth timer (player requested 1..6 missions).
 *
 * Real-world references:
 * https://www.almanac.com/how-plant-fall-vegetable-garden
 * https://www.almanac.com/best-vegetables-fall-garden
 * https://extension.colostate.edu/resource/vegetable-planting-guide/
 * https://extension.wvu.edu/lawn-gardening-pests/gardening/garden-management/succession-planting
 * https://www.ucanr.edu/program/uc-master-gardener-program/time-planting
 * Fantastical/local cultivars have representative season peaks, not invented
 * exact Earth germination figures. This is an in-game temperate climate model.
 */
(function(root){'use strict';
const Calendar=typeof module!=='undefined'&&module.exports?require('./elaranth-calendar.js'):root.JewelBrookElaranthCalendar;
if(!Calendar)throw Error('Elaranth calendar needed for seasonal growth');
const RAW=[["carrot",{"peaks":[2,10],"realWorldMaturityDays":70,"kind":"real-world-analogue"}],["wheat",{"peaks":[5,10],"realWorldMaturityDays":110,"kind":"real-world-analogue"}],["berry",{"peaks":[7,8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["radish",{"peaks":[2,10],"realWorldMaturityDays":30,"kind":"real-world-analogue"}],["lettuce",{"peaks":[3,10],"realWorldMaturityDays":45,"kind":"real-world-analogue"}],["pea",{"peaks":[3,9],"realWorldMaturityDays":65,"kind":"real-world-analogue"}],["mint",{"peaks":[12],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["potato",{"peaks":[4,9],"realWorldMaturityDays":85,"kind":"real-world-analogue"}],["onion",{"peaks":[2,10],"realWorldMaturityDays":95,"kind":"real-world-analogue"}],["spinach",{"peaks":[2,10],"realWorldMaturityDays":50,"kind":"real-world-analogue"}],["beet",{"peaks":[3,9],"realWorldMaturityDays":50,"kind":"real-world-analogue"}],["strawberry",{"peaks":[5,6],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["tomato",{"peaks":[7],"realWorldMaturityDays":80,"kind":"real-world-analogue"}],["cabbage",{"peaks":[3,10],"realWorldMaturityDays":85,"kind":"real-world-analogue"}],["bean",{"peaks":[7],"realWorldMaturityDays":65,"kind":"real-world-analogue"}],["garlic",{"peaks":[10,2],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["corn",{"peaks":[7],"realWorldMaturityDays":80,"kind":"real-world-analogue"}],["pepper",{"peaks":[7],"realWorldMaturityDays":75,"kind":"real-world-analogue"}],["broccoli",{"peaks":[3,10],"realWorldMaturityDays":75,"kind":"real-world-analogue"}],["cucumber",{"peaks":[7],"realWorldMaturityDays":60,"kind":"real-world-analogue"}],["cauliflower",{"peaks":[3,10],"realWorldMaturityDays":80,"kind":"real-world-analogue"}],["kale",{"peaks":[3,11],"realWorldMaturityDays":55,"kind":"real-world-analogue"}],["raspberry",{"peaks":[7,9],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["sunflower",{"peaks":[7],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["zucchini",{"peaks":[7],"realWorldMaturityDays":55,"kind":"real-world-analogue"}],["eggplant",{"peaks":[7],"realWorldMaturityDays":75,"kind":"real-world-analogue"}],["pumpkin",{"peaks":[8],"realWorldMaturityDays":100,"kind":"real-world-analogue"}],["barley",{"peaks":[5,9],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["rice",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["cotton",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["sugarcane",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["herb-bundle",{"peaks":[5,9],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["lavender",{"peaks":[6],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["tea-leaves",{"peaks":[6],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["daisy",{"peaks":[4,9],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["tulip",{"peaks":[3],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["rose",{"peaks":[5,8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["coffee-beans",{"peaks":[7],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["orchid",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["grape",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["melon",{"peaks":[8],"realWorldMaturityDays":85,"kind":"real-world-analogue"}],["watermelon",{"peaks":[8],"realWorldMaturityDays":85,"kind":"real-world-analogue"}],["apple",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["pear",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["peach",{"peaks":[7],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["pineapple",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["dragonfruit",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}],["starfruit",{"peaks":[8],"realWorldMaturityDays":null,"kind":"analogue-season-only"}]];
const SEASONS=Object.freeze([
 Object.freeze({name:'Late winter / thaw',months:[13,1]}),
 Object.freeze({name:'Spring',months:[2,3,4]}),
 Object.freeze({name:'Summer',months:[5,6,7,8]}),
 Object.freeze({name:'Autumn / harvest',months:[9,10]}),
 Object.freeze({name:'Winter',months:[11,12]})
]);
const PROFILES=Object.freeze(Object.fromEntries(RAW.map(([id,v])=>[id,Object.freeze({
 id,peaks:Object.freeze(v.peaks),realWorldMaturityDays:v.realWorldMaturityDays,sourceType:v.kind
})])));
const WORK=60000,MAX_DAYS=6;
function civil(day){return Calendar.civilFromElapsed(day);}
function seasonForDay(day){const d=civil(day);if(!d)return null;return SEASONS.find(s=>s.months.includes(d.month))?.name||null;}
function circularDistance(a,b){const diff=Math.abs(a-b)%364;return Math.min(diff,364-diff);}
function peakDistance(id,day){
 const d=civil(day),profile=PROFILES[id];
 if(!d||!profile)return null;
 const ordinal=(d.month-1)*28+(d.day-1);
 return Math.min(...profile.peaks.map(month=>circularDistance(ordinal,(month-1)*28+13)));
}
function baseDays(id,day){
 const distance=peakDistance(id,day);if(distance===null)return null;
 return Math.max(1,Math.min(MAX_DAYS,1+Math.round(5*distance/182)));
}
function forecast(id,day,fertilizer=null,houseLevel=1){
 const profile=PROFILES[id],d=civil(day);
 if(!profile||!d)return null;
 const days=baseDays(id,day);
 const speedPercent=fertilizer?.speedPercent||100;
 const houseSpeed=1-Math.min(.195,(Math.max(1,Math.min(40,houseLevel))-1)*.005);
 const effectiveDays=Math.max(1,Math.round(days*speedPercent/100*houseSpeed));
 return Object.freeze({crop:id,day,civilDate:d.label,season:seasonForDay(day),
  peakMonths:profile.peaks.map(n=>Calendar.MONTH_NAMES[n-1]),peakDays:profile.peaks,
  baseDays:days,estimatedDays:effectiveDays,realWorldMaturityDays:profile.realWorldMaturityDays,
  sourceType:profile.sourceType,
  status:days===1?'peak':days>=5?'out-of-season':'shoulder'});
}
function workForDay(id,day,fertilizer=null,houseLevel=1){
 const n=baseDays(id,day);if(n===null)return 0;
 const speedPercent=fertilizer?.speedPercent||100;
 const houseSpeed=1-Math.min(.195,(Math.max(1,Math.min(40,houseLevel))-1)*.005);
 return Math.max(1,Math.ceil(WORK/Math.max(1,Math.round(n*speedPercent/100*houseSpeed))));
}
const api=Object.freeze({PROFILES,SEASONS,WORK,MAX_DAYS,seasonForDay,peakDistance,baseDays,forecast,workForDay});
root.JewelBrookCropSeasons=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
