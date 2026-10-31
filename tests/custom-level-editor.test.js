'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js'),C=require('../web/custom-levels.js'),V=require('../web/custom-level-editor.js');
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
storage.setItem('rupeerush.save.v1',JSON.stringify({stars:{499:3},unlocked:499}));
const before=storage.getItem('rupeerush.save.v1');
assert.equal(C.unlocked({stars:{499:3}}),false);assert.equal(C.unlocked({stars:{500:1}}),true);
assert.equal(C.unlocked(JSON.parse(JSON.stringify({stars:{500:1}}))),true);
const original=C.template(),s=V.create(original);let candidate=null;
for(let i=0;i<s.document.cells.length&&!candidate;i++)if(s.document.mask[i])for(let t=0;t<E.TYPES.length;t++){
 if(E.RETIRED_NUTS.includes(E.TYPES[t])||t===s.document.cells[i].type)continue;
 const p=V.create(original);if(!V.paint(p,i,t))continue;
 try{V.validate(p);candidate={i,t};break;}catch(_){}
}
assert.ok(candidate,'A paintable, playable gem change exists');
assert.equal(V.paint(s,candidate.i,candidate.t),true);
assert.deepEqual(s.document.mask,original.mask);
assert.equal(V.undo(s),true);assert.deepEqual(s.document.cells,original.cells);
assert.equal(V.redo(s),true);assert.equal(s.document.cells[candidate.i].type,candidate.t);
assert.equal(V.paint(s,candidate.i,candidate.t),false);
const board=V.boardHtml(s,c=>'<img class="gem" data-gem="'+E.TYPES[c.type]+'">');
assert.match(board,/custom-editor-board/);assert.match(board,/data-action="custom-paint"/);
assert.match(board,new RegExp('data-gem="'+E.TYPES[candidate.t]+'"'));
const hole=original.mask.findIndex(v=>!v);
if(hole>=0){assert.equal(V.paint(s,hole,candidate.t),false);assert.match(board,/custom-editor-cell hole"[^>]*disabled/);}
const valid=V.validate(s);C.saveLevel(storage,valid);
const loaded=C.loadLevel(storage,valid.id);assert.deepEqual(loaded,valid);
const g=C.instantiate(loaded);assert.deepEqual(g.cfg.mask,original.mask);assert.ok(E.hasMove(g));
let swapped=false;for(let i=0;i<g.cells.length&&!swapped;i++)for(const j of [i+1,i+g.cfg.width])if(E.adjacent(g,i,j)){assert.equal(E.swap(g,i,j).valid,true);swapped=true;break;}
assert.ok(swapped,'Edited board plays in the actual match-three engine');
assert.equal(storage.getItem('rupeerush.save.v1'),before);
const invalid=V.create(original);for(let i=0;i<invalid.document.cells.length;i++)if(invalid.document.mask[i])invalid.document.cells[i].type=0;
assert.throws(()=>V.validate(invalid),/three distinct gem|starting board already/);
console.log('PASS custom level visual paint, undo/redo, mask, save/reopen, real-engine playtest and Level 500 unlock');
