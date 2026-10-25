'use strict';

const fs=require('node:fs'),path=require('node:path');

const Farm=require('../web/town-garden.js');

const CROPS=Object.values(Farm.CROPS).filter(c=>!['carrot','wheat','berry'].includes(c.id));

function hash(s){let n=2166136261;for(const c of s){n=Math.imul(n^c.charCodeAt(0),16777619)}return n>>>0;}

function hue(id,category){const anchors={roots:23,greens:104,grains:47,fruits:350,herbs:151,flowers:292,exotics:188,orchard:18};const custom={radish:352,beet:351,mint:165,pea:102,tomato:3,pepper:9,strawberry:348,grape:255,dragonfruit:327,starfruit:53,apple:7,pear:85,peach:19,melon:100,watermelon:125,blueberry:238,raspberry:336,cucumber:119,zucchini:114,spinach:144,barley:44,rice:56,lavender:277,rose:349,tulip:348,orchid:301,sunflower:47};return custom[id]??((anchors[category]??70)+(hash(id)%29)-14+360)%360;}

function shape(crop,phase,progress,h){
 const id=crop.id,cat=crop.category,s=hash(id),ang=(s%19)-9;
 const ybase=211,top=204-Math.round(120*progress),leafN=2+Math.round(progress*6),shrink=.43+progress*.62;
 const green=`hsl(${95+s%32} 48% 45%)`,dark=`hsl(${104+s%27} 44% 27%)`,glow=`hsl(${110+s%27} 62% 74%)`;
 const pigment=`hsl(${h} ${cat==='roots'?67:75}% ${cat==='grains'?60:cat==='flowers'?64:51}%)`;
 const shade=`hsl(${h} 58% ${cat==='grains'?38:32}%)`;
 const L=(x,y,n,rot=-30)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${n})"><path d="M0 0Q-23-11-30-39Q0-47 13-22Q17-9 0 0Z" fill="${rot%3===0?dark:green}" stroke="${dark}" stroke-width="1.8"/><path d="M0 0Q-10-21-27-34" stroke="${glow}" stroke-width="2" fill="none" opacity=".8"/></g>`;
 let out=`<g filter="url(#shade)"><ellipse cx="128" cy="213" rx="${8+Math.round(progress*14)}" ry="4" fill="#4f453b" opacity=".13"/>`;
 if(phase==='seed'){
  return out+`<path d="M121 202Q111 190 124 187Q140 189 130 204Z" fill="${pigment}" stroke="${shade}" stroke-width="2"/><path d="M124 193l6 4" stroke="#ffe9ad" stroke-width="2" opacity=".7"/></g>`;
 }
 if(phase==='sprout'){
  return out+`<path d="M128 209Q122 191 129 171" stroke="${green}" stroke-width="4.4" fill="none"/>${L(129,178,.59,74)}${L(128,182,.48,-31)}</g>`;
 }
 // Multi-stem foliage, increasing size and branching, anchored to the soil surface.
 for(let j=0;j<(cat==='orchard'?4:cat==='flowers'?3:5);j++){
  const offset=(j-2)*7, x=128+offset;
  out+=`<path d="M${x} 212Q${x+(j%2?18:-18)+ang} ${151+Math.floor(40*(1-progress))} ${x+(j%2?11:-11)} ${top+18+(j%2)*17}" fill="none" stroke="${j%2?dark:green}" stroke-width="${3+progress*2}" stroke-linecap="round"/>`;
 }
 for(let j=0;j<leafN;j++){
  const a=(-69+j*37+ang)%170,x=128+Math.round(Math.sin((j+1)*1.7)*40*progress),y=192-Math.round((j%4)*23*progress);
  out+=L(x,y,(.38+(j%3)*.13)*shrink,a);
 }
 if(cat==='roots'){
  if(phase==='maturing'||phase==='ready'){
   const k=phase==='ready'?1:.72,cx=128,r=Math.round(23*k);
   out+=`<path d="M${cx-r} 158Q${cx} ${146-8*k} ${cx+r} 158Q${cx+20*k} ${185+15*k} ${cx} ${209+22*k}Q${cx-21*k} ${189+12*k} ${cx-r} 158Z" fill="${pigment}" stroke="${shade}" stroke-width="3"/><path d="M119 164Q125 160 130 184" stroke="#ffe5bc" stroke-width="4.2" opacity=".65" fill="none"/>`;
  }
 }else if(cat==='grains'){
  if(phase==='maturing'||phase==='ready')for(let j=0;j<3;j++){
   const x=101+j*27,y=117+j%2*11,r=phase==='ready'?1:.7;
   out+=`<path d="M${x} 204Q${x+7} 160 ${x} ${y}" stroke="${green}" stroke-width="3.3" fill="none"/>`;
   for(let k=0;k<6;k++){
    const yy=y+k*10;
    out+=`<path d="M${x} ${yy+6}q${k%2?13:-13} -4 ${k%2?12:-12} -16q${k%2?-11:11} 0 ${k%2?-12:12} 16Z" transform="scale(${r}) translate(${(1-r)*x/r} ${(1-r)*yy/r})" fill="${pigment}" stroke="${shade}" stroke-width="1"/>`;
   }
  }
 }else if(cat==='greens'||cat==='herbs'){
  if(phase==='maturing'||phase==='ready'){
   const n=cat==='greens'?9:14,extent=phase==='ready'?49:33;
   for(let j=0;j<n;j++){
    const x=128+Math.round(Math.cos(j*2.5)*extent),y=183+Math.round(Math.sin(j*2.2)*23);
    out+=L(x,y,cat==='greens'?.93:.5,(j*41)%320);
   }
   if(cat==='herbs'&&phase==='ready')for(let k=0;k<5;k++)out+=`<circle cx="${102+k*12}" cy="${143+k%3*7}" r="3" fill="${pigment}" stroke="${glow}" stroke-width="1"/>`;
  }
 }else if(cat==='flowers'){
  if(phase==='maturing'||phase==='ready'){
   const blossoms=phase==='ready'?4:2;
   for(let j=0;j<blossoms;j++){
    const x=93+j*23+(j%2?4:0),y=111+(j%2?21:5),petals=id==='sunflower'?12:5+(s%4);
    const radius=phase==='ready'?(id==='sunflower'?15:12):7;
    for(let k=0;k<petals;k++)out+=`<ellipse cx="${x}" cy="${y-radius}" rx="${radius*.48}" ry="${radius*.95}" transform="rotate(${k*360/petals} ${x} ${y})" fill="${pigment}" stroke="${shade}" stroke-width="1"/>`;
    out+=`<circle cx="${x}" cy="${y}" r="${id==='sunflower'?9:5}" fill="${id==='sunflower'?'#6d492d':'#eac85a'}" stroke="#d2a95a" stroke-width="1.6"/>`;
   }
  }
 }else if(cat==='orchard'){
  if(phase==='maturing'||phase==='ready'){
   out+=`<path d="M121 189Q145 139 181 126" stroke="${dark}" stroke-width="6" fill="none"/><path d="M133 160q-19-15-36-22" stroke="${green}" stroke-width="4" fill="none"/>`;
   for(let k=0;k<(phase==='ready'?4:2);k++){
    const x=111+k*23,y=144+(k%2)*21,r=phase==='ready'?13:8;
    out+=`<path d="M${x} ${y-r}q-10-18 0-12" stroke="${dark}" stroke-width="2.5" fill="none"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${id==='pear'?r*1.25:r}" fill="${pigment}" stroke="${shade}" stroke-width="2"/><ellipse cx="${x-4}" cy="${y-4}" rx="3" ry="5" fill="#fff" opacity=".34"/>`;
   }
  }
 }else{
  if(phase==='maturing'||phase==='ready'){
   const n=phase==='ready'?cat==='exotics'?3:6:3;
   for(let k=0;k<n;k++){
    const x=97+(k%3)*29+(Math.floor(k/3)%2)*9, y=145+Math.floor(k/3)*32+(k%2)*8;
    const r=phase==='ready'?(cat==='exotics'?15:12):8;
    if(id==='starfruit'){
     const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,R=i%2?r*.48:r;return [x+Math.cos(a)*R,y+Math.sin(a)*R].map(Math.round).join(",")}).join(" ");
     out+=`<polygon points="${pts}" fill="${pigment}" stroke="${shade}" stroke-width="2"/>`;
    }else if(id==='dragonfruit'){
     out+=`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.9}" fill="${pigment}" stroke="${shade}" stroke-width="2"/>`;
     for(let j=0;j<4;j++)out+=`<path d="M${x+(j-1.5)*5} ${y-2}l-3-10 8 8" stroke="#8fdd86" stroke-width="2" fill="none"/>`;
    }else if(id==='pineapple'){
     out+=`<ellipse cx="${x}" cy="${y}" rx="${r*.8}" ry="${r*1.25}" fill="${pigment}" stroke="${shade}" stroke-width="2"/>`;
     out+=L(x,y-r,.4,-35)+L(x,y-r,.4,40);
    }else if(id==='cotton'){
     out+=`<g fill="#fcf9ed" stroke="#a8a49c" stroke-width="1.3"><circle cx="${x-7}" cy="${y}" r="${r*.8}"/><circle cx="${x+6}" cy="${y-4}" r="${r*.8}"/><circle cx="${x}" cy="${y-8}" r="${r*.8}"/></g>`;
    }else{
     out+=`<ellipse cx="${x}" cy="${y}" rx="${r*(id==='watermelon'?1.4:1)}" ry="${r*(id==='grape'?.7:1.07)}" fill="${pigment}" stroke="${shade}" stroke-width="2"/><ellipse cx="${x-4}" cy="${y-4}" rx="3" ry="5" fill="#fff" opacity=".37"/>`;
    }
   }
  }
 }
 return out+'</g>';
}

function drawExpanded(crop,stage){
 const h=hue(crop.id,crop.category);
 const index=["seed","sprout","growing","maturing","ready"].indexOf(stage);
 if(index<0)throw RangeError('unknown stage');
 const progress=[.03,.18,.47,.74,1][index];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none" role="img" aria-label="${crop.name} ${stage} growth art"><defs><filter id="shade" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#172d2b" flood-opacity=".27"/></filter></defs>${shape(crop,stage,progress,h)}</svg>`;
}

if(require.main===module){const dir=path.resolve(__dirname,'../web/art/embryon/town/gardening/growth');fs.mkdirSync(dir,{recursive:true});for(const c of CROPS)for(const stage of ['seed','sprout','growing','maturing','ready'])fs.writeFileSync(path.join(dir,c.id+'-'+stage+'.svg'),drawExpanded(c,stage));console.log('Generated '+CROPS.length*5+' extra growth-stage assets');}

module.exports=Object.freeze({CROPS,drawExpanded});
