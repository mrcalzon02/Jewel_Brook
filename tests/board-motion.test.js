'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../web/engine.js');
const source=fs.readFileSync(path.join(__dirname,'../web/board-motion.js'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
assert(html.indexOf('board-motion.js')>0&&html.indexOf('board-motion.js')<html.indexOf('game.js'));
assert(game.includes('Motion.resolve('),'engine result is handed to staged renderer');
assert(game.includes('performSwap(start.i,to)'),'swipe gesture feeds same swap path');
assert(game.includes("if(!b||b.disabled||animating"),'inputs locked during movement');
assert(css.includes('.flying-gem')&&css.includes('.gem-shaking')&&css.includes('.gem-special'));
const log=[],state={motion:false};
function node(rect){
 return {
  style:{},children:[],classList:{add(x){log.push('add:'+x);},remove(x){log.push('remove:'+x);}},
  dataset:{},rect,removed:false,innerHTML:'',
  setAttribute(){},
  querySelector(q){return q==='.gem-payload'?this.payload:null;},
  getBoundingClientRect(){return rect;},appendChild(el){this.children.push(el);},
  remove(){this.removed=true;},
  animate(frames,options){state.motion=true;log.push('animate:'+options.duration);return {finished:Promise.resolve(),cancel(){}};}
 };
}
const tiles=[node({left:0,top:0,width:50,height:50}),node({left:54,top:0,width:50,height:50}),node({left:108,top:0,width:50,height:50})];
tiles.forEach(t=>{t.payload=node(t.rect);});
const board=node({left:0,top:0,width:162,height:50});
board.querySelector=q=>{const id=Number((q.match(/\[data-cell="(\d+)"\]/)||[])[1]);return Number.isInteger(id)?tiles[id]:null;};
const root={
 document:{createElement:()=>node({left:0,top:0,width:50,height:50})},
 setTimeout:fn=>{fn();return 1;},matchMedia:()=>({matches:false})
};
vm.runInNewContext(source,{window:root,Promise,Array,Math,setTimeout:root.setTimeout});
const Motion=root.RupeeBoardMotion;
const c=type=>({type,ice:0,lock:0,chest:0,jam:0,rock:0,fuse:0});
const before=[c(0),c(1),c(2)],clear=[c(0),c(null),c(2)],after=[c(0),c(0),c(2)];
const stage={kind:'cascade',before,afterClear:clear,cells:after,clear:[1],falls:[{from:0,to:1,type:0,startRow:-1}]};
assert.deepEqual(Array.from(Motion.planCascade(stage).removed),[1]);
const stages=[],sounds=[];
(async()=>{
 await Motion.resolve({board,before,after,result:{swap:[0,1],stages:[stage]},width:3,
  paint:cells=>stages.push(cells),sprite:move=>'<span class="gem-payload">'+move.type+'</span>',
  effect:()=>null,sound:(kind,count)=>sounds.push([kind,count]),current:()=>true});
 assert.equal(stages[0],before);
 assert.equal(stages.at(-1),after);
 assert(stages.includes(clear),'post-clear snapshot visibly presented');
 assert(state.motion,'Web Animations used for swaps and falls');
 assert(sounds.some(([name])=>name==='swap'));
 assert(sounds.some(([name,count])=>name==='match'&&count===1));
 assert(board.children.some(x=>x.removed),'flying sprite is cleaned up');
 const save=E.create(1,7919),start=E.snapshot(save);
 let chosen=null;
 for(let i=0;i<save.cells.length&&!chosen;i++)for(let j=0;j<save.cells.length;j++){
  if(E.adjacent(save,i,j)){chosen=[i,j];break;}
 }
 const result=E.swap(save,...chosen);
 assert(result.valid);
 assert(Array.isArray(result.stages),'engine still supplies stage-based choreography');
 assert(start.cells.length===save.cells.length,'board dimensions remain unchanged');
 console.log('PASS Rupee board motion: stage planning, persistent tiles, swaps, falls, audio events, gesture wiring');
})().catch(e=>{console.error(e);process.exitCode=1;});
