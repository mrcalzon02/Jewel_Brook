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
const Royal=require('../web/royal-chronicle.js');
const Guide=require('../web/embryon-world-guide.js');
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
assert.equal(Guide.CALENDAR.months,13);
assert.equal(Guide.mainDay(1).day,1);
assert.equal(Guide.mainDay(1000).day,1000);
assert.equal(Guide.mainDay(1001),null);
assert.equal(Guide.trialDay(1001,Trials).earliestMainDay,Trials.profile(1001).requiredMainLevel);
assert.equal(Guide.mainDay(20).calendarDate,null);
assert.equal(Royal.EVENTS.length,19);
assert.ok(Royal.EVENTS.every(e=>e.historicalDay===e.revealLevel),'Royal events share their level day');
assert.deepEqual(Royal.eventsOnDay(1).map(e=>e.id),['RH-E01']);
assert.equal(Royal.eventsOnDay(9)[0].historicalDay,9);
assert.equal(Royal.eventsOnDay(1250)[0].track,'royal-family');
const sharedDaySave={stars:{1:1,9:1},unlocked:10};
assert.equal(Royal.current(sharedDaySave).campaignDay,9);
assert.equal(Royal.unlocked(sharedDaySave,Royal.eventsOnDay(9)[0]),true);
assert.equal(Royal.unlocked({unlocked:9,stars:{}},Royal.eventsOnDay(9)[0]),false,'Only first clear advances royal events');
assert.ok(Guide.catalog('story',{Royal},sharedDaySave).some(e=>e.detail.includes('Campaign Day 9')));


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
for(const name of ['engine','game','royal-chronicle','mining-gear','mining','mine-bridge','art','embryon-music','board-motion'])assert.ok(html.includes('src="'+name+'.js"'),name+' script absent');
assert.ok(!html.includes('nutbuster.v1'));
const pointerHandlers={};
const views={screen:{innerHTML:'',addEventListener(event,fn){pointerHandlers[event]=fn;}},wallet:{textContent:''},stargems:{textContent:''},toast:{textContent:'',classList:{add(){},remove(){}}}};
const store={};
let handler=null;
const doc={
 getElementById:id=>views[id]||null,
 querySelectorAll:()=>[],
 addEventListener:(event,fn)=>{if(event==='click')handler=fn;}
};
const gameWindow={RupeeEngine:E,RupeeProgress:P,RupeeDailyMoves:D,RupeeBenefits:B,
 RupeeElementalChallenges:Trials,RupeeElementalRewards:Rewards,RupeeMining:Mining,
 RupeeMiningGear:Gear,RupeeMineBridge:Bridge,RupeeArt:Art,RupeeSharedArt:Shared,RupeeChapters:Chapters,JewelbrookRoyalChronicle:Royal,JewelBrookWorldGuide:Guide,RupeeAudio:Audio,RupeeMusic:Music,RupeeBoardMotion:Motion,RupeeBoardFeatures:Features,RupeeEmbryonAssets:EmbryonAssets,RupeeSystemIcons:SystemIcons,RupeeEconomy:require('../web/economy.js'),RupeeMiningEconomyArt:require('../web/mining-economy-art.js'),RupeeTownGarden:TownGarden,RupeeModePowerups:require('../web/mode-powerups.js'),RupeeFarmingArt:FarmArt,RupeeTownAvatars:require('../web/town-avatars.js'),RupeeTownCharacter:require('../web/town-character.js'),RupeeTownHouses:require('../web/town-houses.js'),RupeeTownYards:require('../web/town-yards.js'),RupeeCropGrowthArt:require('../web/crop-growth-art.js'),RupeeKitchenCatalog:Kitchen,RupeeKitchen:Cooking,MineOreAtlas:require('../web/mine-ore-atlas.js')};
const ctx={window:gameWindow,document:doc,localStorage:{
 getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}
 },setTimeout:()=>1,clearTimeout:()=>{},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),ctx,{filename:'game.js'});
assert.match(views.screen.innerHTML,/data-action="play-next"/,'Play action remains available');
assert.match(views.screen.innerHTML,/data-action="go-mine"/,'Mining action remains available from home');
assert.match(views.screen.innerHTML,/data-action="go-farm"/,'Farming action available from home');
assert.match(views.screen.innerHTML,/data-action="go-guide"/,'Offline world and calendar guide available from home');
const HomeAvatar=require('../web/town-character.js').fromSave(gameWindow.RupeeRushDebug.getSave());
assert.equal(HomeAvatar.character,'Daysha');
assert.match(HomeAvatar.image,/art\/embryon\/town\/avatars\/daysha_lv_01\.png/);
assert.match(views.screen.innerHTML,/class="town-avatar-art"/,'Equipped outfit is the single full-body Home avatar');
assert.doesNotMatch(views.screen.innerHTML,/class="profile-avatar"/,'Generated character-card SVG cannot replace Daysha on Home');
assert.doesNotMatch(views.screen.innerHTML,/class="profile-outfit"/,'No tiny outfit thumbnail beside a separate character portrait');

function click(action,rest={}){assert.equal(typeof handler,'function');handler({target:{closest:()=>({dataset:{action,...rest},disabled:false})}});}
function navigate(nav){click('',{nav});}
click('go-guide');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'guide');
assert.match(views.screen.innerHTML,/Campaign Day 1/);
click('guide-next');
assert.match(views.screen.innerHTML,/Campaign Day 2/);
assert.match(views.screen.innerHTML,/shared citizen and royal timeline/);
click('guide-tab',{tab:'dishes'});
assert.match(views.screen.innerHTML,/Hawseed Garden Salad/);
click('guide-tab',{tab:'gems'});
assert.match(views.screen.innerHTML,/Sapphire/);

assert.equal(Royal.EVENTS.length,19,'The source royal chronicle is registered');
assert.equal(Royal.ART.length,13,'The previous approved royal gallery remains unchanged');
assert.equal(Royal.GOWNS.length,10,'All ten source-verified generated Daysha elemental dresses are cataloged');
const fireDress=Royal.GOWNS.find(x=>x.id==='EL-01');
assert.equal(Royal.gownUnlocked({unlocked:15,elementalTrials:{}},fireDress),false,'Merely reaching an elemental stage does not reveal its dress');
assert.equal(Royal.gownUnlocked({unlocked:15,elementalTrials:{1001:1}},fireDress),true,'Actual completed fire trial reveals Fire dress');
assert.equal(Royal.gownUnlocked({unlocked:1,elementalTrials:{1001:1}},fireDress),false,'A completed trial alone cannot bypass main-stage gate');
assert.equal(Royal.gownsForTrial(1141)[0].id,'EL-10','Arcane gown is assigned to Arcane Trial 1141');
assert.equal(Royal.newAt(1).length,1,'First win can reveal the first royal atelier episode');
assert.ok(Royal.EVENTS.filter(e=>e.track==='royal-family').every(e=>e.revealLevel>1000),
 'Estelle childhood stories must not unlock during her pre-birth opening campaign');
click('go-chronicle');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'chronicle','Royal Chronicle opens from Home');
assert.match(views.screen.innerHTML,/The Royal Chronicle/);
assert.match(views.screen.innerHTML,/STAGE 1/,'Chronicle renders story unlock milestones');
navigate('home');
click('go-manor');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'manor','Manor House opens as a functional Town location');
assert.match(views.screen.innerHTML,/data-action="manor-upgrade"/);
assert.match(views.screen.innerHTML,/data-action="manor-garden"/);
assert.match(views.screen.innerHTML,/data-action="manor-kitchen"/);
assert.match(views.screen.innerHTML,/data-action="open-wardrobe"/);
const beforeManor=gameWindow.RupeeRushDebug.getSave();
click('manor-upgrade');
const afterManor=gameWindow.RupeeRushDebug.getSave();
assert.equal(afterManor.town.houseLevel,beforeManor.town.houseLevel+1,'Real Manor upgrade uses the house progression');
assert.equal(afterManor.coins,beforeManor.coins-TownGarden.upgradeCost(beforeManor.town.houseLevel),
 'Residence upgrade debits exactly the existing Rupee cost');
assert.equal(afterManor.unlocked,beforeManor.unlocked,'Residence upgrade never changes campaign level');
click('open-wardrobe');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'shop');
assert.match(views.screen.innerHTML,/data-shop-tab="outfit"/,'Wardrobe opens the real outfit shop');
navigate('manor');click('manor-kitchen');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'farm');
assert.match(views.screen.innerHTML,/id="town-kitchen"/);
assert.match(views.screen.innerHTML,/data-action="kitchen-cook"/);
navigate('manor');click('manor-garden');
assert.equal(gameWindow.RupeeRushDebug.getPage(),'farm');
navigate('home');

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
assert.equal(gameWindow.RupeeRushDebug.activeSnapshot().turns,beforeMatch.turns,
 'Two taps select booster targets; they must not replace directional dragging');
const [from,to]=matchingPair,w=playable.cfg.width;
const dx=to-from===1?36:to-from===-1?-36:0;
const dy=to-from===w?36:to-from===-w?-36:0;
assert.ok(dx||dy,'The legal match uses adjacent cells');
assert.equal(typeof pointerHandlers.pointerdown,'function','Drag start handler is registered');
assert.equal(typeof pointerHandlers.pointerup,'function','Drag end handler is registered');
let captured=null;
pointerHandlers.pointerdown({pointerId:7,isPrimary:true,button:0,clientX:100,clientY:100,
 target:{closest:selector=>selector==='[data-cell]'?{dataset:{cell:String(from)},disabled:false,setPointerCapture(id){captured=id}}:null}});
assert.equal(captured,7,'The board captures the input pointer rather than releasing it to scrolling');
pointerHandlers.pointerup({pointerId:7,clientX:100+dx,clientY:100+dy});
const afterMatch=gameWindow.RupeeRushDebug.activeSnapshot();
assert.equal(afterMatch.turns,beforeMatch.turns+1,'Match input advances one game turn');
assert(afterMatch.score>beforeMatch.score,'Match awards a score');
assert.ok(store['rupeerush.save.v1'],'board turn saves under distinct key');
assert.equal(store['nutbuster.v1'],undefined,'Nut Buster saves must remain untouched');
console.log('PASS Rupee Rush functional diagnostics: game launch, matching, mining, farming, shop, updater menu, saves and resume');
