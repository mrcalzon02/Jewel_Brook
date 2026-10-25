/* Rupee Rush: visual-only house preview resolver; house level never follows campaign/Daysha. */
(function(root){'use strict';
 const BASE='art/embryon/town/houses/previews/';
 const NAMES=Object.freeze(["Hawseed Hovel","Dry Roof","First Repairs","Stone Hearth","Blue Shingles","Fenced Yard","Warm Cottage","Bright Windows","Hawseed Garden Cottage","Hawseed Homestead","Garden Cottage","Kitchen Extension","Glazed Porch","Garden Lanterns","Rural Homestead","Working Garden House","Walled Orchard","Half-Glass Conservatory","Cottage Residence","Master Garden House","Prosperous Townhouse","Merchant Awning","Upper Dormer","Pantry House","Sunlit Residence","Conservatory Residence","Carved Balustrades","Merchant Courtyard","Refined Blue Estate","Prosperous Manorlet","Noble Residence","Pearl Gallery","Upper Balconies","Luminous Hall","Noble Gardens","Royal Garden Estate","Silver Roof Manor","Crystal Conservatory","Royal Court Residence","Royal Manor of Embryon"]);
 const bounded=x=>Number.isSafeInteger(x)&&x>=1?Math.min(40,x):1;
 function house(value){const level=bounded(value);return Object.freeze({level,name:NAMES[level-1],path:BASE+'house_lv_'+String(level).padStart(2,'0')+'.svg',status:'illustrated_preview',approved:false});}
 function fromSave(save){return house(save&&save.town&&save.town.houseLevel);}
 const api=Object.freeze({house,fromSave,bounded,firstLevel:1,lastLevel:40,NAMES});root.RupeeTownHouses=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
