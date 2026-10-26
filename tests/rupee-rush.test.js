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
const Music=require('../web/embryon-music.js');
const Motion=require('../web/board-motion.js');
const Features=require('../web/board-features.js');
const EmbryonAssets=require('../web/embryon-assets.js');
const SystemIcons=require('../web/system-icons.js');
const FarmArt=require('../web/farming-art.js');
const TownGarden=require('../web/town-garden.js');
const Kitchen=require('../web/kitchen-catalog.js');
const kitchenWindow={RupeeTownGarden:TownGarden,RupeeDailyMoves:D,RupeeMining:Mining,
 RupeeProgress:P,RupeeModePowerups:require('../web/mode-powerups.js'),RupeeFarmingArt:FarmArt};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/kitchen-cooking.js'),'utf8'),{window:kitchenWindow});
const Cooking=kitchenWindow.RupeeKitchen;
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
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['engine','game','mining-gear','mining','mine-bridge','art','embryon-music','board-motion'])assert.ok(html.includes('src="'+name+'.js"'),name+' script absent');
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
 RupeeMiningGear:Gear,RupeeMineBridge:Bridge,RupeeArt:Art,RupeeSharedArt:Shared,RupeeChapters:Chapters,RupeeAudio:Audio,RupeeMusic:Music,RupeeBoardMotion:Motion,RupeeBoardFeatures:Features,RupeeEmbryonAssets:EmbryonAssets,RupeeSystemIcons:SystemIcons,RupeeEconomy:require('../web/economy.js'),RupeeMiningEconomyArt:require('../web/mining-economy-art.js'),RupeeTownGarden:TownGarden,RupeeModePowerups:require('../web/mode-powerups.js'),RupeeFarmingArt:FarmArt,RupeeTownAvatars:require('../web/town-avatars.js'),RupeeTownHouses:require('../web/town-houses.js'),RupeeTownYards:require('../web/town-yards.js'),RupeeCropGrowthArt:require('../web/crop-growth-art.js'),RupeeKitchenCatalog:Kitchen,RupeeKitchen:Cooking};
const ctx={window:gameWindow,document:doc,localStorage:{
 getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}
 },setTimeout:()=>1,clearTimeout:()=>{},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),ctx,{filename:'game.js'});
assert.match(views.screen.innerHTML,/data-action="play-next"/,'Play action remains available');
assert.match(views.screen.innerHTML,/data-action="go-mine"/,'Mining action remains available from home');
assert.match(views.screen.innerHTML,/data-action="go-farm"/,'Farming action available from home');
function click(action,rest={}){assert.equal(typeof handler,'function');handler({target:{closest:()=>({dataset:{action,...rest},disabled:false})}});}
function navigate(nav){click('',{nav});}
navigate('mine');
assert.match(views.screen.innerHTML,/data-action="mine-cell"/,'Mining tiles are actionable');
const beforeMine=gameWindow.RupeeRushDebug.getSave();
const digTarget=Mining.currentBoard(beforeMine).find(c=>!c.done);
assert.ok(digTarget,'A diggable tile exists');
click('mine-cell',{x:String(digTarget.x),y:String(digTarget.y)});
const afterMine=gameWindow.RupeeRushDebug.getSave();
assert.equal(Mining.stats(afterMine).strikesLeft,Mining.stats(beforeMine).strikesLeft-1,'Dig button consumes exactly one strike');
click('mine-tab',{tab:'equipment'});
click('mine-tab',{tab:'exchange'});
navigate('farm');
assert.match(views.screen.innerHTML,/data-action="farm-buy-seed"/,'Farm store can be opened');
const initialSeeds=gameWindow.RupeeRushDebug.getSave().town.seeds.carrot;
click('farm-buy-seed',{crop:'carrot',qty:'1'});
assert.equal(gameWindow.RupeeRushDebug.getSave().town.seeds.carrot,initialSeeds+1,'Seed purchase changes inventory');
click('farm-plant',{plot:'0'});
assert.equal(gameWindow.RupeeRushDebug.getSave().town.plots[0].crop,'carrot','Farming controls actually plant a crop');
assert.match(views.screen.innerHTML,/data-action="farm-category"/,'Farm uses crop family filters');
assert.match(views.screen.innerHTML,/data-qty="5"/,'Seed purchases offer bulk orders');
assert.match(views.screen.innerHTML,/data-action="kitchen-cook"/,'real recipe cooking is wired');
assert.match(views.screen.innerHTML,/data-action="kitchen-serve"/,'explicit meal serving is wired');
navigate('mine');
click('mine-tab',{tab:'powerups'});
assert.match(views.screen.innerHTML,/data-action="mine-tab"/,'Mining power-up tab opens');
navigate('shop');
click('shop-tab',{shopTab:'boosters'});
click('shop-tab',{shopTab:'packs'});
assert.match(views.screen.innerHTML,/data-action="buy-pack"/,'Shop exposes package purchasing');
navigate('settings');
assert.match(views.screen.innerHTML,/data-action="check-updates"/,'Settings exposes updater');
navigate('home');click('play-next');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'game');
assert.match(views.screen.innerHTML,/data-action="cell"/);
navigate('mine');
assert.match(views.screen.innerHTML,/RESUME LEVEL 1/);
click('resume-board');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'game');
const beforeMatch=gameWindow.RupeeRushDebug.activeSnapshot();
const playable=E.restore(beforeMatch);
let matchingPair=null;
for(let i=0;i<playable.cells.length&&!matchingPair;i++){
 for(let j=0;j<playable.cells.length;j++){
  if(!E.adjacent(playable,i,j))continue;
  const result=E.swap(E.restore(beforeMatch),i,j);
  if(result.valid&&result.removed>0){matchingPair=[i,j];break;}
 }
}
assert.ok(matchingPair,'A matching move is available');
click('cell',{cell:String(matchingPair[0])});
click('cell',{cell:String(matchingPair[1])});
const afterMatch=gameWindow.RupeeRushDebug.activeSnapshot();
assert.equal(afterMatch.turns,beforeMatch.turns+1,'Match input advances one game turn');
assert(afterMatch.score>beforeMatch.score,'Match awards a score');
assert.ok(store['rupeerush.save.v1'],'board turn saves under distinct key');
assert.equal(store['nutbuster.v1'],undefined,'Nut Buster saves must remain untouched');
console.log('PASS Rupee Rush functional diagnostics: game launch, matching, mining, farming, shop, updater menu, saves and resume');
