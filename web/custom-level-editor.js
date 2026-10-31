/* Real-engine visual gemstone editing for unlocked Jewel Brook custom levels. */
(function(root){'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./custom-levels.js'):root.JewelBrookCustomLevels;
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.RupeeEngine;
const copy=x=>JSON.parse(JSON.stringify(x));
function create(input){return {document:copy(C.normalize(input)),undo:[],redo:[]};}
function paint(s,i,t){
 const d=s.document;
 if(!Number.isInteger(i)||i<0||i>=d.cells.length||!d.mask[i]||!Number.isInteger(t)||t<0||t>=E.TYPES.length||E.RETIRED_NUTS.includes(E.TYPES[t]))return false;
 const before=d.cells[i];if(!before||before.type===t)return false;
 const after={...before,type:t};s.undo.push({i,before:copy(before),after:copy(after)});
 if(s.undo.length>100)s.undo.shift();s.redo.length=0;d.cells[i]=after;return true;
}
function travel(s,from,to,key){const step=from.pop();if(!step)return false;s.document.cells[step.i]=copy(step[key]);to.push(step);return true;}
const undo=s=>travel(s,s.undo,s.redo,'before'),redo=s=>travel(s,s.redo,s.undo,'after');
const encode=s=>JSON.stringify(s.document,null,2),validate=s=>C.normalize(s.document);
function boardHtml(s,render){
 const d=s.document;
 return '<div class="board custom-editor-board" role="group" aria-label="Custom level gem painting grid" style="--columns:'+d.width+'">'+d.cells.map((c,i)=>
  '<button type="button" class="cell custom-editor-cell '+(!d.mask[i]?'hole':'')+'" data-action="custom-paint" data-cell="'+i+'" '+(!d.mask[i]?'disabled':'')+
  ' aria-label="'+(d.mask[i]?'Paint tile '+(i+1)+' '+E.TYPES[c.type]:'Empty masked tile '+(i+1))+'">'+
  (d.mask[i]?render(c,i):'<span class="void"></span>')+'</button>').join('')+'</div>';
}
const api={create,paint,undo,redo,encode,validate,boardHtml};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JewelBrookCustomEditor=api;
})(typeof window!=='undefined'?window:globalThis);
