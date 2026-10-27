/* Embryon yard art: independent landscape layers for the four house eras. */
(function(root){'use strict';
 const BASE='art/embryon/town/yards/';
 const FILES=Object.freeze(['hawseed-yard.svg','garden-yard.svg','merchant-yard.svg','royal-yard.svg']);
 function bounded(value){return Number.isSafeInteger(value)&&value>=1?Math.min(40,value):1;}
 function yard(level){const n=bounded(level),band=1+Math.floor((n-1)/10);return Object.freeze({level:n,band,path:BASE+FILES[band-1],status:'transparent_landscape_preview',approved:false});}
 function fromSave(save){return yard(save&&save.town&&save.town.houseLevel);}
 const API=Object.freeze({BASE,FILES,yard,fromSave,bounded});
 root.RupeeTownYards=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
