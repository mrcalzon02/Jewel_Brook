'use strict';
// Deterministic source for standalone transparent 40-tier SVG illustrated previews.
// Not the approved final painted master set. Do not modify the garden's save semantics.
const fs=require('node:fs'),path=require('node:path');
function drawHouse(level){
 const n=Number(level);
 if(!Number.isSafeInteger(n)||n<1||n>40)throw RangeError('house level must be an integer 1–40');
 const band=Math.floor((n-1)/10),stage=(n-1)%10+1;
 const pal=[
  {wall:'#b58962',side:'#835e4e',roof:'#d0ab55',dark:'#715034',trim:'#edd2a0',blue:'#7094cb',glass:'#a5d1dc',metal:'#d2ac73'},
  {wall:'#e2caaa',side:'#b1a18e',roof:'#426da4',dark:'#294977',trim:'#fff0ce',blue:'#597fba',glass:'#80c7e7',metal:'#ddbd78'},
  {wall:'#dfd0be',side:'#9c9f9e',roof:'#3a68a3',dark:'#29416d',trim:'#fff0d9',blue:'#678ec9',glass:'#8fd7ee',metal:'#e8c580'},
  {wall:'#f1e7d5',side:'#aebfc6',roof:'#3663a2',dark:'#283b73',trim:'#fffef0',blue:'#638fd9',glass:'#a6ecff',metal:'#f3d88e'}
 ][band];
 const rise=[0,23,53,77][band];
 const h=(v)=>v-rise;
 const el=[];
 const add=(str)=>{el.push(str)};
 const w=(x,y,width=28,height=37)=>`<g><path d="M${x} ${y} l${width} -9 v${height} l-${width} 9 Z" fill="url(#glass)" stroke="${pal.trim}" stroke-width="5"/><path d="M${x+width/2} ${y-5}v${height+3}" stroke="${pal.metal}" stroke-width="2.5"/><path d="M${x} ${y+height/2}l${width} -9" stroke="${pal.metal}" stroke-width="2"/></g>`;
 add(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 -56 480 516" fill="none" role="img" aria-label="Embryon house level ${n}"><defs>
 <linearGradient id="wall" x1="0" x2=".9" y1="0" y2=".7"><stop stop-color="${pal.trim}"/><stop offset=".34" stop-color="${pal.wall}"/><stop offset="1" stop-color="${pal.side}"/></linearGradient>
 <linearGradient id="roof" x1=".1" x2="1" y1="0" y2=".8"><stop stop-color="${pal.roof}"/><stop offset=".55" stop-color="${pal.roof}"/><stop offset="1" stop-color="${pal.dark}"/></linearGradient>
 <linearGradient id="glass" x1=".2" x2=".9" y1="0" y2="1"><stop stop-color="#e4fcfc"/><stop offset=".5" stop-color="${pal.glass}"/><stop offset="1" stop-color="#46658e"/></linearGradient>
 <linearGradient id="door" x1="0" x2="1"><stop stop-color="#684532"/><stop offset=".48" stop-color="#b78753"/><stop offset="1" stop-color="#5e402d"/></linearGradient>
 <linearGradient id="stone" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff0d3"/><stop offset="1" stop-color="#8c817e"/></linearGradient>
 <filter id="glow"><feGaussianBlur stdDeviation="3"/></filter></defs>`);
 // The alpha-canvas contains only the building and its own contact shadow, not a fixed yard or garden beds.
 add(`<g transform="translate(47 0) scale(.92 1)">`);add(`<ellipse cx="239" cy="385" rx="170" ry="18" fill="#1a1a2b" opacity=".16"/>`);
 if(band>=2){
  add(`<path d="M63 ${h(235)} 99 ${h(225)} 99 320 63 304Z" fill="${pal.wall}" stroke="${pal.trim}" stroke-width="5"/>`);
  add(`<path d="M50 ${h(240)} 87 ${h(171)} 117 ${h(217)} 100 ${h(235)}Z" fill="url(#roof)" stroke="${pal.dark}" stroke-width="6" stroke-linejoin="round"/>`);
 }
 if(band>=3){
  add(`<path d="M375 ${h(214)} 431 ${h(194)} 431 295 375 314Z" fill="${pal.side}" stroke="${pal.trim}" stroke-width="6"/>`);
  add(`<path d="M367 ${h(218)} 393 ${h(146)} 447 ${h(208)} 432 ${h(225)}Z" fill="url(#roof)" stroke="${pal.dark}" stroke-width="6"/>`);
 }
 add(`<path d="M94 312 241 355 386 304 386 325 241 378 94 335Z" fill="url(#stone)" stroke="#716f77" stroke-width="6"/>`);
 add(`<path d="M106 ${h(183)} 240 ${h(228)} 240 346 106 305Z" fill="url(#wall)" stroke="${pal.dark}" stroke-width="7" stroke-linejoin="round"/>`);
 add(`<path d="M240 ${h(228)} 371 ${h(179)} 371 301 240 346Z" fill="${pal.side}" stroke="${pal.dark}" stroke-width="7" stroke-linejoin="round"/>`);
 // Consistent timber or stonework hints; later houses add real masonry rather than a palace silhouette at tier 10.
 if(band===0){
  for(let i=0;i<6;i++){const x=120+i*21;add(`<path d="M${x} ${h(209)+i*6}v98" stroke="#76533b" stroke-width="${stage>=3?3:5}" opacity=".6"/>`)}
  add(`<path d="M107 ${h(192)} 239 ${h(231)} 239 ${h(244)} 107 ${h(204)}Z" fill="#7b6345" opacity=".65"/>`);
 }else{
  for(let i=0;i<7;i++){const y=235+i*15-rise;add(`<path d="M107 ${y} 240 ${y+42}" stroke="${band===1?'#f4daba':'#f9ece0'}" stroke-width="1.6" opacity=".45"/>`)}
  if(band>=2) for(let i=0;i<5;i++)add(`<path d="M242 ${h(233)+i*21} 367 ${h(188)+i*21}" stroke="#f8e8cd" stroke-width="2" opacity=".42"/>`);
 }
 // Windows, door, stair remain aligned at every residence level.
 add(`<path d="M191 337v-81q0-17 18-20 19-3 19 16v94Z" fill="url(#door)" stroke="${pal.trim}" stroke-width="${band>=2?8:5}"/>`);
 add(`<path d="M197 335v-73q0-12 11-14" stroke="#ffdf9a" stroke-width="3" opacity=".5"/>`);
 add(`<circle cx="217" cy="299" r="4" fill="${pal.metal}" stroke="#734c27" stroke-width="1.4"/>`);
 add(`<path d="M196 349 243 361 270 352 237 340Z" fill="#b6a492" stroke="#f3dec6" stroke-width="3"/>`);
 add(w(295,h(220),40,42));
 add(`<path d="M137 ${h(229)} 173 ${h(241)} 173 ${h(282)} 137 ${h(270)}Z" fill="url(#glass)" stroke="${pal.trim}" stroke-width="5"/>`);
 add(`<path d="M155 ${h(235)}v39M137 ${h(250)}l36 12" stroke="${pal.metal}" stroke-width="2.5"/>`);
 // Incremental house-building: repaired shutters, stone step, chimney, shingle coverage and porch.
 if(stage>=2||band>0)add(`<path d="M128 ${h(229)}l8-3v44l-8-3Z" fill="#765237" stroke="#e7be83" stroke-width="2"/>`);
 if(stage>=3||band>0)add(`<path d="M174 ${h(246)} 191 ${h(250)}v91l-17-4Z" fill="${pal.trim}" opacity=".75"/>`);
 if(stage>=4||band>0){
  add(`<path d="M321 ${h(114)}v-42l33-9v66Z" fill="#b2a097" stroke="#675f66" stroke-width="5"/>`);
  add(`<path d="M316 ${h(73)}l35-10 10 5-35 11Z" fill="#d3bcb1" stroke="#766b70" stroke-width="4"/>`);
 }
 // Roof geometry is shared by all forty, preserving camera, contact shadow and door anchor.
 add(`<path d="M91 ${h(181)} 170 ${h(108)} 242 ${h(220)} 106 ${h(199)}Z" fill="url(#roof)" stroke="${pal.dark}" stroke-width="7" stroke-linejoin="round"/>`);
 add(`<path d="M170 ${h(108)} 313 ${h(68)} 384 ${h(165)} 242 ${h(220)}Z" fill="url(#roof)" stroke="${pal.dark}" stroke-width="8" stroke-linejoin="round"/>`);
 add(`<path d="M91 ${h(181)} 170 ${h(108)} 313 ${h(68)}" stroke="${pal.trim}" stroke-width="7" stroke-linecap="round"/>`);
 const tiles=band>0||stage>=5;
 for(let row=0;row<5;row++){
  const x1=182+row*12,y1=h(118)+row*18,x2=312+row*13,y2=h(81)+row*18;
  add(`<path d="M${x1} ${y1} Q${(x1+x2)/2} ${(y1+y2)/2+7} ${x2} ${y2}" stroke="${tiles?'#b7d7ff':'#ffe0a4'}" stroke-opacity="${tiles?.36:.29}" stroke-width="${tiles?4:5}" stroke-linecap="round" stroke-dasharray="${tiles?'9 8':'16 12'}"/>`);
 }
 if(band===0&&stage<7){
  for(let i=0;i<9;i++)add(`<path d="M${110+i*11} ${h(168)+Math.floor(i/3)*10}l8 10" stroke="#f1ca74" stroke-width="3" stroke-linecap="round"/>`);
 }
 if(stage>=6||band>0)add(`<path d="M91 ${h(181)} 105 ${h(188)}M371 ${h(167)} 384 ${h(165)}" stroke="${pal.metal}" stroke-width="7"/>`);
 if(stage>=7||band>0)add(`<g><path d="M127 ${h(276)}l51 16v10l-51-16Z" fill="#8c6349" stroke="${pal.trim}" stroke-width="3"/><circle cx="141" cy="${h(273)}" r="4" fill="#ffb4c3"/><circle cx="157" cy="${h(279)}" r="5" fill="#8fdba8"/><circle cx="172" cy="${h(282)}" r="4" fill="#f6d98b"/></g>`);
 if(stage>=8||band>0)add(`<path d="M302 ${h(227)}l26-9v18l-26 9Z" fill="#a0ecfa" opacity=".25"/>`);
 if(stage>=9||band>0)add(`<path d="M181 ${h(246)}l60 17 39-13M183 ${h(253)}l59 16" stroke="${pal.trim}" stroke-width="6" stroke-linecap="round"/>`);
 if(stage>=10||band>0)add(`<path d="M118 ${h(211)}l18-15 21 7M243 ${h(220)}l31-12" stroke="${pal.metal}" stroke-width="4" stroke-linecap="round"/>`);
 // Cottage-only advancements. Greenhouse is an exterior addition, never a baked grow-bed.
 if(band>=1){
  add(`<path d="M372 278 420 259 441 266 441 316 373 335Z" fill="#9fd2d5" fill-opacity=".28" stroke="#d2e5d6" stroke-width="5"/>`);
  add(`<path d="M369 276 399 234 443 263 418 269Z" fill="#79c6d8" fill-opacity=".62" stroke="${pal.trim}" stroke-width="4"/>`);
  if(stage>=3)add(`<path d="M396 242v82M374 295l63-19" stroke="${pal.trim}" stroke-width="3"/>`);
  if(stage>=5)add(`<path d="M120 ${h(190)}l35-30" stroke="${pal.metal}" stroke-width="4"/>`);
  if(stage>=7)add(`<path d="M362 ${h(250)}q25-13 34 0" stroke="#e9e0b2" stroke-width="4"/>`);
  if(stage>=9)add(`<path d="M258 340q20 12 40-3" stroke="${pal.trim}" stroke-width="5"/>`);
 }
 if(band>=2){
  add(`<path d="M133 ${h(201)}h83" stroke="${pal.trim}" stroke-width="7" stroke-linecap="round"/>`);
  add(w(272,h(175),30,28));
  if(stage>=3)add(`<path d="M273 ${h(143)}l23-29 25 29Z" fill="${pal.roof}" stroke="${pal.metal}" stroke-width="5"/>`);
  if(stage>=5)add(`<path d="M100 302l30-7M354 310l26-8" stroke="${pal.metal}" stroke-width="5"/>`);
  if(stage>=7)add(`<path d="M107 ${h(212)} 130 ${h(206)}" stroke="${pal.trim}" stroke-width="8"/>`);
  if(stage>=10)add(`<path d="M62 302l34 8" stroke="${pal.metal}" stroke-width="5"/>`);
 }
 if(band>=3){
  add(`<path d="M115 ${h(168)}l60-49 63 56" stroke="${pal.metal}" stroke-width="6" stroke-linecap="round"/>`);
  add(`<path d="M274 ${h(177)}h73" stroke="${pal.trim}" stroke-width="7"/>`);
  if(stage>=2)add(`<path d="M63 292l32 9M386 288l45-15" stroke="#ece4d2" stroke-width="7"/>`);
  if(stage>=3)add(`<path d="M113 ${h(245)}l50 15v-12" stroke="${pal.metal}" stroke-width="6"/>`);
  if(stage>=4)add(`<path d="M312 ${h(73)}l0-20" stroke="${pal.metal}" stroke-width="4"/><path d="M312 ${h(51)}l-12 10 12 9 12-10Z" fill="#97edff" stroke="#ebf9ff" stroke-width="4"/>`);
  if(stage>=6)add(`<path d="M410 ${h(213)}l0-25M421 ${h(210)}l0-25" stroke="${pal.metal}" stroke-width="4"/>`);
  if(stage>=8)add(`<path d="M408 ${h(197)}l7-15 7 15 9 7-16 13-16-13Z" fill="#85dff2" stroke="#ffffff" stroke-width="3"/>`);
  if(stage>=9)add(`<path d="M118 ${h(156)}v-27l25 9-25 8Z" fill="#667dce" stroke="${pal.metal}" stroke-width="3"/>`);
  if(stage>=10)add(`<path d="M316 ${h(52)}v-15m-14 11 28-8" stroke="${pal.metal}" stroke-width="5"/>`);
 }
 // Individual-level decorative seals signal every improvement, without raster number plaques.
 for(let k=0;k<n;k++){
  const col=k%10,row=Math.floor(k/10);
  const x=118+col*10+row*2,y=328+row*7+Math.floor(col/3)*2;
  add(`<circle cx="${x}" cy="${y}" r="${1.3+row*.35}" fill="${row===3?'#f8e2a7':row===2?'#b3d2f1':row===1?'#87aace':'#a58d66'}" stroke="#fff5ce" stroke-width=".45"/>`);
 }
 add(`</g></svg>`);
 return el.join('');
}
if(require.main===module){
 const out=path.resolve(__dirname,'../web/art/embryon/town/houses/previews');fs.mkdirSync(out,{recursive:true});
 for(let n=1;n<=40;n++)fs.writeFileSync(path.join(out,'house_lv_'+String(n).padStart(2,'0')+'.svg'),drawHouse(n));
 console.log('Regenerated forty house illustrations in '+out);
}
module.exports=Object.freeze({drawHouse});
