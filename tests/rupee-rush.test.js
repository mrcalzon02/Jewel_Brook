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
assert.match(views.screen.innerHTML,/art\/embryon\/branding\/rupee-rush-title\.webp/,'approved main-menu title is rendered');
assert.match(views.screen.innerHTML,/Rupee Rush — Heroes of Embryon/,'title provides readable alternative text');
assert.match(views.screen.innerHTML,/data-action="play-next"/,'Play action remains available');
assert.match(views.screen.innerHTML,/data-action="go-mine"/,'Mining action remains available from home');
assert.match(views.screen.innerHTML,/data-action="go-farm"/,'Farming action available from home');
assert.match(views.screen.innerHTML,/daysha_lv_01\.png/,'Home actually displays the recovered first Town avatar');
assert.match(views.screen.innerHTML,/house_lv_01\.svg/,'Home displays independently leveled house illustration');
assert.match(views.screen.innerHTML,/hawseed-yard\.svg/,'Home shows separate early-era yard scenery');
function click(action,rest={}){assert.equal(typeof handler,'function');handler({target:{closest:()=>({dataset:{action,...rest},disabled:false})}});}
function navigate(nav){click('',{nav});}
navigate('mine');
assert.match(views.screen.innerHTML,/Prism Vale Mines/);
assert.match(views.screen.innerHTML,/class="mine-rock-face damage-0"/,'Mine displays existing raster rock art');
assert.ok(views.screen.innerHTML.includes('class="mine-rock-base" src="art/primary/blockers/rock.png"'),'Mine rock comes from checked-in PNG');
assert.doesNotMatch(views.screen.innerHTML,/excavation-rock/,'No procedural faceted SVG/CSS placeholder rocks');
assert.ok(views.screen.innerHTML.includes('class="mine-action-art" src="art/nutvale/mining-tools/pickaxes/'),'Dig mode uses actual pickaxe art');
assert.ok(views.screen.innerHTML.includes('class="mine-action-art" src="art/nutvale/mining-tools/gloves/'),'Survey mode uses actual glove art');
const damagedSite={rupeeMine:{},rupeeExpedition:{}};
Mining.ensure(damagedSite);
const hardRock=Mining.currentBoard(damagedSite).find(c=>c.hardness>=2);
assert.ok(hardRock,'seeded site includes multi-hit rock');
click('mine-cell',{x:String(hardRock.x),y:String(hardRock.y)});
assert.match(views.screen.innerHTML,/class="mine-rock-face damage-1"/,'After one strike the raster fracture state renders');
assert.ok(views.screen.innerHTML.includes('class="mine-rock-fracture" src="art/primary/overlays/void-rock.png"'),'Damage overlays use committed raster art');
const styles=fs.readFileSync(path.join(root,'style.css'),'utf8');
assert.ok(!styles.includes('.excavation-rock'),'Do not reintroduce procedural boulder renderer');
for(const asset of ['art/primary/blockers/rock.png','art/primary/overlays/void-rock.png','art/embryon/runtime/gems/diamond.webp','art/embryon/runtime/gems/onyx.webp','art/embryon/runtime/gems/garnet.webp','art/nutvale/mining-economy/goods/crate-mining-supplies.png']){
 assert.ok(fs.existsSync(path.join(root,asset)),'missing mining gameplay art '+asset);
}
click('mine-tab',{tab:'equipment'});
assert.match(views.screen.innerHTML,/art\/nutvale\/mining-tools\/pickaxes\//);
assert.match(views.screen.innerHTML,/art\/nutvale\/mining-tools\/gloves\//);
click('mine-tab',{tab:'exchange'});
assert.match(views.screen.innerHTML,/Five extra moves/);
navigate('farm');
assert.match(views.screen.innerHTML,/Embryon Garden/,'farm renders');
assert.match(views.screen.innerHTML,/daysha_lv_01\.png/,'Farm displays recovered Daysha Town art without altering house level');
assert.match(views.screen.innerHTML,/house_lv_01\.svg/,'Farm displays house 1 at default Town level');
assert.match(views.screen.innerHTML,/hawseed-yard\.svg/,'Farm composites yard behind residence');
assert.match(views.screen.innerHTML,/farming-tools\/equipment\/garden-plot\.webp/,'Existing real gardening bed art renders');
assert.match(views.screen.innerHTML,/farm-bed-scene state-empty/,'Available bed is visibly empty');
assert.match(views.screen.innerHTML,/farm-bed-scene state-locked/,'All eight plot anchors include locked bed art');
assert.match(views.screen.innerHTML,/Seed Almanac · Coming Soon/,'Farm announces upcoming crop unlocks');
assert.match(views.screen.innerHTML,/data-action="farm-category"/,'Farm uses crop family filters');
assert.match(views.screen.innerHTML,/data-qty="5"/,'Seed purchases offer bulk orders');
assert.match(fs.readFileSync(path.join(root,'game.js'),'utf8'),/CropGrowth\.fromStatus\(p\)/,'Farm renders real crop stages from plotStatus');
assert.equal((views.screen.innerHTML.match(/class="farm-plot /g)||[]).length,8,'exactly eight visual plot sockets');
assert.match(views.screen.innerHTML,/farm-plot-pick[^>]+disabled aria-disabled="true"/,'locked beds cannot be selected');
assert.match(views.screen.innerHTML,/data-action="farm-plant"/,'plant actions available');
assert.match(views.screen.innerHTML,/Farming Power-Ups/,'farming booster shelf renders');
assert.match(views.screen.innerHTML,/Kitchen Pantry/,'kitchen pantry preview renders');
assert.match(views.screen.innerHTML,/data-action="kitchen-cook"/,'real recipe cooking is wired');
assert.match(views.screen.innerHTML,/data-action="kitchen-serve"/,'explicit meal serving is wired');
assert.match(views.screen.innerHTML,/kitchen-room\.webp/,'approved kitchen room is shown in farm');
assert.match(views.screen.innerHTML,/dining-room\.webp/,'approved dining room is shown in farm');
assert.match(views.screen.innerHTML,/aria-label="Cooking kitchen"/,'cooking scene has a distinct section');
assert.match(views.screen.innerHTML,/aria-label="Dining room"/,'serving scene has a distinct section');
assert.match(views.screen.innerHTML,/Cooking not yet available/,'unimplemented cooking is explicitly labeled');
assert.match(views.screen.innerHTML,/farming-overview\/goods\/carrot\.webp/,'real harvest art integrated');
assert.match(views.screen.innerHTML,/farming-tools\/equipment\/growth-elixir\.webp/,'farm power-up artwork integrated');
navigate('mine');
click('mine-tab',{tab:'powerups'});
assert.match(views.screen.innerHTML,/No rock targeted/,'mining booster shelf renders');
navigate('shop');
click('shop-tab',{shopTab:'boosters'});
assert.match(views.screen.innerHTML,/Match-3 Power-Ups/,'shop contains match-3 family');
assert.match(views.screen.innerHTML,/Seedling Starter Kit/,'shop contains farming bundles');
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
