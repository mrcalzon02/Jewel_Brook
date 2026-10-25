'use strict';

const fs=require('node:fs'),path=require('node:path');

const BANDS=["hawseed-yard","garden-yard","merchant-yard","royal-yard"];

function drawYard(band){
 if(!Number.isInteger(band)||band<1||band>4)throw RangeError('yard band 1–4');
 const palettes=[
  {grass:'#668752',light:'#b5bc70',edge:'#3f5844',path:'#a38a70',stone:'#c5b59c',petal:'#f6c99d',stem:'#5b8e4f'},
  {grass:'#72a064',light:'#b5d48a',edge:'#436b53',path:'#d3b993',stone:'#efdec0',petal:'#fbccdd',stem:'#3a9864'},
  {grass:'#5e9575',light:'#b1da9c',edge:'#33664f',path:'#cbbcad',stone:'#dfdbcd',petal:'#c1cafa',stem:'#338363'},
  {grass:'#71a69c',light:'#d0e8b9',edge:'#38746d',path:'#ebdcc6',stone:'#fff3df',petal:'#b8eefa',stem:'#4aaa8d'}
 ];
 const p=palettes[band-1],id='yard'+band;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" role="img" aria-label="Embryon yard scenery stage ${band}">
 <defs><linearGradient id="${id}-grass" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${p.light}"/><stop offset=".47" stop-color="${p.grass}"/><stop offset="1" stop-color="${p.edge}"/></linearGradient><linearGradient id="${id}-path" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${p.stone}"/><stop offset=".5" stop-color="${p.path}"/><stop offset="1" stop-color="#918176"/></linearGradient><filter id="${id}-shade" x="-25%" y="-35%" width="150%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#182738" flood-opacity=".3"/></filter></defs>`;
 svg+=`<g filter="url(#${id}-shade)"><path d="M28 373Q32 356 57 349L239 288Q256 281 276 287L481 365Q500 377 476 396L280 477Q252 485 225 474L30 399Q14 388 28 373Z" fill="url(#${id}-grass)" stroke="${p.edge}" stroke-width="6" stroke-linejoin="round"/><path d="M31 383L229 462Q255 472 276 465L484 382" stroke="${p.light}" stroke-width="3" opacity=".65"/></g>`;
 // Garden plot sockets belong to game UI; yard contains only landscaping.
 svg+=`<path d="M254 356Q275 356 289 371L329 445Q317 464 264 479Q240 472 217 455Z" fill="url(#${id}-path)" stroke="#8d887c" stroke-width="3" opacity=".91"/>`;
 for(let i=0;i<6;i++){
  const x=243+(i%2)*22+(i%3)*5,y=384+i*13;
  svg+=`<path d="M${x-9} ${y-3}l19-3 8 8-21 5Z" fill="${p.stone}" stroke="${p.path}" stroke-width="1.5" opacity="${band>=3?.6:.78}"/>`;
 }
 // Soft foliage and decorative ground flowers; deliberately no crops or sowing beds.
 for(let i=0;i<24;i++){
  const theta=i*2.4,rad=70+i%8*11,x=(i%2?119:381)+Math.sin(theta)*rad*.48,y=398+Math.cos(theta)*25+((i*19)%14);
  if(x<42||x>475||y>458)continue;
  svg+=`<path d="M${x} ${y+7}q-7-15-10-12M${x} ${y+7}q8-14 13-11" stroke="${p.stem}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
  if(i%4===0){
   svg+=`<g><circle cx="${x}" cy="${y}" r="${band>=3?6:4}" fill="${p.petal}" stroke="#fff1df" stroke-width="1"/><circle cx="${x+1}" cy="${y}" r="1.5" fill="#e9c965"/></g>`;
  }
 }
 if(band===1){
  for(let i=0;i<8;i++){
   const x=59+i*57,y=354+(i%3)*12;
   svg+=`<path d="M${x} ${y}l4-13m0 0 4 11m-4-11-7 9" stroke="#689457" stroke-width="3" stroke-linecap="round"/>`;
  }
  svg+=`<path d="M50 376l39-13 17 7M407 374l38 14" stroke="#8d7557" stroke-width="8" stroke-linecap="round"/>`;
 }else if(band===2){
  for(const [x,y] of [[80,389],[411,398],[99,429],[390,431]]){
    svg+=`<ellipse cx="${x}" cy="${y}" rx="17" ry="7" fill="#386a4f" opacity=".47"/><path d="M${x-9} ${y+3}q-9-18 6-21q11-15 20 2q13 15-3 22Z" fill="#639c66" stroke="#3e7b4d" stroke-width="2"/>`;
  }
  svg+=`<path d="M98 354l28-11 20 6M367 353l28 10 16-4" stroke="#e8cdaa" stroke-width="6" stroke-linecap="round"/>`;
 }else if(band===3){
  for(const [x,y] of [[76,386],[414,387]]){
   svg+=`<path d="M${x-21} ${y-8}l32-11 24 12-34 13Z" fill="#dbd2bb" stroke="#948d83" stroke-width="3"/><path d="M${x} ${y-18}q-21-40 3-53q24 10 4 52Z" fill="#367b63" stroke="#b2d7ac" stroke-width="3"/>`;
  }
  for(let k=0;k<7;k++){
   const x=72+k*58;
   svg+=`<path d="M${x} 380l11-4" stroke="#e6e5cb" stroke-width="3" opacity=".5"/>`;
  }
 }else{
  for(const [x,y] of [[79,392],[412,391]]){
   svg+=`<ellipse cx="${x}" cy="${y+9}" rx="31" ry="9" fill="#2c6e68" opacity=".6"/>`;
   svg+=`<path d="M${x} ${y+7}l-14-24 14-40 14 40Z" fill="#54a79a" stroke="#d3ead3" stroke-width="3"/>`;
   svg+=`<path d="M${x} ${y-55}l-11-13 11-21 11 21Z" fill="#a2eeef" stroke="#f6ffff" stroke-width="3"/><path d="M${x} ${y-55}v51" stroke="#e5f9f1" stroke-width="2" opacity=".68"/>`;
  }
  svg+=`<path d="M231 454q26 9 53 0M245 472l12 5 13-5" stroke="#e6f5e8" stroke-width="5" opacity=".7"/>`;
 }
 svg+='</svg>';
 return svg;
}

if(require.main===module){const out=path.resolve(__dirname,'../web/art/embryon/town/yards');fs.mkdirSync(out,{recursive:true});for(let i=1;i<=4;i++)fs.writeFileSync(path.join(out,BANDS[i-1]+'.svg'),drawYard(i));console.log('Regenerated four yard landscape modules');}

module.exports=Object.freeze({BANDS,drawYard});
