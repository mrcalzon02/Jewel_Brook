'use strict';

/* Isolated deterministic 15-stage Embryon gardening illustration previews. Final painted masters pending. */

const fs=require('node:fs'),path=require('node:path');

const CROPS=Object.freeze(["carrot","wheat","berry"]),STAGES=Object.freeze(["seed","sprout","growing","maturing","ready"]);

function defs(id){
 return `<defs><linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bde68b"/><stop offset=".42" stop-color="#61ba5b"/><stop offset="1" stop-color="#236b45"/></linearGradient><linearGradient id="${id}-shadowleaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#90c17c"/><stop offset="1" stop-color="#1b6d50"/></linearGradient><linearGradient id="${id}-root" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe7a3"/><stop offset=".22" stop-color="#ffae4a"/><stop offset=".7" stop-color="#ed752b"/><stop offset="1" stop-color="#b9472b"/></linearGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff3b1"/><stop offset=".3" stop-color="#edd276"/><stop offset=".7" stop-color="#c49443"/><stop offset="1" stop-color="#916633"/></linearGradient><radialGradient id="${id}-blue" cx=".24" cy=".20" r=".9"><stop stop-color="#ebffff"/><stop offset=".24" stop-color="#8fd5f6"/><stop offset=".5" stop-color="#536cde"/><stop offset=".9" stop-color="#34358f"/><stop offset="1" stop-color="#232465"/></radialGradient><filter id="${id}-shade" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#1e3342" flood-opacity=".32"/></filter></defs>`;
}

function leaf(x,y,scale,rot,id,dark=false){
 return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})"><path d="M0 0Q-22-13-30-36Q-6-42 11-23Q18-9 0 0Z" fill="url(#${id}-${dark?'shadowleaf':'leaf'})" stroke="#376c4b" stroke-width="1.3"/><path d="M0-1Q-10-19-25-31" fill="none" stroke="#dcf7a9" stroke-width="1.5" opacity=".6"/></g>`;
}

function grain(x,y,size,rot,color){
 return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${size})"><path d="M-6-8Q-2-16 5-10Q12 0 0 12Q-8 6-6-8Z" fill="${color}" stroke="#997345" stroke-width="1.5"/><path d="M-2-7Q4-5 0 6" fill="none" stroke="#fff0ba" stroke-width="1.5" opacity=".7"/></g>`;
}

function seed(crop,id){
 const color=crop==='carrot'?'#c49358':crop==='wheat'?'#e0ba68':'#bc9a7d';
 return `<g filter="url(#${id}-shade)"><ellipse cx="128" cy="205" rx="15" ry="3" fill="#655d48" opacity=".18"/>${grain(123,191,crop==='berry'?.48:.65,-30,color)}${grain(135,195,.43,38,color)}</g>`;
}

function sprout(crop,id){
 const h=crop==='wheat'?49:39;
 let s=`<g filter="url(#${id}-shade)"><path d="M129 204Q126 179 128 ${204-h}" stroke="#47874a" stroke-width="4" fill="none"/>`;
 s+=leaf(126,182,crop==='wheat'?.46:.57,-24,id);
 s+=leaf(131,177,crop==='wheat'?.49:.57,81,id,true);
 return s+'</g>';
}

function carrot(stage,id){
 if(stage==='seed')return seed('carrot',id);
 if(stage==='sprout')return sprout('carrot',id);
 const growth=stage==='growing',maturing=stage==='maturing';
 let s=`<g filter="url(#${id}-shade)">`;
 if(!growth){
  const upper=maturing?182:161,low=maturing?220:234;
  s+=`<path d="M${maturing?114:101} ${upper}Q127 ${upper-14} ${maturing?142:153} ${upper}Q146 ${upper+18} 129 ${low}Q112 ${upper+43} ${maturing?114:101} ${upper}Z" fill="url(#${id}-root)" stroke="#af592e" stroke-width="2.8"/><path d="M111 ${upper+6}Q124 ${upper+13} 127 ${low-18}" stroke="#fff2bf" stroke-width="5" fill="none" opacity=".57"/><path d="M112 ${upper+30}l14 5M137 ${upper+39}l-9 7M118 ${low-16}l9 3" stroke="#d76e32" stroke-width="2.4" opacity=".65"/>`;
 }
 const count=growth?4:maturing?7:10, top=growth?147:maturing?118:77,bot=growth?202:maturing?184:159;
 s+=`<path d="M126 ${bot}Q120 ${top+35} 129 ${top+13}" stroke="#4b8844" stroke-width="5" fill="none"/>`;
 for(let k=0;k<count;k++){
   const y=bot-(k%5)*17-9,ang=-72+(k*41)%154;
   s+=leaf(127+(k%2?3:-3),y,growth?.66:maturing?.8:1.0,ang,id,k%3===0);
 }
 return s+'</g>';
}

function stalk(x,y,scale,id,ripe){
 let s=`<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0Q6-35 0-102" fill="none" stroke="${ripe?'#ae984f':'#579453'}" stroke-width="3"/>`;
 for(let k=0;k<6;k++){
  const yy=-55-k*8,color=ripe?`url(#${id}-gold)`:`url(#${id}-leaf)`;
  s+=grain(-7,yy,.6,-38,color)+grain(7,yy-3,.6,36,color);
 }
 s+=grain(0,-110,.53,0,ripe?`url(#${id}-gold)`:`url(#${id}-leaf)`);
 for(let k=0;k<4;k++)s+=`<path d="M0 ${-60-k*12}q${k%2?-18:18} -15 ${k%2?-26:26} -24" stroke="${ripe?'#d9ae55':'#93ce7b'}" stroke-width="1.4" fill="none"/>`;
 return s+'</g>';
}

function wheat(stage,id){
 if(stage==='seed')return seed('wheat',id);
 if(stage==='sprout')return sprout('wheat',id);
 const full=stage==='ready',young=stage==='growing';
 let s=`<g filter="url(#${id}-shade)">`;
 for(let k=0;k<(young?5:9);k++){
  const x=84+k*10,tip=(young?109:88)+(k%3)*13;
  s+=`<path d="M${x} 209Q${x-20} 170 ${x-13} ${tip}Q${x+10} 138 ${x+9} 203Z" fill="url(#${id}-${k%2?'shadowleaf':'leaf'})" stroke="#4c925a" stroke-width="1.5"/>`;
 }
 s+='</g>';
 if(!young)s+=stalk(110,205,full?1:.8,id,full)+stalk(139,207,full?1.1:.82,id,full)+stalk(162,208,full?.9:.7,id,full);
 return s;
}

function blueFruit(x,y,r,id){
 return `<g filter="url(#${id}-shade)"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}-blue)" stroke="#3f459a" stroke-width="1.5"/><circle cx="${x-r*.3}" cy="${y-r*.36}" r="${r*.23}" fill="#fff" opacity=".7"/><path d="M${x-4} ${y-r+2}l4-5 4 5-4 2Z" fill="#83b474" stroke="#437049" stroke-width="1"/></g>`;
}

function flower(x,y,size,id){
 let s=`<g transform="translate(${x} ${y}) scale(${size})" filter="url(#${id}-shade)">`;
 for(let k=0;k<5;k++)s+=`<ellipse cx="0" cy="-9" rx="6" ry="10" fill="${k%2?'#fff3fd':'#e3f7ff'}" stroke="#b1cde8" stroke-width="1" transform="rotate(${k*72})"/>`;
 return s+'<circle r="4.5" fill="#f8ce70" stroke="#c99948" stroke-width="1.2"/></g>';
}

function berry(stage,id){
 if(stage==='seed')return seed('berry',id);
 if(stage==='sprout')return sprout('berry',id);
 const young=stage==='growing',ripe=stage==='ready',count=young?6:11;
 let s=`<g filter="url(#${id}-shade)">`;
 for(let k=0;k<7;k++){
  const cx=128+(k%2?24:-24),up=(young?158:124)+(k%3)*13;
  s+=`<path d="M128 209Q${cx} ${up+25} ${cx+(k%2?10:-10)} ${up}" fill="none" stroke="#4b8350" stroke-width="${k%3===0?5:3}" stroke-linecap="round"/>`;
 }
 for(let k=0;k<count;k++){
  const a=((k*131)%280)-150,x=128+Math.round(Math.sin(k*2.4)*(young?25:38)),y=(young?160:143)+Math.round(Math.cos(k*1.7)*(young?25:36));
  s+=leaf(x,y,young?.67:.85,a,id,k%4===0);
 }
 s+='</g>';
 if(stage==='maturing')for(const [x,y] of [[107,163],[148,151],[124,129],[137,181],[162,172]])s+=flower(x,y,.68,id);
 if(ripe)for(const [x,y,r] of [[99,169,9],[121,144,10],[144,163,11],[159,143,8],[134,192,10],[102,134,8],[151,119,9],[118,178,8]])s+=blueFruit(x,y,r,id);
 return s;
}

function drawCrop(crop,stage){
 if(!CROPS.includes(crop)||!STAGES.includes(stage))throw RangeError('Unrecognized crop/stage: '+crop+'/'+stage);
 const id=crop+'-'+stage;
 const art=crop==='carrot'?carrot(stage,id):crop==='wheat'?wheat(stage,id):berry(stage,id);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${crop} ${stage} crop growth stage" fill="none">${defs(id)}${art}</svg>`;
}

if(require.main===module){const out=path.resolve(__dirname,'../web/art/embryon/town/gardening/growth');fs.mkdirSync(out,{recursive:true});for(const crop of CROPS)for(const stage of STAGES)fs.writeFileSync(path.join(out,crop+'-'+stage+'.svg'),drawCrop(crop,stage));console.log('Generated fifteen crop-stage illustrations');}

module.exports=Object.freeze({CROPS,STAGES,drawCrop});
