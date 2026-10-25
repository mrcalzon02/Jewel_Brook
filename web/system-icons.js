/* The two user-approved four-by-four Rupee Rush system-icon runs.
   Immutable presentation lookup: never substitute arbitrary gameplay artwork. */
(function(root){'use strict';
const navigation=Object.freeze(['home','levels','mine','shop','rewards','settings','back','close','confirm','info','warning','locked','rupee','star-gems','heart','daily-moves']);
const gameplay=Object.freeze(['match','cascade','objective','shuffle','combo','victory','defeat','bomb','frozen','poison','ward','portal','conveyor-left','conveyor-right','wind-up','wind-down']);
const prefix='art/embryon/system-icons/';
const mapping={};
for(const id of navigation)mapping[id]=prefix+'navigation-economy/'+id+'.webp';
for(const id of gameplay)mapping[id]=prefix+'gameplay-hazards/'+id+'.webp';
const aliases=Object.freeze({campaign:'levels',gift:'rewards',gear:'settings',extra:'daily-moves',crystal:'star-gems',gem:'star-gems',scan:'objective',lock:'locked',alert:'warning'});
const icons=Object.freeze(mapping);
const get=id=>icons[aliases[id]||id]||null;
const api=Object.freeze({icons,get,navigation,gameplay});
root.RupeeSystemIcons=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
