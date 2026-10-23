/* Curated cross-game visual assets: independent of Nut Buster pieces and economy IDs.
   "Overlay" is a tile status, not another gemstone or a whole-piece identity. */
(function(root){'use strict';
const overlayNames=Object.freeze(['arcane','bomb','chain-lock','crystal','fire','frost','lightning','magma',
 'nature-vines','poison','radiance','shadow','sticky-butter','storm','void-rock','water']);
const overlaySet=new Set(overlayNames);
const tileOverlay=id=>overlaySet.has(id)?'art/primary/overlays/'+id+'.png':null;
const blocker=Object.freeze({
 ice1:'art/primary/blockers/ice-1.png',ice2:'art/primary/blockers/ice-2.png',
 chest:'art/primary/blockers/chest.png',crate:'art/primary/blockers/crate.png',
 lock:'art/primary/blockers/lock.png',rock:'art/primary/blockers/rock.png'
});
// Visually inspected: no walnut/acorn inside these assets. All other icons use
// the unique, original procedural Embryon vectors until art production approves them.
const icons=Object.freeze({
 heart:'art/additions/economy/energy-heart.png',
 extra:'art/additions/economy/hourglass.png',
 hammer:'art/primary/powerups/hammer.png',
 unlock:'art/additions/effects/chain-break.png',
 starburst:'art/additions/effects/sparkle-burst.png',
 frostbreaker:'art/additions/effects/ice-shatter.png'
});
function layers(c){
 if(!c||c.type===null)return [];
 const result=[];
 const add=(id,description,count=0)=>{const src=tileOverlay(id);if(src)result.push({id,src,description,count:Math.max(0,Math.trunc(Number(count)||0))});};
 if(c.ice>0)add('frost','Ice layers',c.ice);
 if(c.lock>0)add('chain-lock','Chain lock layers',c.lock);
 if(c.jam>0)add('sticky-butter','Crystal resin layers',c.jam);
 if(c.fuse>0)add('bomb','Bomb countdown',c.fuse);
 if(c.rock>0)add('void-rock','Stone seal layers',c.rock);
 if(c.frozen>0)add('frost','Frozen turns',c.frozen);
 if(c.poison>0)add('poison','Poison turns',c.poison);
 if(c.ward>0)add('shadow','Shield turns',c.ward);
 if(typeof c.aura==='string'&&overlaySet.has(c.aura))add(c.aura,'Elemental '+c.aura+' aura',c.auraTurns||0);
 return result;
}
function anchor(c){
 if(!c||c.type===null)return null;
 if(c.chest>0)return {src:blocker.chest,label:'Treasure chest',count:c.chest};
 if(c.lock>0)return {src:blocker.lock,label:'Chain anchor',count:c.lock};
 if(c.ice>0)return {src:c.ice>1?blocker.ice2:blocker.ice1,label:'Ice anchor',count:c.ice};
 if(c.rock>0)return {src:blocker.rock,label:'Stone seal',count:c.rock};
 return null;
}
function label(c){
 const desc=layers(c).map(s=>s.description+' '+s.count);
 const fixed=anchor(c);if(fixed&&!desc.some(x=>x.includes(fixed.label)))desc.push(fixed.label+' '+fixed.count);
 if(c?.special)desc.push('Special '+c.special);
 if(c?.elemental)desc.push('Elemental '+c.elemental+' gemstone');
 return desc.join(', ');
}
const api=Object.freeze({overlayNames,tileOverlay,blocker,icons,layers,anchor,label});
root.RupeeSharedArt=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
