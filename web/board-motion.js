/* Embryon board choreography. Visual state follows the deterministic engine's
   staged snapshots; no match rules, resources or saves are modified here. */
(function(root){'use strict';
const pause=ms=>new Promise(done=>(root.setTimeout||setTimeout)(done,ms));
const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
function planCascade(stage){
 const removed=[],damaged=[];
 if(!stage||!Array.isArray(stage.before)||!Array.isArray(stage.afterClear))return {removed,damaged};
 for(let i=0;i<stage.before.length;i++){
  const a=stage.before[i],b=stage.afterClear[i];
  if(!a||!b)continue;
  if(a.type!==null&&b.type===null)removed.push(i);
  else if(['ice','lock','chest','jam','rock','fuse'].some(k=>(a[k]||0)>(b[k]||0)))damaged.push(i);
 }
 return {removed,damaged};
}
function transition(node,frames,opts){
 if(typeof node?.animate!=='function')return null;
 try{
  const anim=node.animate(frames,opts);
  return Promise.resolve(anim.finished).catch(()=>{}).then(()=>{try{anim.cancel();}catch(_){}});
 }catch(_){return null;}
}
async function resolve(options){
 const {board,before,after,result,paint,sprite,effect,sound}=options;
 const current=()=>options.current?.()!==false;
 if(!board?.querySelector||!board?.getBoundingClientRect){
  sound?.('swap',0);
  paint?.(after);
  return;
 }
 const still=reduced();
 const tile=i=>board.querySelector('[data-cell="'+i+'"]');
 const payload=i=>tile(i)?.querySelector('.gem-payload');
 const phantoms=[];
 const cleanup=()=>{for(const node of phantoms)try{node.remove();}catch(_){}phantoms.length=0;};
 function flash(i,kind){
  if(still||!current())return;
  const cell=tile(i),url=effect?.(kind);
  if(!cell||!url||!root.document?.createElement)return;
  const img=root.document.createElement('img');img.className='gem-impact';img.src=url;img.alt='';
  img.setAttribute('aria-hidden','true');cell.appendChild(img);
  phantoms.push(img);
  (root.setTimeout||setTimeout)(()=>{img.remove();const at=phantoms.indexOf(img);if(at>=0)phantoms.splice(at,1);},620);
 }
 async function swap(pair){
  if(!Array.isArray(pair)||pair.length!==2)return;
  sound?.('swap',0);
  if(still)return;
  const a=tile(pair[0]),b=tile(pair[1]),left=payload(pair[0]),right=payload(pair[1]);
  if(!a||!b||!left||!right)return;
  const x=a.getBoundingClientRect(),y=b.getBoundingClientRect(),dx=y.left-x.left,dy=y.top-x.top;
  const opts={duration:225,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'};
  const p=transition(left,[{transform:'translate(0,0)'},{transform:'translate('+dx+'px,'+dy+'px)'}],opts);
  const q=transition(right,[{transform:'translate(0,0)'},{transform:'translate('+-dx+'px,'+-dy+'px)'}],opts);
  if(p||q)await Promise.all([p,q].filter(Boolean));
  else await pause(175);
 }
 async function moveSprites(entries,mode){
  if(still||!entries?.length)return;
  const box=board.getBoundingClientRect(),pending=[],hidden=[];
  for(const move of entries){
   const dest=tile(move.to);if(!dest||move.type===null)continue;
   const to=dest.getBoundingClientRect(),from=move.from>=0?tile(move.from)?.getBoundingClientRect():null;
   const ghost=root.document?.createElement?.('span');if(!ghost)continue;
   ghost.className='flying-gem';ghost.style.left=(to.left-box.left)+'px';ghost.style.top=(to.top-box.top)+'px';
   ghost.style.width=to.width+'px';ghost.style.height=to.height+'px';
   ghost.innerHTML=sprite(move);board.appendChild(ghost);phantoms.push(ghost);
   const dx=from?from.left-to.left:0;
   const dy=from?from.top-to.top:(move.startRow-Math.floor(move.to/(options.width||1)))*(to.height+3);
   const time=mode==='portal'?450:Math.min(750,330+Math.abs(dy)*.45);
   const frames=mode==='portal'?
    [{opacity:1,transform:'translate('+dx+'px,'+dy+'px) scale(1)'},
     {opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(.45)',offset:.48},
     {opacity:0,transform:'scale(.45)',offset:.52},{opacity:1,transform:'scale(1)'}]:
    [{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0,0)'}];
   const animation=transition(ghost,frames,{duration:time,easing:'cubic-bezier(.2,.65,.2,1)',fill:'forwards'});
   if(animation)pending.push(animation);
   const target=payload(move.to);if(target){target.style.visibility='hidden';hidden.push(target);}
  }
  if(pending.length)await Promise.all(pending);
  // There is no Web Animations support on older WebViews: finish visibly.
  cleanup();
  hidden.forEach(node=>{node.style.visibility='';});
 }
 async function cascade(stage,wave){
  paint(stage.before);
  const hits=planCascade(stage),count=hits.removed.length;
  sound?.(wave>1?'cascade':'match',count);
  const tiles=hits.removed.map(tile).filter(Boolean);
  if(!still){
   tiles.forEach(x=>x.classList.add('gem-shaking'));
   await pause(145);
   if(!current())return;
   tiles.forEach(x=>x.classList.remove('gem-shaking'));
   hits.removed.forEach(i=>flash(i,wave>1?'cascade':'match'));
   hits.damaged.forEach(i=>flash(i,'frostbreaker'));
   tiles.forEach(x=>x.classList.add('gem-clearing'));
   await pause(185);
   tiles.forEach(x=>x.classList.remove('gem-clearing'));
  }
  if(!current())return;
  paint(stage.afterClear||stage.cells);
  // Pieces move over permanent board cells; tile-affixed statuses never move.
  paint(stage.cells);
  await moveSprites(stage.falls||[],null);
 }
 async function special(stage){
  if(stage.kind==='repair'){
   sound?.('shuffle',0);
   if(!still){board.classList.add('gem-shuffling');await pause(170);board.classList.remove('gem-shuffling');}
   paint(stage.cells);
  }else if(stage.kind==='transport'){
   sound?.('transport',0);
   paint(stage.before);
   const moves=(stage.transfers||[]).map(t=>({...t,type:t.type}));
   paint(stage.cells);
   await moveSprites(moves,stage.mode);
  }else if(stage.kind==='aura'){
   paint(stage.before);
   for(const x of stage.expired||[])flash(x.at,'cascade');
   sound?.('hazard',0);
   if(!still)await pause(190);
   paint(stage.cells);
   await moveSprites(stage.falls||[],null);
  }else{
   if((stage.spread||[]).length||(stage.expired||[]).length) sound?.('hazard',0);
   for(const i of [...(stage.spread||[]),...(stage.expired||[])])flash(i,'cascade');
   paint(stage.cells);
  }
 }
 try{
  paint(before);
  await swap(result.swap);
  if(!current())return;
  const stages=result.stages||[];
  if(!stages.length){paint(after);return;}
  let wave=0;
  for(const stage of stages){
   if(!current())return;
   if(stage.kind==='cascade')await cascade(stage,++wave);
   else await special(stage);
  }
 }finally{
  cleanup();
  if(current())paint(after);
 }
}
const api=Object.freeze({resolve,planCascade});
root.RupeeBoardMotion=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
