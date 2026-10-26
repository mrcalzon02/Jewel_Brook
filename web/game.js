/* Rupee Rush standalone playable shell around reused deterministic systems. */
(function(){'use strict';
const E=window.RupeeEngine,P=window.RupeeProgress,D=window.RupeeDailyMoves,B=window.RupeeBenefits,
 T=window.RupeeElementalChallenges,R=window.RupeeElementalRewards,
 Mining=window.RupeeMining,G=window.RupeeMiningGear,Bridge=window.RupeeMineBridge,Art=window.RupeeArt,Shared=window.RupeeSharedArt,Chapters=window.RupeeChapters,Audio=window.RupeeAudio,Music=window.RupeeMusic,Assets=window.RupeeEmbryonAssets,Motion=window.RupeeBoardMotion,Features=window.RupeeBoardFeatures,Icons=window.RupeeSystemIcons,Economy=window.RupeeEconomy,MineArt=window.RupeeMiningEconomyArt,Garden=window.RupeeTownGarden,Powerups=window.RupeeModePowerups,FarmArt=window.RupeeFarmingArt,TownAvatars=window.RupeeTownAvatars,TownHouses=window.RupeeTownHouses,TownYards=window.RupeeTownYards,CropGrowth=window.RupeeCropGrowthArt,Kitchen=window.RupeeKitchenCatalog,Cook=window.RupeeKitchen;
if(![E,P,D,B,T,R,Mining,G,Bridge,Art,Shared,Chapters,Audio,Music,Assets,Motion,Features,Icons,Economy,MineArt,Garden,Powerups,FarmArt,TownAvatars,TownHouses,TownYards,CropGrowth,Kitchen,Cook].every(Boolean))throw Error('Rupee Rush gameplay dependencies missing');
const KEY='rupeerush.save.v1',defaultSave=()=>({unlocked:1,stars:{},coins:250,gems:25,styleShards:0,hearts:5,vip:false,claimed:0});
let saved=defaultSave();try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data&&typeof data==='object'&&!Array.isArray(data))saved={...saved,...data,stars:data.stars||{}};}catch(_){}
P.migrate(saved);R.ensure(saved);Mining.ensure(saved);Garden.ensure(saved);Powerups.ensure(saved);Economy.ensure(saved);D.ensure(saved,Date.now(),E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked))).moves);
let visualImpact=null,animating=false,swipeGuard=0,pointerStart=null;
let page='home',active=null,selected=-1,mineTab='dig',mineMode='dig',mineFocus=null,farmPlot=0,farmCrop='carrot',farmCategory='all',farmFeed='',shopTab='packs',shopReceipt=null,campaignPage=0,chapterId=1,toast='',toastT=null,resetStep=0,advanced=false,outcome=null;
const root=document.getElementById('screen'),wallet=document.getElementById('wallet'),stars=document.getElementById('stargems'),styles=document.getElementById('style-shards');
if(!root)throw Error('Missing #screen');
// Restore only validated, unfinished Rupee Rush boards. Never touch Nut Buster saves.
try{if(saved.activeBoard){const s=saved.activeBoard;const allowed=s.level>=T.FIRST?T.available(saved,s.level):s.level<=saved.unlocked;if(allowed)active=E.restore(s);if(!active)delete saved.activeBoard;}}catch(_){delete saved.activeBoard;}
function save(){try{if(active&&!active.won&&!active.lost)saved.activeBoard=E.snapshot(active);else delete saved.activeBoard;localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){message('Unable to save on this device');}}
function number(x){return Number(x||0).toLocaleString('en-US');}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function icon(id,size=30){return '<img class="icon" width="'+size+'" height="'+size+'" alt="" src="'+(Icons.get(id)||Shared.icons[id]||Art.icon(id))+'">';}
function gem(id){const key=E.TYPES[id],src=Assets.gem(key)||Art.gem(id);return '<img class="gem" alt="'+escape(key)+'" draggable="false" src="'+src+'">';}
function boosterIcon(id,size=36){const src=Assets.booster(id);return src?'<img class="booster-art" width="'+size+'" height="'+size+'" alt="" src="'+src+'" decoding="async">':icon(id,size);}
function impact(kind,index){visualImpact={kind,index:Number.isInteger(index)?index:-1};}
function impactMarkup(g){if(!visualImpact)return '';const art=Assets.effect(visualImpact.kind);if(!art)return '';const at=visualImpact.index;const col=at>=0?at%g.cfg.width:(g.cfg.width-1)/2,row=at>=0?Math.floor(at/g.cfg.width):(g.cfg.height-1)/2;return '<img class="board-impact" aria-hidden="true" alt="" src="'+art+'" style="left:'+((col+.5)/g.cfg.width*100)+'%;top:'+((row+.5)/g.cfg.height*100)+'%">';}

function button(action,label,cls='secondary',opts=''){return '<button class="btn '+cls+'" data-action="'+action+'" '+opts+'>'+label+'</button>';}
function nav(to){page=to;selected=-1;resetStep=0;advanced=false;Audio.play('tap');if(to==='mine')Audio.speak('mineEnter');else if(to==='shop')Audio.speak('shopEnter');render();}
function message(s){toast=s;const el=document.getElementById('toast');if(el){el.textContent=s;el.classList.add('visible');}if(toastT)clearTimeout(toastT);toastT=setTimeout(()=>{const t=document.getElementById('toast');if(t)t.classList.remove('visible');},4000);}
function dailyCap(){return E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked))).moves;}
function bank(){return D.ensure(saved,Date.now(),dailyCap());}
function header(name,description=''){return '<div class="heading"><h1>'+name+'</h1>'+(description?'<p>'+description+'</p>':'')+'</div>';}
function stats(){return '<div class="stats"><div>'+icon('rupee',24)+' <strong>'+number(saved.coins)+'</strong><small>Rupees</small></div><div>'+icon('crystal',24)+' <strong>'+number(saved.gems)+'</strong><small>Star Gems</small></div><div><img class="icon" src="art/nutvale/mining-economy/currency/rainbow-coin.png" width="24" height="24" alt=""> <strong>'+number(saved.styleShards)+'</strong><small>Style Shards</small></div><div>'+icon('heart',24)+' <strong>'+saved.hearts+'/5</strong><small>Lives</small></div><div>'+icon('extra',24)+' <strong>'+number(bank().remaining)+'</strong><small>Moves today</small></div></div>';}
function townAvatarPanel(){
 const portrait=TownAvatars.fromSave(saved);
 return '<section class="town-avatar-panel" aria-label="Daysha Town avatar progression">'+
  '<img class="town-avatar-art" src="'+portrait.path+'" alt="Daysha, Town avatar '+portrait.level+' of 40" width="144" height="240" loading="lazy" decoding="async">'+
  '<div class="town-avatar-copy"><span class="town-avatar-eyebrow">THE TOWN WAYFINDER</span><h2>Daysha · Avatar '+portrait.level+'/40</h2>'+
  '<p>Daysha’s Town appearance follows campaign progress. Your residence and its garden plots level up independently.</p>'+
  '</div></section>';
}
function townHousePanel(t){
 const art=TownHouses.house(t.houseLevel),yard=TownYards.yard(t.houseLevel);
 return '<section class="town-house-panel" aria-label="Town residence visual progress"><div class="town-house-frame">'+
  '<img class="town-yard-layer" src="'+yard.path+'" alt="" width="260" height="260" loading="lazy" decoding="async">'+
  '<img class="town-house-illustration" src="'+art.path+'" alt="Illustrated '+escape(t.houseBand)+' residence at house level '+art.level+' of 40" width="260" height="260" loading="lazy" decoding="async"></div>'+
  '<div class="town-house-summary"><small class="town-house-kicker">YOUR EMBRYON HOMESTEAD</small><h2>'+escape(art.name)+'</h2><p>'+escape(t.houseBand)+'</p>'+
  '<p>Residence level <strong>'+art.level+'/40</strong> · '+t.plots+' functional growing '+(t.plots===1?'plot':'plots')+'.</p>'+
  '<small>Illustrated house preview; final painted sprites are pending.</small></div></section>';
}
function home(){
 return '<section class="home-kingdom" aria-label="Embryon Kingdom">'+
 '<div class="home-kingdom-content"><h1 class="home-brand"><img class="home-title-art" src="art/embryon/branding/rupee-rush-title.webp" alt="Rupee Rush — Heroes of Embryon" width="1200" height="674" decoding="async"></h1>'+
 '<p class="home-tagline">Gather gemstones, uncover lost treasures, and match your way through a thousand stages.</p>'+
 '<div class="profile-showcase"><div class="profile-portrait"><img class="profile-avatar" alt="Current character" src="'+escape(Economy.BY_ID[saved.cosmeticEquipped.character].image)+'">'+
 (saved.cosmeticEquipped.frame?'<img class="profile-frame" alt="" src="'+escape(Economy.BY_ID[saved.cosmeticEquipped.frame].image)+'">':'')+'</div>'+
 '<div class="profile-outfit"><img alt="Equipped Daysha wardrobe look" src="'+escape(Economy.BY_ID[saved.cosmeticEquipped.outfit].image)+'"></div>'+
 '<div class="profile-label"><b>'+escape(Economy.BY_ID[saved.cosmeticEquipped.character].name)+'</b><small>'+escape(Economy.BY_ID[saved.cosmeticEquipped.outfit].name)+'</small>'+button('open-wardrobe','CUSTOMIZE CHARACTER','secondary')+'</div></div>'+
 '<div class="home-actions">'+button('play-next',icon('crystal')+' PLAY LEVEL '+saved.unlocked,'primary')+button('go-mine',icon('pickaxe')+' ENTER THE MINES','secondary')+button('go-farm','VISIT THE GARDEN','secondary')+'</div></div></section>'+
 '<div class="panels"><section class="panel"><h2>Current expedition</h2><p><b>Stage '+saved.unlocked+'</b> · '+escape(E.makeLevel(saved.unlocked).stageTitle)+'</p><p>'+Object.keys(saved.stars).filter(n=>Number(n)<=1000&&saved.stars[n]>0).length+' stages cleared</p>'+button('go-campaign','CHOOSE A LEVEL')+'</section>'+
 '<section class="panel"><h2>Prism Vale Mines</h2><p>12 daily starter strikes, expandable equipment, refinery, and resource exchanges.</p>'+button('go-mine','MINE FOR SUPPLIES')+'</section>'+ '<section class="panel"><h2>Garden &amp; Farm</h2><p>Plant seeds, harvest crops, expand the homestead, and use magical farming supplies.</p>'+button('go-farm','OPEN GARDEN')+'</section></div>'+townAvatarPanel()+townHousePanel(Garden.summary(saved));
}
function campaign(){
 const entered=Chapters.CHAPTERS.filter(c=>saved.unlocked>=c.start).length;
 return header('Embryon Adventure','Choose one of five underground chapters. Explore all 1,000 stages in order.')+
 '<div class="embryon-map" aria-label="Map of five Embryon chapter entrances">'+
 '<img class="embryon-overview-art" src="'+Chapters.MAP+'" alt="Cave network linking Goblin Caves, Troll Caverns, Sulfur Sumps, Mushroom Mire and Ghost Mines">'+
 Chapters.CHAPTERS.map(c=>'<button class="chapter-hotspot '+(saved.unlocked>=c.start?'open':'pending')+'" style="--x:'+c.x+'%;--y:'+c.y+'%" data-action="open-chapter" data-chapter="'+c.id+'" aria-label="Chapter '+c.id+': '+c.title+(saved.unlocked<c.start?' (stages locked)':'')+'"><span>'+c.id+'</span></button>').join('')+'</div>'+
 '<div class="chapter-cards">'+Chapters.CHAPTERS.map(c=>'<button class="chapter-card" data-action="open-chapter" data-chapter="'+c.id+'"><img alt="" src="'+c.art+'" loading="lazy"><span><b>'+c.id+'. '+c.title+'</b><small>Stages '+c.start+'–'+c.end+' · '+(saved.unlocked>=c.start?'Enter':'Preview — locked')+'</small></span></button>').join('')+'</div>'+
 '<p class="hint">'+entered+' of 5 chapters reached. You may preview later chapters; stages unlock sequentially.</p>'+
 '<section class="panel"><h2>Elemental Trials</h2><p>Bonus challenges unlock alongside your expedition.</p>'+button('go-trials','VIEW TRIALS')+'</section>';
}
function chapter(){
 const c=Chapters.byId(chapterId)||Chapters.CHAPTERS[0];
 const from=Math.min(c.end,c.start+campaignPage*30),to=Math.min(c.end,from+29);
 const levels=Array.from({length:to-from+1},(_,i)=>from+i);
 return '<div class="chapter-banner" style="background-image:linear-gradient(90deg,#0b1239e6,#0b12394a),url(\''+c.art+'\')">'+
 '<h1>'+escape(c.title)+'</h1><p>Chapter '+c.id+' · '+escape(c.description)+'</p>'+button('go-campaign','← FIVE-CHAPTER MAP','quiet')+'</div>'+
 '<div class="panel campaign-bar">'+button('campaign-prev','← Previous','secondary',campaignPage===0?'disabled':'')+'<strong>'+from+'–'+to+' / '+c.end+'</strong>'+button('campaign-next','Next →','secondary',to===c.end?'disabled':'')+'</div>'+
 '<div class="level-grid">'+levels.map(n=>'<button class="level '+(saved.stars[n]?'cleared':n<=saved.unlocked?'unlocked':'locked')+'" data-action="play-level" data-level="'+n+'" '+(n>saved.unlocked?'disabled':'')+' aria-label="Level '+n+(n>saved.unlocked?' locked':'')+'"><b>'+n+'</b><small>'+(saved.stars[n]?'★ '+saved.stars[n]:'')+'</small></button>').join('')+'</div>';
}
function trials(){
 const available=[],locked=[];
 for(let n=T.FIRST;n<=T.LAST;n++){const spec=T.profile(n);if(T.available(saved,n))available.push(spec);else if(!T.done(saved,n))locked.push(spec);}
 const display=available.slice(0,24);
 return header('Elemental Trials','300 optional levels. Crystal powers fire only after the affected gem is actually destroyed.')+
 '<section class="panel"><p>Cleared '+R.summary(saved).completed+' / 300 trials</p><div class="level-grid">'+display.map(x=>'<button class="level unlocked" data-action="play-level" data-level="'+x.id+'"><b>'+x.name.split(' · ')[0]+'</b><small>Trial '+x.local+'</small></button>').join('')+'</div>'+(available.length>24?'<p>Complete available trials to reveal later encounters.</p>':'')+(!display.length?'<p>Progress through the main campaign to unlock your first trial.</p>':'')+'</section>';
}
function start(id){
 if(active)return message('Finish the current board first');
 if(saved.hearts<1)return message('No lives. Visit the mine or shop for a refill.');
 if(bank().remaining<1)return message('No moves left. Mine or claim your next free refill.');
 if(id>=T.FIRST&&!T.available(saved,id))return message('That elemental trial is still locked.');
 if(id<T.FIRST&&(id>saved.unlocked||id<1))return message('Stage locked.');
 active=E.create(id,id*7919+saved.unlocked*17);selected=-1;visualImpact=null;outcome=null;page='game';save();Audio.play('chapter-enter');Audio.speak('levelStart');render();window.RupeeUpdates?.autoCheck();
}
function payload(c){
 if(!c||c.type===null)return '<span class="void"></span>';
 const specialArt={'line-h':'row','line-v':'column',blast:'blast',rainbow:'spectrum'}[c.special]||'starburst';
 const special=c.special?'<span class="gem-special '+escape(c.special)+'" aria-hidden="true"><img class="gem-special-art" alt="" src="'+Assets.booster(specialArt)+'"></span>':'';
 const elemental=c.elemental?'<span class="gem-elemental" title="'+escape(c.elemental)+'">⚡</span>':'';
 const hold=c.hold?'<span class="gem-held" title="Gravity hold">'+c.hold+'↓</span>':'';
 return '<span class="gem-payload">'+gem(c.type)+special+elemental+hold+'</span>';
}
function featureMarkup(g,i){
 const features=g.cfg.features||{},list=[];
 const belt=(features.conveyors||[]).find(f=>f.indices.includes(i));
 const portal=(features.portals||[]).find(f=>f.indices.includes(i));
 const wind=(features.wind||[]).find(f=>f.indices.includes(i));
 if(belt)list.push('<span class="board-feature conveyor" aria-hidden="true"><img class="feature-art" alt="" src="'+Icons.get('conveyor-'+belt.direction)+'"></span>');
 if(portal)list.push('<span class="board-feature portal" aria-hidden="true"><img class="feature-art" alt="" src="'+Icons.get('portal')+'"></span>');
 if(wind){const dir=Features.nextWindDirection(wind,g.turns);list.push('<span class="board-feature wind" aria-label="Next wind gust '+dir+'"><img class="feature-art" alt="" src="'+Icons.get('wind-'+dir)+'"></span>');}
 return list.join('');
}
function piece(cell,index){
 if(!cell||cell.type===null)return '<span class="void"></span>';
 // Board statuses are attached to cells, not to moving gemstone sprites.
 const layers=Shared.layers(cell),fixed=Shared.anchor(cell);
 const status=layers.map(x=>'<span class="tile-status '+x.id+'" data-effect="'+x.id+'"><img class="status-art" src="'+x.src+'" alt="" aria-hidden="true"></span>').join('');
 const anchor=fixed?'<img class="tile-anchor" src="'+fixed.src+'" alt="" aria-hidden="true">':'';
 const readouts=[
  ['ice',cell.ice],['lock',cell.lock],['chest',cell.chest],
  ['resin',cell.jam],['fuse',cell.fuse],['rock',cell.rock],
  ['frozen',cell.frozen],['poison',cell.poison],['ward',cell.ward]
 ].filter(([,n])=>Number(n)>0);
 const counters=readouts.length?'<span class="tile-counts">'+readouts.map(([id,n])=>
  '<b class="status-count" data-status="'+id+'" data-strength="'+Math.trunc(n)+'">'+id.slice(0,1).toUpperCase()+n+'</b>').join('')+'</span>':'';
 return payload(cell)+status+anchor+counters;
}
function selectCell(i){
 const board=root.querySelector?.('.board');
 board?.querySelectorAll?.('.cell.selected').forEach(el=>el.classList.remove('selected'));
 selected=i;
 if(i>=0)board?.querySelector?.('[data-cell="'+i+'"]')?.classList.add('selected');
}
function paintBoard(cells){
 const board=root.querySelector?.('.board');
 if(!board||!active)return;
 for(let i=0;i<cells.length;i++){
  const tile=board.querySelector('[data-cell="'+i+'"]'),cell=cells[i];
  if(!tile)continue;
  const signature=JSON.stringify(cell)+':'+active.turns;
  if(tile.dataset.renderKey!==signature){
   tile.innerHTML=piece(cell,i)+(cell?featureMarkup(active,i):'');
   tile.dataset.renderKey=signature;
   tile.setAttribute('aria-label',cell&&cell.type!==null?'Tile '+(i+1)+' '+E.TYPES[cell.type]+(Shared.label(cell)?', '+Shared.label(cell):''):'Empty tile '+(i+1));
  }
 }
}
function boardSound(kind,count){
 if(kind==='match'||kind==='cascade'){if(count>0)Audio.burst(count,kind==='cascade'?2:1);else Audio.play('match');}
 else Audio.play(({hazard:'blocked',shuffle:'booster',transport:'swap'})[kind]||kind);
}
function animateMove(result,before){
 const game=active,after=E.snapshot(game).cells,board=root.querySelector?.('.board');
 if(!board){settle();render();return;}
 animating=true;root.classList.add?.('board-busy');
 void Motion.resolve({board,before,after,result,width:game.cfg.width,paint:paintBoard,
  sprite:payload,effect:id=>Assets.effect(id),sound:boardSound,
  current:()=>active===game&&page==='game'
 }).catch(err=>{console.error('Board visual recovery:',err);})
 .finally(()=>{animating=false;root.classList.remove?.('board-busy');if(active===game){settle();render();}});
}
function performSwap(a,b){
 if(animating||!active||page!=='game')return;
 if(bank().remaining<1)return message('Daily moves exhausted. Mine for a move pack.');
 const before=E.snapshot(active).cells,result=E.swap(active,a,b);
 selectCell(-1);
 if(!result.valid){Audio.play('blocked');return message('That pair cannot be swapped.');}
 D.spend(saved,1,Date.now(),dailyCap());
 visualImpact=null;save();
 if(result.loops>=3)Audio.speak('cascade');
 animateMove(result,before);
}
function gameplay(){
 const g=active;if(!g)return home();
 const objectives=E.objectiveState(g);
 return header('Level '+g.level+' · '+escape(g.cfg.stageTitle),escape(g.cfg.hint))+
 stats()+'<div class="game-progress"><b>Score '+number(g.score)+' / '+number(g.cfg.goal)+'</b><b>Moves '+g.moves+'</b></div>'+
 '<div class="objectives">'+objectives.map(o=>'<span class="'+(o.done?'done':'')+'">'+escape(o.label)+' '+number(o.value)+'/'+number(o.target)+'</span>').join('')+'</div>'+
 '<div class="board-frame"><div class="board" style="--columns:'+g.cfg.width+'">'+g.cells.map((c,i)=>'<button class="cell '+(!c?'hole ':'')+(selected===i?'selected':'')+'" data-action="cell" data-cell="'+i+'" '+(!c?'disabled':'')+' aria-label="Tile '+(i+1)+(c?' '+E.TYPES[c.type]+(Shared.label(c)?', '+escape(Shared.label(c)):''):' empty')+'">'+piece(c,i)+(c?featureMarkup(g,i):'')+'</button>').join('')+'</div>'+impactMarkup(g)+'</div>'+
 '<p class="hint">Tap two adjacent gems to swap them. Non-matching swaps still use a move. Select a gem before using targeted tools.</p>'+
 '<div class="booster-grid">'+E.BOOSTERS.filter(id=>P.unlocked(saved,id)).map(id=>'<button class="booster" data-action="booster" data-booster="'+id+'" '+(P.count(saved,id)<1?'disabled':'')+' title="'+escape(E.BOOSTER_META[id].tip)+'">'+boosterIcon(id,36)+'<b>'+escape(E.BOOSTER_META[id].label)+'</b><small>×'+P.count(saved,id)+'</small></button>').join('')+'</div>'+
 button('abandon','LEAVE BOARD','quiet');
}
function settle(){
 if(!active)return;
 const g=active;
 if(g.won){
  const id=g.level,trial=id>=T.FIRST;
  let earned=0,bonus=0;
  if(trial){const result=R.clear(saved,id,g.score);earned=result.coins||0;bonus=result.gems||0;}
  else {
   const prev=saved.stars[id]||0,starCount=g.score>=g.cfg.goal*2?3:g.score>=g.cfg.goal*1.35?2:1;
   saved.stars[id]=Math.max(prev,starCount);
   if(!prev){earned=100+Math.floor(id/5);bonus=id%5===0?2:0;saved.coins+=earned;saved.gems+=bonus;}
   saved.unlocked=Math.min(1000,Math.max(saved.unlocked,id+1));
   P.firstClear(saved,id);
  }
  outcome={won:true,id,earned,bonus,score:g.score};
 }else if(g.lost){saved.hearts=Math.max(0,saved.hearts-1);outcome={won:false,id:g.level,score:g.score};}
 else return;
 Audio.play(g.won?'victory':'defeat');Audio.speak(g.won?'levelVictory':'levelDefeat');active=null;selected=-1;page='result';save();
}
function results(){
 const x=outcome;if(!x)return home();
 return header(x.won?'Brilliant!':'Try again',x.won?'The vault yields its treasures.':'The crystal board held firm this time.')+
 '<div class="hero"><div class="hero-art">'+(x.won?'<img class="result-vfx" src="'+Assets.effect('victory')+'" alt="">':'')+[0,1,6].map(i=>gem(i)).join('')+'</div><h2>Score: '+number(x.score)+'</h2>'+
 (x.won?'<p>+'+number(x.earned)+' Rupees · +'+number(x.bonus)+' Star Gems</p>':'<p>One life used. Mine resources or claim a refill to keep playing.</p>')+
 button('result-next',x.won?'NEXT LEVEL':'RETRY LEVEL','primary')+button('go-mine','VISIT THE MINES')+button('go-campaign','LEVEL MAP','quiet')+'</div>';
}
function offerCard(id,o){
 const balance=o.currency==='gems'?saved.gems:saved.coins;
 return '<div class="shop-item">'+icon(o.kind==='hearts'?'heart':'extra',38)+'<strong>'+escape(o.name)+'</strong><small>'+o.amount+' '+(o.kind==='hearts'?'life/lives':'moves')+'</small>'+
 button('buy-currency',(o.currency==='gems'?'STAR GEMS ':'RUPEES ')+number(o.cost),'primary','data-offer="'+id+'" '+(balance<o.cost?'disabled':''))+'</div>';
}
function shop(){
 const tabs=[['packs','Loot Chests'],['boosters','Game Power-Ups'],['supplies','Supplies'],['character','Characters'],['outfit','Outfits'],['pickSkin','Pick Skins'],['gloveSkin','Glove Skins'],['frame','Frames']];
 const nav='<div class="mine-tabs shop-tabs">'+tabs.map(([id,label])=>button('shop-tab',label,shopTab===id?'primary':'secondary','data-shop-tab="'+id+'"')).join('')+'</div>';
 let content='';
 if(shopTab==='packs'){
  content='<p class="hint">Every chest contains actual randomized rewards. Listed percentages are per independent roll; duplicates convert to Style Shards. All purchases use earned in-game currency.</p><div class="shop-grid">'+
  Object.entries(Economy.PACKS).map(([id,p])=>{
   const bal=saved[p.currency],table=Economy.odds(id).map(x=>x.kind.replace(/([A-Z])/g,' $1')+' '+x.percent+'%').join(' · ');
   return '<div class="shop-item loot-card"><img class="market-art" alt="" src="art/nutvale/mining-economy/currency/'+(p.pool==='vanity'?'gemmed-currency-chest':p.pool==='expedition'?'gold-coin-chest':'rainbow-coin-stacks')+'.png" loading="lazy">'+
   '<strong>'+escape(p.name)+'</strong><small>'+escape(p.description)+'</small><small class="odds">Per draw: '+escape(table)+'</small>'+
   button('buy-pack',number(p.cost)+' '+Economy.CURRENCY[p.currency],'primary','data-pack="'+id+'" '+(bal<p.cost?'disabled':''))+'</div>';
  }).join('')+'</div>';
 }else if(shopTab==='boosters'){
  content='<p class="hint">Each minigame has its own real consumables. Farming power-ups modify crops, mining tools affect excavation, and match-3 boosters work on gem boards. All items use earned in-game currencies.</p>'+
  Object.entries(Powerups.BUNDLES).map(([id,p])=>'<div class="shop-item mode-bundle"><strong>'+escape(p.name)+'</strong><small>'+escape(p.family.toUpperCase())+' · '+(p.matchCount?p.matchCount+' match-3 boosters':Object.entries(p.contents).map(([id,q])=>q+' × '+Powerups.CATALOG[id].name).join(', '))+'</small>'+
    button('buy-mode-bundle',number(p.cost)+' '+Economy.CURRENCY[p.currency],'primary','data-bundle="'+id+'" '+(saved[p.currency]<p.cost?'disabled':''))+'</div>').join('')+
  ['farm','mine'].map(family=>'<h2 class="subhead">'+(family==='farm'?'Farming Power-Ups':'Mining Power-Ups')+'</h2><div class="shop-grid">'+
    Object.values(Powerups.CATALOG).filter(p=>p.family===family).map(p=>'<div class="shop-item"><img class="powerup-art" src="'+escape(modePowerArt(p))+'" alt=""><strong>'+escape(p.name)+'</strong><small>'+escape(p.description)+'</small><small>Owned ×'+Powerups.count(saved,p.id)+'</small>'+
    button('buy-mode-power',p.price+' RUPEES','primary','data-power="'+p.id+'" '+(saved.coins<p.price?'disabled':''))+'</div>').join('')+'</div>').join('')+
  '<h2 class="subhead">Match-3 Power-Ups</h2><div class="shop-grid">'+E.BOOSTERS.map(id=>'<div class="shop-item">'+boosterIcon(id,42)+'<strong>'+escape(E.BOOSTER_META[id].label)+'</strong><small>Owned ×'+P.count(saved,id)+'</small>'+
    button('buy-booster',P.BOOSTER_PRICES[id]+' RUPEES','primary','data-booster="'+id+'" '+(!P.unlocked(saved,id)||saved.coins<P.BOOSTER_PRICES[id]?'disabled':''))+'</div>').join('')+'</div>';
 }else if(shopTab==='supplies'){
  content='<h2 class="subhead">Lives &amp; moves</h2><div class="shop-grid">'+Object.entries(P.SHOP_EXCHANGES).map(([id,o])=>offerCard(id,o)).join('')+'</div>'+
  '<h2 class="subhead">Booster supplies</h2><div class="shop-grid">'+E.BOOSTERS.map(id=>'<div class="shop-item">'+boosterIcon(id,39)+'<strong>'+escape(E.BOOSTER_META[id].label)+'</strong><small>Stock ×'+P.count(saved,id)+'</small>'+
   button('buy-booster','1 · '+number(P.BOOSTER_PRICES[id])+' RUPEES','secondary','data-booster="'+id+'" '+(!P.unlocked(saved,id)||saved.coins<P.BOOSTER_PRICES[id]?'disabled':''))+
   button('buy-gem-booster','4 · '+P.GEM_BOOSTER_PRICES[id]+' STAR GEMS','primary','data-booster="'+id+'" '+(!P.unlocked(saved,id)||saved.gems<P.GEM_BOOSTER_PRICES[id]?'disabled':''))+'</div>').join('')+'</div>';
 }else{
  const list=Economy.CATALOG.filter(item=>item.type===shopTab);
  content='<p class="hint">'+list.length+' distinct collectibles · Purchase with Style Shards only. Characters and visual skins do not change combat, mining yield, or power.</p>'+
   '<div class="shop-grid">'+list.map(item=>{
     const owned=!!saved.cosmeticsOwned[item.id],equipped=saved.cosmeticEquipped[item.type]===item.id;
     return '<div class="shop-item cosmetic-card"><img class="cosmetic-art" src="'+escape(item.image)+'" alt="'+escape(item.name)+'" loading="lazy">'+
      '<strong>'+escape(item.name)+'</strong><small>'+escape(item.rarity.toUpperCase())+' · '+item.cost+' Style Shards</small>'+
      (owned?button('equip-cosmetic',equipped?'EQUIPPED':'EQUIP','secondary','data-cosmetic="'+item.id+'" '+(equipped?'disabled':'')):
      button('buy-cosmetic','UNLOCK · '+item.cost+' SHARDS','primary','data-cosmetic="'+item.id+'" '+(saved.styleShards<item.cost?'disabled':'')))+'</div>';
   }).join('')+'</div>';
 }
 return '<div class="location-banner location-market">'+header('Crystal Market','Loot chests, character discoveries, wardrobe looks, equipment skins and practical supplies.')+'</div>'+stats()+
 '<p class="hint">Style Shards are cosmetics-only. Rupees and Star Gems remain gameplay currencies.</p>'+
 (shopReceipt?'<div class="reward-receipt" role="status"><b>'+escape(shopReceipt.title)+'</b><p>'+shopReceipt.lines.map(escape).join(' · ')+'</p>'+button('dismiss-receipt','DISMISS','quiet')+'</div>':'')+
 nav+content;
}
function modePowerArt(p){return p.family==='farm'?(FarmArt.powerup(p.id)||p.art):p.art;}
function farmEquipmentPreview(){
 const items=[['hoe','Hoe'],['watering-can','Watering Can'],['deluxe-sprinkler','Irrigation'],['greenhouse','Greenhouse'],['compost-bin','Compost Bin'],['harvest-basket','Harvest Basket']];
 return '<h2 class="subhead">Farm Equipment Collection</h2><p class="hint">Artwork ready for future equipment upgrades. These are previews, not purchases or upgrades.</p>'+
 '<div class="farm-art-shelf">'+items.map(([id,label])=>'<div class="farm-art-entry"><img loading="lazy" src="'+FarmArt.equipment(id)+'" alt=""><small>'+label+'</small></div>').join('')+'</div>';
}
function kitchenPreview(){
 const holdings=Kitchen.pantry(saved),planned=Kitchen.RECIPES,allRecipes=Cook.list(saved,Date.now(),dailyCap()),ready=allRecipes.filter(r=>r.house<=saved.town.houseLevel),stored=allRecipes.filter(r=>r.stored>0);
 const names={hearts:'1 life',moves:'3 daily moves',strikes:'3 bonus mining strikes',scans:'2 bonus surveys',farmPower:'1 farming power-up',matchBooster:'1 match-3 booster'};
 const pantry='<div class="farm-art-shelf">'+holdings.filter(item=>item.quantity>0).map(item=>
  '<div class="farm-art-entry pantry-entry"><img loading="lazy" src="'+item.art+'" alt=""><strong>'+escape(item.name)+'</strong><small>Stored ×'+number(item.quantity)+'</small></div>').join('')+'</div>';
 const scene=(room,title,description)=>'<div class="kitchen-room-banner kitchen-room-'+room+'">'+
  '<img class="kitchen-room-art" loading="lazy" decoding="async" src="art/embryon/town/kitchen/'+room+'-room.webp" alt="'+
  (room==='kitchen'?'A welcoming fantasy kitchen with a warm stone hearth, stocked shelves and a food preparation table':
   'A cozy blue-and-gold dining room with candlelit tables, a fireplace and mountain views')+'">'+
  '<div class="kitchen-room-heading"><h3>'+title+'</h3><p>'+description+'</p></div></div>';
 const cooking='<section class="kitchen-room-section" aria-label="Cooking kitchen">'+
  scene('kitchen','Hearthside Kitchen','Prepare meals from your harvested ingredients. Cooked food stays in storage until served.')+
  '<div class="farm-recipe-grid">'+ready.map(r=>{
   const locked=saved.town.houseLevel<r.house,contents=r.ingredients.map(x=>x.quantity+' × '+escape(Kitchen.get(x.item)?.name||x.item)+' ('+x.owned+' owned)').join(' · ');
   return '<div class="farm-recipe kitchen-ready"><img loading="lazy" src="'+r.art+'" alt=""><span>'+
    '<b>'+escape(r.name)+'</b><small>'+contents+'</small><small>House '+r.house+' · '+names[r.reward.kind]+'</small>'+
    '<small>Prepared: '+r.stored+(locked?' · House upgrade required':'')+'</small></span>'+
    button('kitchen-cook','COOK 1','secondary','data-recipe="'+r.id+'" '+(r.cook.valid?'':'disabled'))+'</div>';
  }).join('')+'</div></section>';
 const dining='<section class="kitchen-room-section" aria-label="Dining room">'+
  scene('dining','Cozy Dining Room','Serve prepared meals to receive farming, match-three, or mining benefits.')+
  '<div class="farm-recipe-grid">'+(stored.length?stored:ready.slice(0,3)).map(r=>
   '<div class="farm-recipe kitchen-ready"><img loading="lazy" src="'+r.art+'" alt=""><span>'+
   '<b>'+escape(r.name)+'</b><small>Prepared portions: '+r.stored+'</small>'+
   '<small>Serving benefit: '+names[r.reward.kind]+'</small></span>'+
   button('kitchen-serve','SERVE 1','primary','data-recipe="'+r.id+'" '+(r.serve.valid?'':'disabled'))+'</div>'
  ).join('')+'</div></section>';
 const future='<section class="kitchen-future"><h3 class="subhead">Future Recipe Concepts</h3>'+
 '<p class="hint">These recipes are previews only until their ingredients and processing systems are implemented.</p>'+
 '<div class="farm-recipe-grid">'+planned.map(recipe=>
  '<div class="farm-recipe"><img loading="lazy" src="'+Kitchen.image(recipe.output)+'" alt=""><span><b>'+escape(recipe.name)+'</b>'+
   '<small>Planned: '+recipe.ingredients.map(x=>x.quantity+' × '+escape(Kitchen.get(x.item).name)).join(' + ')+'</small>'+
   '<small>Cooking not yet available</small></span></div>').join('')+'</div></section>';
 return '<section class="farm-kitchen" aria-label="Kitchen and dining"><h2 class="subhead">Kitchen Pantry</h2>'+
  '<p class="hint">'+holdings.length+' farm ingredients · '+ready.length+' recipes available · '+(allRecipes.length-ready.length)+' to unlock. Cooking spends crops and stores meals; serving applies the reward separately. Full lives or capped rewards do not consume stored meals.</p>'+
  pantry+cooking+dining+future+'</section>';
}
function modePowerCards(family){
 return '<div class="shop-grid mode-power-list">'+Object.values(Powerups.CATALOG).filter(p=>p.family===family).map(p=>
  '<div class="shop-item mode-power-card"><img class="powerup-art" src="'+escape(modePowerArt(p))+'" alt=""><strong>'+escape(p.name)+'</strong><small>'+escape(p.description)+'</small><small>In bag: '+Powerups.count(saved,p.id)+'</small>'+
  button('use-mode-power',p.targeted?'USE ON SELECTED '+(family==='farm'?'PLOT':'ROCK'):'ACTIVATE','primary','data-power="'+p.id+'" '+(Powerups.count(saved,p.id)<1?'disabled':''))+'</div>').join('')+'</div>';
}
function farm(){
 const t=Garden.summary(saved),seeds=Object.values(Garden.CROPS),feeds=Object.values(Garden.FERTILIZERS),time=Date.now();
 const unlocked=seeds.filter(c=>t.houseLevel>=c.house),categories=['all',...Garden.CATEGORIES.filter(cat=>unlocked.some(c=>c.category===cat))],
  filtered=unlocked.filter(c=>farmCategory==='all'||c.category===farmCategory);
 const cats='<div class="farm-categories" role="group" aria-label="Filter farm crop catalog">'+categories.map(cat=>button('farm-category',(cat==='all'?'All Crops':cat[0].toUpperCase()+cat.slice(1))+' · '+(cat==='all'?unlocked.length:unlocked.filter(c=>c.category===cat).length),farmCategory===cat?'primary':'secondary','data-category="'+cat+'"')).join('')+'</div>';
 const seedSelect=cats+'<div class="farm-seed-grid">'+filtered.map(c=>'<button class="farm-seed-choice '+(farmCrop===c.id?'selected':'')+'" data-action="farm-crop" data-crop="'+c.id+'" aria-pressed="'+(farmCrop===c.id)+'"><img src="'+FarmArt.harvest(c.id)+'" alt="" loading="lazy"><span><strong>'+escape(c.name)+'</strong><small>×'+t.seeds[c.id]+' seeds · '+Math.round(c.growMs/60000)+' min</small><small>Yield '+c.yield+' · '+c.sellEach+' Rupees each</small></span></button>').join('')+'</div>';
 const coming=seeds.filter(c=>c.house>t.houseLevel).sort((a,b)=>a.house-b.house).slice(0,8);
 const unlockPreview=coming.length?'<section class="farm-unlock-preview" aria-label="Upcoming seeds and house levels"><h2 class="subhead">Seed Almanac · Coming Soon</h2><p class="hint">More species become available as your residence improves. These are real future seed unlocks, not shop purchases yet.</p><div class="farm-seed-grid">'+coming.map(c=>'<div class="farm-seed-choice farm-seed-locked"><img src="'+FarmArt.harvest(c.id)+'" alt="" loading="lazy"><span><strong>'+escape(c.name)+'</strong><small>Unlock: House '+c.house+'</small><small>'+escape(c.category)+' · '+Math.round(c.growMs/60000)+' min</small></span></div>').join('')+'</div></section>':'';
 const feedSelect='<div class="farm-selector">'+button('farm-feed','No Fertilizer',farmFeed===''?'primary':'secondary','data-feed="none"')+
 feeds.filter(f=>t.houseLevel>=f.house).map(f=>button('farm-feed',f.name+' · '+t.fertilizers[f.id],farmFeed===f.id?'primary':'secondary','data-feed="'+f.id+'"')).join('')+'</div>';
 const plots='<div class="farm-grid">'+Array.from({length:8},(_,i)=>t.slots[i]||{state:'locked'}).map((p,i)=>{
  const isSelected=i===farmPlot,which=p.crop&&Garden.CROPS[p.crop],ready=p.state==='ready',
   picture=which?CropGrowth.fromStatus(p):null;
  const detail=p.state==='empty'?'Available':ready?'READY TO HARVEST':p.state==='locked'?'Locked':p.state.toUpperCase()+' · '+Math.ceil(Math.max(0,p.readyAt-time)/60000)+' min';
  const phase=['locked','empty','seed','sprout','growing','maturing','ready'].includes(p.state)?p.state:'empty';
  const bed='<span class="farm-bed-scene state-'+phase+'" aria-hidden="true"><img class="farm-bed-base" src="'+FarmArt.equipment('garden-plot')+'" alt="" loading="lazy">'+
    (picture?'<img class="farm-bed-crop" src="'+picture+'" alt="" loading="lazy" decoding="async">':'')+
    (p.fertilizer?'<span class="farm-bed-fertilized">✧</span>':'')+'</span>';
  return '<div class="farm-plot '+(isSelected?'selected':'')+'"><button class="farm-plot-pick" data-action="farm-plot" data-plot="'+i+'" aria-pressed="'+isSelected+'" '+(p.state==='locked'?'disabled aria-disabled="true"':'')+'>'+bed+'<b>Plot '+(i+1)+'</b><small>'+detail+'</small>'+
   (which?'<small>'+escape(which.name)+' · yield '+p.yield+'</small>':'')+'</button>'+
   (p.state==='empty'?button('farm-plant','PLANT','primary','data-plot="'+i+'" '+(!t.seeds[farmCrop]||(farmFeed&&!t.fertilizers[farmFeed])?'disabled':'')):
    ready?button('farm-harvest','HARVEST +'+p.yield,'primary','data-plot="'+i+'"'):'')+'</div>';
 }).join('')+'</div>';
 return '<div class="location-banner location-garden">'+header('Embryon Garden','Grow supplies, expand your homestead, and activate farm-specific power-ups.')+'</div>'+townAvatarPanel()+stats()+townHousePanel(t)+
 '<div class="panel"><h2>'+escape(t.houseBand)+' · House '+t.houseLevel+'/40</h2><p>'+t.plots+' growing plots available. House upgrades unlock more crops, fertilizers, and plots.</p>'+
 button('farm-upgrade',t.nextUpgradeCost===null?'FULLY UPGRADED':'UPGRADE HOUSE · '+number(t.nextUpgradeCost)+' RUPEES','secondary',t.nextUpgradeCost===null||saved.coins<t.nextUpgradeCost?'disabled':'')+'</div>'+
 '<h2 class="subhead">Growing Plots · '+unlocked.length+'/'+seeds.length+' crops unlocked</h2><p class="hint">Choose seeds and optional fertilizer, then plant an empty plot. Select a plot before using targeted garden magic.</p>'+
 seedSelect+feedSelect+plots+unlockPreview+
 '<h2 class="subhead">Buy Seeds &amp; Fertilizer</h2><div class="shop-grid">'+filtered.map(c=>'<div class="shop-item"><img class="powerup-art" src="'+FarmArt.harvest(c.id)+'" loading="lazy" alt=""><strong>'+escape(c.name)+'</strong><small>Unlocks at house '+c.house+' · '+escape(c.category)+'</small><small>Seed stock '+t.seeds[c.id]+' · '+c.seedCost+' Rupees</small>'+
 button('farm-buy-seed','BUY 1','secondary','data-crop="'+c.id+'" data-qty="1" '+(saved.coins<c.seedCost?'disabled':''))+
 button('farm-buy-seed','BUY 5','secondary','data-crop="'+c.id+'" data-qty="5" '+(saved.coins<c.seedCost*5?'disabled':''))+'</div>').join('')+
 feeds.filter(f=>t.houseLevel>=f.house).map(f=>'<div class="shop-item"><img class="powerup-art" src="art/embryon/town/gardening/icons/'+({compost:'fertilizer-compost.png',quality:'fertilizer-enriched.png',royal:'fertilizer-crystal-tonic.png'}[f.id])+'" alt=""><strong>'+escape(f.name)+'</strong><small>Stock '+t.fertilizers[f.id]+' · '+f.cost+' Rupees</small>'+
 button('farm-buy-feed','BUY 1','secondary','data-feed="'+f.id+'" '+(saved.coins<f.cost?'disabled':''))+'</div>').join('')+'</div>'+
 '<h2 class="subhead">Harvest Store</h2><div class="shop-grid">'+seeds.filter(c=>t.harvest[c.id]>0).map(c=>'<div class="shop-item"><img class="farm-item-art" loading="lazy" src="'+FarmArt.harvest(c.id)+'" alt=""><strong>'+escape(c.name)+'</strong><small>'+t.harvest[c.id]+' harvested · '+c.sellEach+' Rupees each</small>'+
 button('farm-sell','SELL ALL','secondary','data-crop="'+c.id+'" '+(!t.harvest[c.id]?'disabled':''))+'</div>').join('')+'</div>'+
 '<h2 class="subhead">Farming Power-Ups</h2><p class="hint">Selected plot: '+(farmPlot+1)+' · Consumables do not replace fertilizers or building upgrades.</p>'+
 modePowerCards('farm')+button('farm-shop','SHOP FOR GARDEN POWER-UPS','secondary')+kitchenPreview()+farmEquipmentPreview();
}

function mine(){
 const s=Mining.stats(saved),prices=Mining.prices(saved),cells=Mining.currentBoard(saved);
 const tabs=['dig','equipment','refinery','exchange','powerups'];
 let content='';
 if(mineTab==='dig'){
  content='<div class="mine-stats"><span>'+'<img class="mine-tool-art" alt="Current pickaxe" src="'+escape((Economy.BY_ID[saved.cosmeticEquipped.pickSkin]?.image||G.entry('pickaxe',s.pickTier).image))+'"> '+s.strikesLeft+'/'+s.strikeMax+' strikes +'+s.bonusStrikes+' bonus</span><span>'+'<img class="mine-tool-art" alt="Current survey gloves" src="'+escape((Economy.BY_ID[saved.cosmeticEquipped.gloveSkin]?.image||G.entry('gloves',s.gloveTier).image))+'"> '+s.scansLeft+'/'+s.scanMax+' surveys +'+s.bonusScans+' bonus</span><span><img class="mine-counter-art" src="art/nutvale/mining-economy/goods/crate-mining-supplies.png" alt=""> '+s.cartOre+'/'+s.cartMax+' cart</span><span><img class="mine-counter-art" src="art/embryon/runtime/gems/onyx.webp" alt=""> '+s.ore+' ore</span></div>'+
  '<div class="tool-row mine-action-row">'+button('mine-mode-dig','<img class="mine-action-art" src="'+escape(G.entry('pickaxe',s.pickTier).image)+'" alt="">EXCAVATE',mineMode==='dig'?'primary':'secondary')+button('mine-mode-scan','<img class="mine-action-art" src="'+escape(G.entry('gloves',s.gloveTier).image)+'" alt="">SURVEY',mineMode==='scan'?'primary':'secondary')+button('mine-mode-focus','<img class="mine-action-art" src="art/primary/blockers/rock.png" alt="">TARGET ROCK',mineMode==='focus'?'primary':'secondary')+button('mine-unload','<img class="mine-action-art" src="art/nutvale/mining-economy/goods/crate-mining-supplies.png" alt="">UNLOAD CART','secondary',s.cartOre?'':'disabled')+'</div>'+
  '<div class="mine-frame"><div class="mine-board" style="--mine-columns:'+s.size+'">'+cells.map(c=>'<button data-action="mine-cell" data-x="'+c.x+'" data-y="'+c.y+'" class="rock '+(c.done?'revealed ':'')+(c.exposed?'exposed ':'')+(mineFocus?.x===c.x&&mineFocus?.y===c.y?'focused ':'')+'" aria-label="Mine tile '+(c.x+1)+','+(c.y+1)+'" title="'+(c.done?(c.exposed?'Collect '+c.exposed+' ore':c.kind):'Rock '+c.hits+'/'+c.hardness)+'">'+(c.exposed?'<img class="mine-reward-sprite" src="art/embryon/runtime/gems/diamond.webp" alt="Crystal ore waiting for collection">':c.done?(c.kind==='barren'?'':'<img class="mine-reward-sprite" src="art/embryon/runtime/gems/'+({ordinary:'onyx',rich:'garnet',crystal:'diamond'}[c.kind]||'onyx')+'.webp" alt="Excavated '+escape(c.kind)+' ore">'):'<span class="mine-rock-face damage-'+Math.min(2,c.hits)+'" aria-hidden="true">'+(c.hits?['a','b','c'].map(part=>'<img class="mine-rock-chunk mine-rock-chunk-'+part+'" src="art/primary/blockers/rock.png" alt="" draggable="false">').join(''):'<img class="mine-rock-base" src="art/primary/blockers/rock.png" alt="" draggable="false">')+'</span>'+(c.survey==='ore'?'<img class="mine-survey-indicator" src="art/embryon/runtime/gems/diamond.webp" alt="" draggable="false">':''))+'<small>'+(c.exposed?'ORE ×'+c.exposed:c.done?(c.kind==='barren'?'EMPTY':'CLEARED'):c.survey==='ore'?'ORE HERE':c.survey==='barren'?'BARREN':c.hits+'/'+c.hardness)+'</small></button>').join('')+'</div></div>'+
  '<p class="hint">Site '+(s.site+1)+' · '+s.size+'×'+s.size+' tiles. Barren rocks are genuine empty results; completed sites regenerate only after all uncovered ore is collected.</p>';
 }else if(mineTab==='equipment'){
  content='<div class="upgrade-list">'+[
   ['pickaxe','Pickaxe','pickTier',s.pickTier,39,prices.pickaxe.nextCost,G.dailyLimit('pickaxe',s.pickTier)+' strikes/day'],
   ['gloves','Survey Gloves','gloveTier',s.gloveTier,39,prices.gloves.nextCost,G.dailyLimit('gloves',s.gloveTier)+' surveys/day'],
   ['mineTier','Mine Map','mineTier',s.mineTier,5,prices.mineTier.cost,s.size+'×'+s.size+' site'],
   ['cartTier','Ore Cart','cartTier',s.cartTier,5,prices.cartTier.cost,s.cartMax+' capacity'],
   ['refineryTier','Crystal Refinery','refineryTier',s.refineryTier,5,prices.refineryTier.cost,Mining.SALE[s.refineryTier]+' credits/parcel']
  ].map(([id,name,key,level,max,cost,detail])=>'<div class="upgrade"><div>'+((id==='pickaxe'||id==='gloves')?'<img class="mine-gear-art" alt="'+name+'" src="'+escape(G.entry(id,level).image)+'">':icon(id==='cartTier'?'cart':id==='mineTier'?'mine':'gear',35))+'</div><div class="upgrade-name"><b>'+name+'</b><small>Tier '+(level+1)+'/'+(max+1)+' · '+detail+'</small></div>'+button('mine-upgrade',cost===null?'MAX TIER':number(cost)+' CREDITS','secondary','data-track="'+id+'" '+(cost===null||s.dollars<cost?'disabled':''))+'</div>').join('')+'</div>';
 }else if(mineTab==='refinery'){
  content='<div class="mine-stats"><span>'+icon('crystal',22)+' Ore '+number(s.ore)+'</span><span>'+icon('gem',22)+' Polished '+number(s.metal)+'</span><span>'+icon('parcel',22)+' Parcels '+number(s.goods)+'</span></div>'+
  '<div class="upgrade-list"><div class="upgrade"><img class="mine-economy-art" src="'+MineArt.path('currency','rainbow-coins')+'" alt=""><div class="upgrade-name"><b>Polish crystal</b><small>'+Mining.ORE_PER_METAL[s.refineryTier]+' raw ore → 1 polished crystal</small></div>'+button('mine-refine','POLISH ONE','primary',s.ore<Mining.ORE_PER_METAL[s.refineryTier]?'disabled':'')+'</div>'+
  '<div class="upgrade"><img class="mine-economy-art" src="'+MineArt.goods(s.refineryTier)+'" alt=""><div class="upgrade-name"><b>Pack crystal parcels</b><small>2 polished crystals → 1 trade parcel</small></div>'+button('mine-craft','PACK ONE','primary',s.metal<2?'disabled':'')+'</div>'+
  '<div class="upgrade"><img class="mine-economy-art" src="'+MineArt.goods(s.refineryTier)+'" alt=""><div class="upgrade-name"><b>Sell crystal parcel</b><small>1 parcel → '+Mining.SALE[s.refineryTier]+' mining credits</small></div>'+button('mine-sell','SELL ONE','primary',s.goods<1?'disabled':'')+'</div></div>';
 }else if(mineTab==='powerups'){
  content='<p class="hint">Targeted tools use the marked rock. Mark a rock in the DIG tab first; explosives and surveys do not consume ordinary strikes or scans.</p>'+ (mineFocus?'<p class="hint">Target: column '+(mineFocus.x+1)+', row '+(mineFocus.y+1)+'</p>':'<p class="hint">No rock targeted yet.</p>')+modePowerCards('mine')+button('mine-tab','RETURN TO DIG','secondary','data-tab="dig"');
 }else{
  content='<p class="hint">Sell crafted crystal parcels for mining credits, then buy supplies usable immediately in the match-3 campaign.</p>'+
   '<div class="shop-grid">'+Object.entries(Bridge.OFFERS).map(([id,o])=>'<div class="shop-item">'+icon(o.icon,38)+'<strong>'+escape(o.label)+'</strong><small>'+number(o.cost)+' mining credits</small>'+button('mine-buy','CLAIM SUPPLIES','primary','data-offer="'+id+'" '+(s.dollars<o.cost?'disabled':''))+'</div>').join('')+'</div>';
 }
 return '<div class="location-banner location-mine">'+header('Prism Vale Mines','Available from the start. Mine crystal ore, refine it, and turn the proceeds into match-3 supplies.')+'</div>'+ 
 '<div class="mine-wallet"><img class="mine-economy-art" alt="" src="'+MineArt.credits(s.dollars)+'"> <b>'+number(s.dollars)+'</b> Mining Credits</div>'+
 '<div class="mine-tabs">'+tabs.map(t=>button('mine-tab',t.toUpperCase(),mineTab===t?'primary':'secondary','data-tab="'+t+'"')).join('')+'</div>'+content;
}
function rewards(){
 const h=B.remaining(saved,'hearts'),m=B.remaining(saved,'moves'),daily=Economy.dailyState(saved);
 const timer=ms=>ms?B.countdown(ms):'READY';
 return header('Daily Rewards','Free daily treasure with currency variety, cosmetics, boosters and possible free upgrades. Existing 12-hour refills stay available.')+stats()+
 '<div class="panel daily-treasure"><img class="market-art" alt="" src="art/nutvale/mining-economy/currency/gemmed-currency-chest.png"><div><h2>Daily Mystery Chest</h2><p>One weighted draw daily. Possible outcomes: Rupees, Star Gems, Style Shards, Mining Credits, boosters, cosmetics, characters and permanent mining upgrades.</p>'+
 '<small class="odds">'+Economy.odds('basic').map(o=>escape(o.kind)+' '+o.percent+'%').join(' · ')+'</small>'+
 button('claim-daily',daily.ready?'OPEN FREE CHEST':'ALREADY CLAIMED TODAY','primary',daily.ready?'':'disabled')+'</div></div>'+
 (shopReceipt?'<div class="reward-receipt" role="status"><b>'+escape(shopReceipt.title)+'</b><p>'+shopReceipt.lines.map(escape).join(' · ')+'</p>'+button('dismiss-receipt','DISMISS','quiet')+'</div>':'')+
 '<div class="shop-grid"><section class="panel">'+icon('heart',40)+'<h2>Life Refill</h2><p>Return to five hearts.</p>'+button('claim-hearts',h?timer(h):'CLAIM REFILL','primary',h||saved.hearts>=5?'disabled':'')+'</section>'+
 '<section class="panel">'+icon('extra',40)+'<h2>Move Refill</h2><p>Add five to the current daily move bank.</p>'+button('claim-moves',m?timer(m):'CLAIM +5 MOVES','primary',m?'disabled':'')+'</section></div>'+
 (saved.rewardHistory.length?'<div class="panel reward-history"><h2>Recent Finds</h2>'+saved.rewardHistory.slice(0,6).map(h=>'<p><b>'+escape(h.label)+'</b> · '+h.items.map(escape).join(', ')+'</p>').join('')+'</div>':'');
}
function settings(){
 return header('Settings','Independent local game data. No Nut Buster saves or accounts are accessed.')+
 '<div class="panel sound-controls"><h2>Embryon sound</h2>'+button('toggle-sfx',Audio.settings().sfx?'SOUND EFFECTS: ON':'SOUND EFFECTS: OFF')+button('toggle-music',Music.settings().music?'MUSIC: ON':'MUSIC: OFF')+button('toggle-voice',Audio.settings().voice?'EMBRYON ANNOUNCER: ON':'EMBRYON ANNOUNCER: OFF')+'<p>Frozen Glow 2 plays as looping, offline background music independently of original crystal sound effects and optional device narration.</p></div>'+
 '<div class="panel app-updates"><h2>Android updates</h2><p>Signed Android builds check GitHub test releases automatically. Both downloading and installation require your approval; installing over this app preserves saved progress.</p>'+button('check-updates','CHECK FOR UPDATES','primary')+button('view-releases','VIEW GITHUB RELEASES','secondary')+'<p class="hint" role="status" data-update-status></p></div>'+
 '<div class="panel"><h2>Game data</h2><p>Your progress, mine equipment, balances and boosters are saved locally on this device.</p>'+button('advanced',advanced?'HIDE ADVANCED SETTINGS':'ADVANCED SETTINGS','secondary')+
 (advanced?'<div class="danger"><h3>Account maintenance</h3><p>Emergency testing only. Reset deletes all Rupee Rush progress from this device.</p>'+
 button('reset-start','ACCOUNT RESET','quiet')+(resetStep?'<p class="warning">This deletes every stage clear, item, currency and mining upgrade.</p>'+button('reset-confirm',resetStep===1?'CONTINUE TO FINAL CONFIRMATION':'ERASE RUPEE RUSH DATA','danger')+button('reset-cancel','CANCEL','secondary'):'')+'</div>':'')+'</div>';
}
function render(){
 P.migrate(saved);Mining.ensure(saved);Garden.ensure(saved);Cook.ensure(saved);Powerups.ensure(saved);Economy.ensure(saved);bank();
 wallet.textContent=number(saved.coins);stars.textContent=number(saved.gems);if(styles)styles.textContent=number(saved.styleShards);
 root.innerHTML=(active&&page!=='game'?'<div class="resume-bar">'+button('resume-board','RESUME LEVEL '+active.level,'primary')+'</div>':'')+(page==='home'?home():page==='campaign'?campaign():page==='chapter'?chapter():page==='trials'?trials():page==='game'?gameplay():
  page==='result'?results():page==='shop'?shop():page==='mine'?mine():page==='farm'?farm():page==='rewards'?rewards():settings());
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
 if(page==='settings')window.RupeeUpdates?.syncStatus();
 const navArt={
  home:Icons.get('home'),campaign:Icons.get('levels'),
  mine:Icons.get('mine'),farm:FarmArt.equipment('garden-plot'),
  shop:Icons.get('shop'),rewards:Icons.get('rewards'),settings:Icons.get('settings')
 };
 // Brand-neutral local glyphs and the genuine pickaxe, never old woodland icons.
 document.querySelectorAll('.bottom .nav-art').forEach(img=>{
  const section=img.closest('[data-nav]')?.dataset.nav;
  if(section&&navArt[section])img.src=navArt[section];
 });
}
function finishMining(result,success){if(result?.valid){const reward=/reward|refill|claimed/i.test(success),purchase=/purchased|supplies|exchanged|purchased/i.test(success);Audio.play(reward?'reward':purchase?'purchase':/refine|polish|packed|sold/i.test(success)?'refine':'mine-hit');if(result.ore){Audio.play('ore-find');Audio.speak('oreFound');}else if(reward)Audio.speak('rewardClaimed');else if(purchase)Audio.speak('shopPurchase');save();render();message(success);}else{Audio.play('blocked');message('Cannot complete: '+(result?.reason||'unknown'));} }
function handle(b){
 const a=b.dataset.action,info=b.dataset,now=Date.now();
 if(info.nav){nav(info.nav);return;}
 if(a==='go-farm'){nav('farm');return;}if(a==='resume-board'){if(!active)return message('No active level.');page='game';render();return;}if(a==='go-mine'){nav('mine');return;}if(a==='go-campaign'){nav('campaign');return;}if(a==='go-trials'){nav('trials');return;}
 if(a==='check-updates'){window.RupeeUpdates?.check();return;}
 if(a==='view-releases'){window.RupeeUpdates?.openReleases();return;}
 if(a==='toggle-sfx'){Audio.configure({sfx:!Audio.settings().sfx});render();return;}if(a==='toggle-music'){Music.configure({music:!Music.settings().music});render();return;}if(a==='toggle-voice'){Audio.configure({voice:!Audio.settings().voice});render();return;}
 if(a==='open-chapter'){const c=Chapters.byId(info.chapter);if(!c)return;chapterId=c.id;campaignPage=Math.max(0,Math.floor((Math.max(c.start,Math.min(saved.unlocked,c.end))-c.start)/30));page='chapter';Audio.play('chapter-enter');Audio.speak('enter'+c.id);render();return;}
 if(a==='play-next'){start(saved.unlocked);return;}
 if(a==='play-level'){start(Number(info.level));return;}
 if(a==='campaign-prev'){campaignPage=Math.max(0,campaignPage-1);render();return;}
 if(a==='campaign-next'){campaignPage=Math.min(6,campaignPage+1);render();return;}
 if(a==='result-next'){const id=outcome?.won?(outcome.id>=T.FIRST?saved.unlocked:Math.min(1000,outcome.id+1)):outcome?.id;outcome=null;start(id||saved.unlocked);return;}
 if(a==='abandon'){active=null;visualImpact=null;save();nav('campaign');return;}
 if(a==='cell'){
  if(!active)return;const n=Number(info.cell);
  if(selected<0){selectCell(n);Audio.play('tap');return;}
  if(selected===n){selectCell(-1);return;}
  if(!E.adjacent(active,selected,n)){selectCell(n);return;}
  performSwap(selected,n);return;
 }
 if(a==='booster'){
  if(!active)return;
  const id=info.booster,meta=E.BOOSTER_META[id];if(!meta||!P.unlocked(saved,id)||P.count(saved,id)<1)return;
  if(meta.targeted&&selected<0)return message('Select a gem first to target this booster.');
  const before=E.snapshot(active).cells,target=meta.targeted?selected:-1;
  const r=E.booster(active,id,meta.targeted?selected:undefined);
  if(!r.valid)return message('Booster unavailable: '+(r.reason||'not applicable'));
  P.spend(saved,id);if(id==='extra')D.topUp(saved,5,now,dailyCap());
  impact(id,target);selectCell(-1);Audio.play('booster');Audio.speak(({hammer:'hammer',row:'rocket',column:'rocket',blast:'bomb',shuffle:'shuffle',color:'color',spectrum:'color'})[id]||'boosterUsed');save();animateMove(r,before);return;
 }
 if(a==='kitchen-cook')return finishMining(Cook.cook(saved,info.recipe,1),'Meal prepared and stored in the kitchen.');
 if(a==='kitchen-serve')return finishMining(Cook.serve(saved,info.recipe,now,dailyCap()),'Meal served; reward granted.');
 if(a==='farm-shop'){shopTab='boosters';nav('shop');return;}
 if(a==='farm-plot'){farmPlot=Number(info.plot);render();return;}
 if(a==='farm-category'){farmCategory=info.category==='all'||Garden.CATEGORIES.includes(info.category)?info.category:'all';const choices=Object.values(Garden.CROPS).filter(c=>saved.town.houseLevel>=c.house&&(farmCategory==='all'||c.category===farmCategory));if(!choices.some(c=>c.id===farmCrop)&&choices.length)farmCrop=choices[0].id;render();return;}
  if(a==='farm-crop'){if(Object.hasOwn(Garden.CROPS,info.crop)&&saved.town.houseLevel>=Garden.CROPS[info.crop].house)farmCrop=info.crop;render();return;}
 if(a==='farm-feed'){if(info.feed==='none'||Garden.FERTILIZERS[info.feed])farmFeed=info.feed==='none'?'':info.feed;render();return;}
 if(a==='farm-upgrade')return finishMining(Garden.upgradeHouse(saved),'Garden home upgraded.');
 if(a==='farm-buy-seed')return finishMining(Garden.purchase(saved,'seed',info.crop,Number(info.qty||1)),'Seeds purchased.');
 if(a==='farm-buy-feed')return finishMining(Garden.purchase(saved,'fertilizer',info.feed,1),'Fertilizer purchased.');
 if(a==='farm-plant'){farmPlot=Number(info.plot);return finishMining(Garden.plant(saved,farmPlot,farmCrop,farmFeed||null,now),'New crops planted.');}
 if(a==='farm-harvest'){farmPlot=Number(info.plot);return finishMining(Garden.harvest(saved,farmPlot,now),'Crops harvested.');}
 if(a==='farm-sell'){const qty=Garden.summary(saved).harvest[info.crop];return finishMining(Garden.sell(saved,info.crop,qty),'Harvest sold for Rupees.');}
 if(a==='mine-mode-focus'){mineMode='focus';mineTab='dig';render();return;}
 if(a==='buy-mode-power')return finishMining(Powerups.purchase(saved,info.power),'Power-up purchased.');
 if(a==='buy-mode-bundle'){const r=Powerups.buyBundle(saved,info.bundle);if(r.valid){shopReceipt={title:'Power-up bundle acquired',lines:Object.entries(r.contents).map(([id,q])=>q+' × '+(Powerups.CATALOG[id]?.name||E.BOOSTER_META[id]?.label||id))};Audio.play('purchase');save();render();}else message('Cannot buy bundle: '+r.reason);return;}
 if(a==='use-mode-power'){
  const p=Powerups.CATALOG[info.power];if(!p)return;
  const target=p.family==='farm'?{plot:farmPlot,crop:farmCrop,fertilizer:farmFeed||'compost'}:mineFocus||{};
  const r=Powerups.use(saved,info.power,target,now);
  if(r.valid){Audio.play('booster');save();render();message('Activated '+p.name+'.');}
  else{Audio.play('blocked');message('Cannot activate '+p.name+': '+r.reason);}
  return;
 }
 if(a==='open-wardrobe'){shopTab='character';nav('shop');return;}
 if(a==='shop-tab'){shopTab=info.shopTab;shopReceipt=null;render();return;}
 if(a==='dismiss-receipt'){shopReceipt=null;render();return;}
 if(a==='buy-pack'){const r=Economy.buyPack(saved,info.pack);if(r.valid){shopReceipt={title:'Opened '+Economy.PACKS[info.pack].name,lines:r.results.map(x=>x.label)};Audio.play('reward');save();render();message('Treasure received.');}else message('Unable to open chest: '+r.reason);return;}
 if(a==='buy-cosmetic'){const r=Economy.buyCosmetic(saved,info.cosmetic);if(r.valid){shopReceipt={title:'Cosmetic unlocked',lines:[r.item.name]};Audio.play('purchase');save();render();}else message('Cosmetic unavailable: '+r.reason);return;}
 if(a==='equip-cosmetic'){const r=Economy.equip(saved,info.cosmetic);if(r.valid){save();render();message('Equipped '+r.item.name);}return;}
 if(a==='claim-daily'){const r=Economy.claimDaily(saved,now);if(r.valid){shopReceipt={title:'Daily chest opened',lines:r.results.map(x=>x.label)};Audio.play('reward');save();render();message('Daily reward received.');}else message('Daily chest already claimed.');return;}
 if(a==='buy-currency'){const r=P.buyCurrencyOffer(saved,info.offer,D,now,dailyCap());return finishMining(r,'Supplies added to inventory.');}
 if(a==='buy-booster')return finishMining(P.buyBooster(saved,info.booster),'Booster purchased.');
 if(a==='buy-gem-booster')return finishMining(P.buyGemBooster(saved,info.booster),'Four boosters purchased.');
 if(a==='mine-tab'){mineTab=info.tab;render();return;}
 if(a==='mine-mode-dig'){mineMode='dig';render();return;}if(a==='mine-mode-scan'){mineMode='scan';render();return;}
 if(a==='mine-cell'){
  const x=Number(info.x),y=Number(info.y),c=Mining.currentBoard(saved).find(c=>c.x===x&&c.y===y);
  if(mineMode==='focus'){mineFocus={x,y};render();message('Target rock '+(x+1)+','+(y+1)+' selected.');return;}
   const r=c?.done&&c.exposed?Mining.collect(saved,x,y,now):mineMode==='scan'?Mining.survey(saved,x,y,now):Mining.excavate(saved,x,y,now);
  return finishMining(r,r?.ore?'Found '+r.ore+' raw ore.':'Mining action complete.');
 }
 if(a==='mine-unload')return finishMining(Mining.unload(saved,now),'Cart unloaded into storage.');
 if(a==='mine-upgrade')return finishMining(Mining.upgrade(saved,info.track,now),'Equipment upgraded.');
 if(a==='mine-refine')return finishMining(Mining.refine(saved,1,now),'Crystal polished.');
 if(a==='mine-craft')return finishMining(Mining.manufacture(saved,1,now),'Parcel packed.');
 if(a==='mine-sell')return finishMining(Mining.sell(saved,1,now),'Parcel sold for mining credits.');
 if(a==='mine-buy')return finishMining(Bridge.buy(saved,info.offer,Mining,P,D,now),'Mined resources exchanged for campaign supplies.');
 if(a==='claim-hearts'||a==='claim-moves')return finishMining(B.claim(saved,a==='claim-hearts'?'hearts':'moves',now,D,dailyCap()),'Daily reward claimed.');
 if(a==='advanced'){advanced=!advanced;resetStep=0;render();return;}
 if(a==='reset-start'){resetStep=1;render();return;}
 if(a==='reset-cancel'){resetStep=0;render();return;}
 if(a==='reset-confirm'){
  if(resetStep===1){resetStep=2;render();return;}
  if(resetStep===2){localStorage.removeItem(KEY);saved=defaultSave();P.migrate(saved);R.ensure(saved);Mining.ensure(saved);Garden.ensure(saved);Cook.ensure(saved);Powerups.ensure(saved);Economy.ensure(saved);D.ensure(saved,now,dailyCap());active=null;outcome=null;mineTab='dig';advanced=false;resetStep=0;page='home';save();render();message('Rupee Rush local data reset.');return;}
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(!b||b.disabled||animating||Date.now()<swipeGuard)return;
 Music.activate();handle(b);
});
// Touch and mouse swipes share Nut Buster's direction threshold and move rules.
root.addEventListener?.('pointerdown',e=>{
 if(page!=='game'||!active||animating)return;
 const tile=e.target.closest?.('[data-cell]');
 if(tile)pointerStart={i:Number(tile.dataset.cell),x:e.clientX,y:e.clientY};
});
root.addEventListener?.('pointercancel',()=>{pointerStart=null;});
root.addEventListener?.('pointerup',e=>{
 const start=pointerStart;pointerStart=null;
 if(!start||page!=='game'||!active||animating)return;
 const dx=e.clientX-start.x,dy=e.clientY-start.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
 const w=active.cfg.width,to=start.i+(Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?w:-w));
 if(!E.adjacent(active,start.i,to))return;
 swipeGuard=Date.now()+450;Music.activate();performSwap(start.i,to);
});
render();window.RupeeRushDebug=Object.freeze({getSave:()=>JSON.parse(JSON.stringify(saved)),getPage:()=>page,getChapter:()=>chapterId,activeSnapshot:()=>active?E.snapshot(active):null});
})();