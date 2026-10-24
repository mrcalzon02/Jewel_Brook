'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../web/engine.js');
const P=require('../web/progression.js');
const D=require('../web/daily-moves.js');
const B=require('../web/benefits.js');
const Trials=require('../web/elemental-challenges.js');
const Rewards=require('../web/elemental-rewards.js');
const Gear=require('../web/mining-gear.js');
const Mining=require('../web/mining.js');
const Bridge=require('../web/mine-bridge.js');
const Art=require('../web/art.js');
const Shared=require('../web/shared-art.js');
const Chapters=require('../web/embryon-chapters.js');
const Audio=require('../web/embryon-audio.js');
const EmbryonAssets=require('../web/embryon-assets.js');
const root=path.resolve(__dirname,'../web');
assert.equal(E.TYPES.length,19);
assert.deepEqual(E.TYPES.slice(0,7),['ruby','sapphire','emerald','topaz','amethyst','citrine','diamond']);
assert.equal(E.BOOSTERS.length,16);
assert.equal(Trials.LAST-Trials.FIRST+1,300);
for(const n of [1,2,15,35,77,125,250,500,750,1000,1001,1150,1300]){
 const a=E.create(n,n*7919),b=E.create(n,n*7919);
 assert.deepEqual(E.snapshot(a),E.snapshot(b),'determinism level '+n);
 assert.ok(E.hasMove(a),'playable level '+n);
}
assert.equal(Gear.COUNT,40);assert.equal(Gear.LAST,39);
assert.equal(Gear.ART.pickaxe.length,40);assert.equal(Gear.ART.gloves.length,40);
assert.equal(Gear.BONUS.pickaxe.length,4);assert.equal(Gear.BONUS.gloves.length,2);
for(const kind of ['pickaxe','gloves']){
 for(let i=0;i<40;i++){
  const entry=Gear.entry(kind,i);
  assert.ok(fs.existsSync(path.join(root,entry.image)),'missing exact tier art '+entry.image);
 }
 for(const extra of Gear.BONUS[kind])assert.ok(fs.existsSync(path.join(root,extra.image)),'missing bonus art '+extra.image);
}
assert.ok(fs.existsSync(path.join(root,'art/primary/blockers/rock.png')));
const save={unlocked:1,stars:{},coins:20000,gems:200,hearts:1};
P.migrate(save);D.ensure(save,Date.now(),36);Mining.ensure(save);
assert.equal(Gear.isUnlocked(save),true,'mining is available from stage one');
assert.equal(Mining.available(save),true);
assert.equal(Mining.currentBoard(save).length,16);
const attempts=Mining.excavate(save,0,0);
assert.equal(attempts.valid,true);
assert.equal(Mining.stats(save).strikesLeft,11);
const starting=save.coins,gemBalance=save.gems;
assert.equal(P.buyCurrencyOffer(save,'heart-gems',D).valid,true);
assert.equal(save.hearts,5);
assert.equal(save.gems,gemBalance-12);
assert.equal(P.buyBooster(save,'hammer').valid,true);
assert.ok(save.coins<starting);
assert.equal(P.buyGemBooster(save,'hammer').granted,4);
save.rupeeMine.dollars=500;
const beforeMoves=D.left(save),purchase=Bridge.buy(save,'moves',Mining,P,D);
assert.equal(purchase.valid,true);
assert.equal(save.rupeeMine.dollars,320);
assert.equal(D.left(save),beforeMoves+5);
assert.equal(Bridge.buy(save,'nonsense',Mining,P,D).valid,false);
assert.equal(Rewards.summary(save).total,300);
assert.ok(Art.gem(0).startsWith('data:image/svg+xml'));
assert.ok(Art.icon('hammer').startsWith('data:image/svg+xml'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['engine','game','mining-gear','mining','mine-bridge','art'])assert.ok(html.includes('src="'+name+'.js"'),name+' script absent');
assert.ok(!html.includes('nutbuster.v1'));
const views={screen:{innerHTML:''},wallet:{textContent:''},stargems:{textContent:''},toast:{textContent:'',classList:{add(){},remove(){}}}};
const store={};
let handler=null;
const doc={
 getElementById:id=>views[id]||null,
 querySelectorAll:()=>[],
 addEventListener:(event,fn)=>{if(event==='click')handler=fn;}
};
const gameWindow={RupeeEngine:E,RupeeProgress:P,RupeeDailyMoves:D,RupeeBenefits:B,
 RupeeElementalChallenges:Trials,RupeeElementalRewards:Rewards,RupeeMining:Mining,
 RupeeMiningGear:Gear,RupeeMineBridge:Bridge,RupeeArt:Art,RupeeSharedArt:Shared,RupeeChapters:Chapters,RupeeAudio:Audio,RupeeEmbryonAssets:EmbryonAssets};
const ctx={window:gameWindow,document:doc,localStorage:{
 getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}
 },setTimeout:()=>1,clearTimeout:()=>{},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),ctx,{filename:'game.js'});
assert.match(views.screen.innerHTML,/art\/embryon\/branding\/rupee-rush-title\.webp/,'approved main-menu title is rendered');
assert.match(views.screen.innerHTML,/Rupee Rush — Heroes of Embryon/,'title provides readable alternative text');
assert.match(views.screen.innerHTML,/data-action="play-next"/,'Play action remains available');
assert.match(views.screen.innerHTML,/data-action="go-mine"/,'Mining action remains available from home');
function click(action,rest={}){assert.equal(typeof handler,'function');handler({target:{closest:()=>({dataset:{action,...rest},disabled:false})}});}
function navigate(nav){click('',{nav});}
navigate('mine');
assert.match(views.screen.innerHTML,/Prism Vale Mines/);
assert.match(views.screen.innerHTML,/art\/primary\/blockers\/rock.png/);
click('mine-tab',{tab:'equipment'});
assert.match(views.screen.innerHTML,/art\/nutvale\/mining-tools\/pickaxes\//);
assert.match(views.screen.innerHTML,/art\/nutvale\/mining-tools\/gloves\//);
click('mine-tab',{tab:'exchange'});
assert.match(views.screen.innerHTML,/Five extra moves/);
navigate('home');click('play-next');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'game');
assert.match(views.screen.innerHTML,/data-action="cell"/);
navigate('mine');
assert.match(views.screen.innerHTML,/RESUME LEVEL 1/);
click('resume-board');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'game');
click('cell',{cell:'0'});click('cell',{cell:'1'});
assert.ok(store['rupeerush.save.v1'],'board turn saves under distinct key');
assert.equal(store['nutbuster.v1'],undefined,'Nut Buster saves must remain untouched');
console.log('PASS Rupee Rush: deterministic gameplay, 86 mining art references, day-one excavation, economic bridge, desktop DOM smoke and board resume');
