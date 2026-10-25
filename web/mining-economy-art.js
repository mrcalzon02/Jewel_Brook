/* Exact sprites transferred from NUTBUSTER-R; use neutral variants only. */
(function(root){'use strict';
const BASE='art/nutvale/mining-economy/';
const path=(kind,name)=>BASE+kind+'/'+name+'.png';
function credits(n){return path('currency',n<300?'copper-coins':n<1200?'silver-coins':n<4000?'gold-coins':n<12000?'gold-medallion':n<45000?'rainbow-coins':'rainbow-medallion');}
function goods(tier){return path('goods',['crate-bottles','crate-cloth','crate-mining-supplies','crate-sacks-and-scrolls','crate-golden-luxury'][Math.min(4,Math.max(0,tier|0))]);}
function writs(n){return path('writs',n<1?'blue-writ':n<4?'silver-writ':n<10?'gold-writ':n<20?'royal-blue-writ':'royal-violet-writ');}
const api=Object.freeze({path,credits,goods,writs});
root.RupeeMiningEconomyArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);