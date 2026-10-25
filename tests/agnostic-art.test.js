/* Cross-game art contract. Run with: node tests/agnostic-art.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../web');
const manifest=require('../web/art/shared-family.json');
const Shared=require('../web/shared-art.js');
const Art=require('../web/art.js');
const Progress=require('../web/progression.js');
assert.equal(manifest.schema,1);
assert.equal(manifest.source_repository,'mrcalzon02/NUTBUSTER-R');
assert.equal(manifest.assets.length,29,'Only visually approved independent assets enter shared catalog');
assert.equal(Shared.overlayNames.length,16);
const used=new Set();
const keep={overlay:0,blocker:0,effect:0,economy:0,powerup:0};
for(const item of manifest.assets){
 assert.ok(!used.has(item.path),'Duplicate artifact '+item.path);used.add(item.path);
 const file=path.resolve(__dirname,'..',item.path),data=fs.readFileSync(file);
 const git=crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
 assert.equal(git,item.source_git_blob,'Source binary changed unexpectedly: '+item.path);
 assert.ok(data.length>1000,'Suspiciously empty portable file: '+item.path);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Not PNG: '+item.path);
 keep[item.category]++;
 if(item.category==='overlay'){
  assert.equal(data.readUInt32BE(16),192,'Wrong overlay width: '+item.path);
  assert.equal(data.readUInt32BE(20),192,'Wrong overlay height: '+item.path);
  assert.equal(data[25],6,'Overlay must retain true PNG RGBA: '+item.path);
  const name=path.basename(item.path,'.png');
  assert.equal(Shared.tileOverlay(name),'art/primary/overlays/'+name+'.png');
 }
}
assert.deepEqual(keep,{overlay:16,blocker:5,effect:3,economy:4,powerup:1});
assert.ok(fs.existsSync(path.join(root,'art/primary/blockers/rock.png')));
const banned=[
 'art/primary/blockers/chain-1.png','art/primary/blockers/chain-2.png',
 'art/additions/ui/home.png','art/additions/ui/gift.png','art/additions/ui/settings.png',
 'art/additions/economy/level-badge.png','art/additions/economy/booster-pack.png',
 'art/additions/economy/daily-calendar.png','art/additions/effects/match-burst.png',
 'art/additions/effects/vertical-clear.png','art/additions/effects/horizontal-clear.png',
 'art/primary/powerups/rainbow.png','art/primary/powerups/row-clear.png'
];
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'game.js'),'utf8');
const styles=fs.readFileSync(path.join(root,'style.css'),'utf8');
const progress=fs.readFileSync(path.join(root,'progression.js'),'utf8');
const shared=fs.readFileSync(path.join(root,'shared-art.js'),'utf8');
for(const p of banned){
 assert.ok(!used.has('web/'+p),'A themed graphic entered portable asset list: '+p);
 for(const [name,text] of [['index',html],['shared',shared],['progression',progress]]){
  assert.ok(!text.includes(p),'A squirrel/nut-specific graphic used in '+name+': '+p);
 }
 assert.ok(!fs.existsSync(path.join(root,p)),'Disallowed source artwork shipped: '+p);
}
assert.ok(html.indexOf('shared-art.js')<html.indexOf('embryon-assets.js'));
assert.ok(html.indexOf('embryon-audio.js')<html.indexOf('embryon-music.js'));
assert.ok(html.indexOf('board-motion.js')<html.indexOf('game.js'));
assert.match(styles,/-webkit-mask-image:radial-gradient\(circle closest-side at center,transparent 0 63%,#000 80%\)/);
assert.match(styles,/[^-]mask-image:radial-gradient\(circle closest-side at center,transparent 0 63%,#000 80%\)/);
assert.match(styles,/\.cell \.gem\{position:relative;z-index:1\}/);
assert.match(styles,/\.cell \.tile-status\{position:absolute;inset:0;z-index:2/);
assert.match(src,/return payload\(cell\)\+status\+anchor\+counters/,'Gem payload must remain beneath cell-affixed overlay and anchor');
assert.ok(html.includes('art/embryon/system-icons/navigation-economy/home.webp'),'Approved navigation icon is shipped');
assert.equal(Shared.anchor({type:0,lock:2}).src,'art/primary/blockers/lock.png');
assert.equal(Shared.anchor({type:0,ice:2}).src,'art/primary/blockers/ice-2.png');
assert.equal(Shared.anchor({type:0,chest:1}).src,'art/primary/blockers/chest.png');
assert.equal(Shared.anchor({type:0,rock:1}).src,'art/primary/blockers/rock.png');
const stack={type:0,ice:2,lock:1,jam:1,fuse:3,rock:2,
 frozen:1,poison:2,ward:1,aura:'fire',auraTurns:2};
const statuses=Shared.layers(stack);
for(const id of ['frost','chain-lock','sticky-butter','bomb','void-rock','poison','shadow','fire'])
 assert.ok(statuses.some(s=>s.id===id),'Missing supported tile status '+id);
assert.ok(statuses.every(s=>used.has('web/'+s.src)),'Runtime pointed outside the portable manifest');
assert.ok(Shared.label(stack).includes('Bomb countdown 3'));
assert.deepEqual(Shared.layers({type:null,ice:3}),[],'Never render over a hole');
assert.equal(Shared.tileOverlay('unknown'),null);
for(const [id,p] of Object.entries(Shared.icons))assert.ok(used.has('web/'+p),'Used icon not in manifest: '+id);
for(const [id,p] of Object.entries(Progress.BOOSTER_ART))if(p)assert.ok(used.has('web/'+p),'Broken booster art reference: '+id);
const E=require('../web/engine.js'),D=require('../web/daily-moves.js'),B=require('../web/benefits.js'),
 Trial=require('../web/elemental-challenges.js'),R=require('../web/elemental-rewards.js'),
 Gear=require('../web/mining-gear.js'),M=require('../web/mining.js'),Bridge=require('../web/mine-bridge.js');
const proxy=Object.assign({},E,{create(level,seed){
 const g=E.create(level,seed),filled=g.cells.filter(c=>c&&c.type!==null);
 assert.ok(filled.length>=4);
 filled[0].jam=1;filled[1].ice=2;filled[2].lock=1;filled[3].fuse=4;
 return g;
}});
let page='',click=null;
const screen={get innerHTML(){return page;},set innerHTML(v){page=v;}};
const classes={add(){},remove(){},toggle(){}};
const document={getElementById:id=>({
 screen,wallet:{textContent:''},stargems:{textContent:''},toast:{textContent:'',classList:classes}
})[id]||null,querySelectorAll:()=>[],
 addEventListener:(id,cb)=>{if(id==='click')click=cb;}};
const win={RupeeEngine:proxy,RupeeProgress:Progress,RupeeDailyMoves:D,RupeeBenefits:B,
 RupeeElementalChallenges:Trial,RupeeElementalRewards:R,RupeeMining:M,RupeeMiningGear:Gear,
 RupeeMineBridge:Bridge,RupeeArt:Art,RupeeSharedArt:Shared,RupeeEmbryonAssets:require('../web/embryon-assets.js'),RupeeChapters:require('../web/embryon-chapters.js'),RupeeAudio:require('../web/embryon-audio.js'),RupeeMusic:require('../web/embryon-music.js'),RupeeBoardMotion:require('../web/board-motion.js'),RupeeBoardFeatures:require('../web/board-features.js'),RupeeSystemIcons:require('../web/system-icons.js'),RupeeEconomy:require('../web/economy.js'),RupeeMiningEconomyArt:require('../web/mining-economy-art.js')};
vm.runInNewContext(src,{window:win,document,localStorage:{getItem(){return null;},setItem(){}},
 setTimeout(){return 1;},clearTimeout(){},console},{filename:'game.js'});
assert.ok(click,'Game click dispatch must initialize');
click({target:{closest:()=>({dataset:{action:'play-next'},disabled:false})}});
assert.match(page,/class="gem"[^>]*src="art\/embryon\/generated\/gems\/(?:ruby|sapphire|emerald)\.png"/,'Approved gemstones render as actual PNGs, with overlays still above them');
for(const id of ['sticky-butter','frost','chain-lock','bomb'])
 assert.ok(page.includes('art/primary/overlays/'+id+'.png'),'Live board missing '+id);
assert.match(page,/class="status-count" data-status="fuse" data-strength="4"/);
assert.match(page,/class="tile-anchor" src="art\/primary\/blockers\/lock\.png"/);
assert.doesNotMatch(page,/art\/primary\/blockers\/chain-1\.png/);
assert.ok(page.indexOf('class="gem"')<page.indexOf('class="tile-status'),'Gem renders behind status');
console.log('PASS: 29 source-identical neutral sprites; 16 hollow RGBA statuses; compatible obstacles, booster references, no nut-branded UI, real board overlay render');
