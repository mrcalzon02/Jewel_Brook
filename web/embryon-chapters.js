/* Five presentation chapters; retain ten 100-level difficulty bands internally. */
(function(root){'use strict';
const BASE='art/embryon/locations/chapters/';
const MAP='art/embryon/locations/embryon-chapter-overview.webp';
const CHAPTERS=Object.freeze([
 Object.freeze({id:1,key:'goblin-caves',title:'Goblin Caves',description:'Timber shafts and crystal prospectors',start:1,end:200,art:BASE+'01-goblin-caves.webp',x:18,y:16}),
 Object.freeze({id:2,key:'troll-caverns',title:'Troll Caverns',description:'Stone gates, spiked barricades, heavy bridges',start:201,end:400,art:BASE+'02-troll-caverns.webp',x:48,y:16}),
 Object.freeze({id:3,key:'sulfur-sumps',title:'Sulfur Sumps',description:'Fuming pumps, unstable crossings, yellow mineral pools',start:401,end:600,art:BASE+'03-sulfur-sumps.webp',x:79,y:16}),
 Object.freeze({id:4,key:'mushroom-mire',title:'Mushroom Mire',description:'Bioluminescent fungi and sinking walkways',start:601,end:800,art:BASE+'04-mushroom-mire.webp',x:20,y:61}),
 Object.freeze({id:5,key:'ghost-mines',title:'Ghost Mines',description:'Abandoned rails, spectral lanterns, haunted vaults',start:801,end:1000,art:BASE+'05-ghost-mines.webp',x:76,y:61}),
 ]);
function forLevel(level){const n=Math.trunc(Number(level));if(!(n>=1&&n<=1000))return null;return CHAPTERS[Math.floor((n-1)/200)];}
function byId(id){return CHAPTERS.find(c=>c.id===Number(id))||null;}
const api=Object.freeze({CHAPTERS,MAP,forLevel,byId});
root.RupeeChapters=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
