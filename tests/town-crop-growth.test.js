'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../web');
const Town=require('../web/town-garden.js');
const Visual=require('../web/crop-growth-art.js');
const Generator=require('../scripts/generate-crop-growth.js');
const Extra=require('../scripts/generate-expanded-crop-growth.js');
const expanded=require('../web/art/embryon/town/gardening/growth/expanded-manifest.json');
const manifest=require('../web/art/embryon/town/gardening/growth/manifest.json');
test('240 stage assets exist, use transparent self-contained vectors, and are bit-for-bit reproducible',()=>{
 assert.equal(Visual.CROPS.length,48);
 assert.deepEqual(Visual.STAGES,['seed','sprout','growing','maturing','ready']);
 assert.equal(manifest.assets.length+expanded.assets.length,240);
 assert.match(manifest.status,/pending_final_painted_master/);
 const seen=new Set();
 for(const crop of Visual.CROPS){
  assert.ok(Town.CROPS[crop],'real Town farming crop');
  for(const stage of Visual.STAGES){
   const sprite=Visual.image(crop,stage);
   assert.equal(sprite,'art/embryon/town/gardening/growth/'+crop+'-'+stage+'.svg');
   const art=fs.readFileSync(path.join(dir,sprite),'utf8');
   assert.equal(art,['carrot','wheat','berry'].includes(crop)?Generator.drawCrop(crop,stage):Extra.drawExpanded(Town.CROPS[crop],stage),'stage drift '+crop+'/'+stage);
   assert.match(art,/viewBox="0 0 256 256"/);
   assert.match(art,/aria-label="/);
   assert.doesNotMatch(art,/<rect\b|<image\b|\shref=|\ssrc=/i,'no flat background, external images or linked assets');
   assert.ok(art.length>600,'nontrivial illustrated stage '+crop+'/'+stage);
   seen.add(art);
  }
 }
 assert.equal(seen.size,240);
 for(const c of [undefined,'not-a-crop','phantom-seed','__proto__'])assert.equal(Visual.image(c,'ready'),null);
 for(const st of [undefined,'empty','locked','sowing'])assert.equal(Visual.image('carrot',st),null);
});
test('crop illustrations follow actual deterministic growth stages at precise time boundaries',()=>{
 const t0=1_700_000_000_000;
 for(const crop of Visual.CROPS){
  const s={unlocked:1,coins:3000,rupeeExpedition:{gloveTier:0}};
  Town.ensure(s);
  s.town.houseLevel=40; // isolate crop art tests from stage purchase progression
  assert.equal(Town.purchase(s,'seed',crop,1).valid,true);
  const planted=Town.plant(s,0,crop,null,t0);
  assert.equal(planted.valid,true);
  const duration=planted.readyAt-t0;
  const statuses=[.05,.3,.55,.8,1].map(p=>Town.plotStatus(s,0,t0+Math.floor(duration*p)));
  for(let i=0;i<5;i++){
   assert.equal(statuses[i].state,Visual.STAGES[i],crop+' phase '+i);
   assert.equal(Visual.fromStatus(statuses[i]),Visual.image(crop,Visual.STAGES[i]));
  }
  assert.equal(Visual.fromStatus(Town.plotStatus(s,1,t0)),null);
  assert.equal(Visual.fromStatus(Town.plotStatus(s,7,t0)),null);
  assert.equal(Town.harvest(s,0,planted.readyAt).valid,true);
  assert.equal(Visual.fromStatus(Town.plotStatus(s,0,planted.readyAt)),null);
 }
});
test('crop visuals are wired into the Farm DOM without replacing item icons or farming economics',()=>{
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const game=fs.readFileSync(path.join(dir,'game.js'),'utf8');
 const css=fs.readFileSync(path.join(dir,'style.css'),'utf8');
 assert.ok(html.indexOf('src="crop-growth-art.js"')<html.indexOf('src="game.js"'));
 assert.match(game,/CropGrowth\.fromStatus\(p\)/);
 assert.match(game,/Garden\.summary\(saved\)/);
 assert.match(game,/Garden\.plant\(saved/);
 assert.match(game,/FarmArt\.harvest\(c\.id\)/,'harvest inventory uses actual crop item art');
 assert.match(game,/Array\.from\(\{length:8\}/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('240 crop sprites have a forty-eight-by-five transparent review gallery',()=>{
 const html=fs.readFileSync(path.join(dir,'town-crop-art-review.html'),'utf8');
 assert.match(html,/for\(const crop of cropArt\.CROPS\)/);
 assert.match(html,/for\(const stage of cropArt\.STAGES\)/);
 assert.match(html,/cropArt\.image\(crop,stage\)/);
 assert.match(html,/inspect\.showModal\(\)/);
 assert.match(html,/Check alpha/);
 assert.match(html,/240 loaded/);
});
