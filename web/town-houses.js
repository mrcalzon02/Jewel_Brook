/* Rupee Rush: visual-only house preview resolver; house level never follows campaign/Daysha. */
(function(root){'use strict';
 const BASE='art/embryon/town/houses/previews/';
 const bounded=x=>Number.isSafeInteger(x)&&x>=1?Math.min(40,x):1;
 function house(value){const level=bounded(value);return Object.freeze({level,path:BASE+'house_lv_'+String(level).padStart(2,'0')+'.svg',status:'illustrated_preview',approved:false});}
 function fromSave(save){return house(save&&save.town&&save.town.houseLevel);}
 const api=Object.freeze({house,fromSave,bounded,firstLevel:1,lastLevel:40});root.RupeeTownHouses=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
