/* Jewelbrook standalone playable shell around reused deterministic systems. */
(function(){'use strict';
const E=window.RupeeEngine,P=window.RupeeProgress,D=window.RupeeDailyMoves,B=window.RupeeBenefits,
 T=window.RupeeElementalChallenges,R=window.RupeeElementalRewards,
 Mining=window.RupeeMining,G=window.RupeeMiningGear,Bridge=window.RupeeMineBridge,Art=window.RupeeArt,Shared=window.RupeeSharedArt,Chapters=window.RupeeChapters,Audio=window.RupeeAudio,Assets=window.RupeeEmbryonAssets;
if(![E,P,D,B,T,R,Mining,G,Bridge,Art,Shared,Chapters,Audio,Assets].every(Boolean))throw Error('Jewelbrook gameplay dependencies missing');
const KEY='rupeerush.save.v1',defaultSave=()=>({unlocked:1,stars:{},coins:250,gems:25,hearts:5,vip:false,claimed:0});
let saved=defaultSave();try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data&&typeof data==='object'&&!Array.isArray(data))saved={...saved,...data,stars:data.stars||{}};}catch(_){}
P.migrate(saved);R.ensure(saved);Mining.ensure(saved);D.ensure(saved,Date.now(),E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked))).moves);
let visualImpact=null;
let cloudStatus='Cloud backup has not been checked.', pendingCloudRestore=null, pendingCloudVersion=null;
let page='home',active=null,selected=-1,mineTab='dig',mineMode='dig',campaignPage=0,chapterId=1,toast='',toastT=null,resetStep=0,advanced=false,outcome=null;
const root=document.getElementById('screen'),wallet=document.getElementById('wallet'),stars=document.getElementById('stargems');
if(!root)throw Error('Missing #screen');
// Restore only validated, unfinished Jewelbrook boards. Never touch Nut Buster saves.
try{if(saved.activeBoard){const s=saved.activeBoard;const allowed=s.level>=T.FIRST?T.available(saved,s.level):s.level<=saved.unlocked;if(allowed)active=E.restore(s);if(!active)delete saved.activeBoard;}}catch(_){delete saved.activeBoard;}
function save(){try{if(active&&!active.won&&!active.lost)saved.activeBoard=E.snapshot(active);else delete saved.activeBoard;localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){message('Unable to save on this device');}}
function number(x){return Number(x||0).toLocaleString('en-US');}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function icon(id,size=30){return '<img class="icon" width="'+size+'" height="'+size+'" alt="" src="'+(Shared.icons[id]||Art.icon(id))+'">';}
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
function stats(){return '<div class="stats"><div>'+icon('rupee',24)+' <strong>'+number(saved.coins)+'</strong><small>Rupees</small></div><div>'+icon('crystal',24)+' <strong>'+number(saved.gems)+'</strong><small>Star Gems</small></div><div>'+icon('heart',24)+' <strong>'+saved.hearts+'/5</strong><small>Lives</small></div><div>'+icon('extra',24)+' <strong>'+number(bank().remaining)+'</strong><small>Moves today</small></div></div>';}
function home(){
 return '<section class="home-kingdom" aria-label="Embryon Kingdom">'+
 '<div class="home-kingdom-content"><h1 class="home-brand"><img class="home-title-banner" src="art/embryon/branding/jewelbrook/banner-wide.webp" alt="Jewel Brook: Heroes of Embryon" width="939" height="203" decoding="async"></h1>'+
 '<p class="home-tagline">Gather gemstones, uncover lost treasures, and match your way through a thousand stages.</p>'+
 '<div class="home-actions">'+button('play-next',icon('crystal')+' PLAY LEVEL '+saved.unlocked,'primary')+button('go-mine',icon('pickaxe')+' ENTER THE MINES','secondary')+'</div></div></section>'+
 '<div class="panels"><section class="panel"><h2>Current expedition</h2><p><b>Stage '+saved.unlocked+'</b> · '+escape(E.makeLevel(saved.unlocked).stageTitle)+'</p><p>'+Object.keys(saved.stars).filter(n=>Number(n)<=1000&&saved.stars[n]>0).length+' stages cleared</p>'+button('go-campaign','CHOOSE A LEVEL')+'</section>'+
 '<section class="panel"><h2>Prism Vale Mines</h2><p>12 daily starter strikes, expandable equipment, refinery, and resource exchanges.</p>'+button('go-mine','MINE FOR SUPPLIES')+'</section></div>';
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
 active=E.create(id,id*7919+saved.unlocked*17);selected=-1;visualImpact=null;outcome=null;page='game';save();Audio.play('chapter-enter');Audio.speak('levelStart');render();
}
function piece(cell,index){
 if(!cell||cell.type===null)return '<span class="void"></span>';
 // Status effects occupy their own see-through layer. Never substitute a nut
 // blocker image for the gemstone identity stored by the deterministic engine.
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
 const special=cell.special||cell.elemental?'<small class="piece-badges">'+(cell.special?'✦':'')+(cell.elemental?'⚡':'')+'</small>':'';
 return gem(cell.type)+status+anchor+counters+special;
}
function gameplay(){
 const g=active;if(!g)return home();
 const objectives=E.objectiveState(g);
 return header('Level '+g.level+' · '+escape(g.cfg.stageTitle),escape(g.cfg.hint))+
 stats()+'<div class="game-progress"><b>Score '+number(g.score)+' / '+number(g.cfg.goal)+'</b><b>Moves '+g.moves+'</b></div>'+
 '<div class="objectives">'+objectives.map(o=>'<span class="'+(o.done?'done':'')+'">'+escape(o.label)+' '+number(o.value)+'/'+number(o.target)+'</span>').join('')+'</div>'+
 '<div class="board-frame"><div class="board" style="--columns:'+g.cfg.width+'">'+g.cells.map((c,i)=>'<button class="cell '+(!c?'hole ':'')+(selected===i?'selected':'')+'" data-action="cell" data-cell="'+i+'" '+(!c?'disabled':'')+' aria-label="Tile '+(i+1)+(c?' '+E.TYPES[c.type]+(Shared.label(c)?', '+escape(Shared.label(c)):''):' empty')+'">'+piece(c,i)+'</button>').join('')+'</div>'+impactMarkup(g)+'</div>'+
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
 return '<div class="location-banner location-market">'+header('Crystal Market','Spend earned Rupees or Star Gems. Every exchange grants real in-game supplies; no cash checkout is required.')+'</div>'+stats()+
 '<h2 class="subhead">Lives &amp; moves</h2><div class="shop-grid">'+Object.entries(P.SHOP_EXCHANGES).map(([id,o])=>offerCard(id,o)).join('')+'</div>'+
 '<h2 class="subhead">Booster supplies</h2><div class="shop-grid">'+E.BOOSTERS.map(id=>'<div class="shop-item">'+boosterIcon(id,39)+'<strong>'+escape(E.BOOSTER_META[id].label)+'</strong><small>Stock ×'+P.count(saved,id)+'</small>'+
 button('buy-booster','1 · '+number(P.BOOSTER_PRICES[id])+' RUPEES','secondary','data-booster="'+id+'" '+(!P.unlocked(saved,id)||saved.coins<P.BOOSTER_PRICES[id]?'disabled':''))+
 button('buy-gem-booster','4 · '+P.GEM_BOOSTER_PRICES[id]+' STAR GEMS','primary','data-booster="'+id+'" '+(!P.unlocked(saved,id)||saved.gems<P.GEM_BOOSTER_PRICES[id]?'disabled':''))+'</div>').join('')+'</div>';
}
function mine(){
 const s=Mining.stats(saved),prices=Mining.prices(saved),cells=Mining.currentBoard(saved);
 const tabs=['dig','equipment','refinery','exchange'];
 let content='';
 if(mineTab==='dig'){
  content='<div class="mine-stats"><span>'+'<img class="mine-tool-art" alt="Current pickaxe" src="'+escape(G.entry('pickaxe',s.pickTier).image)+'"> '+s.strikesLeft+'/'+s.strikeMax+' strikes</span><span>'+'<img class="mine-tool-art" alt="Current survey gloves" src="'+escape(G.entry('gloves',s.gloveTier).image)+'"> '+s.scansLeft+'/'+s.scanMax+' surveys</span><span>'+icon('cart',22)+' '+s.cartOre+'/'+s.cartMax+' cart</span><span>'+icon('crystal',22)+' '+s.ore+' ore</span></div>'+
  '<div class="tool-row">'+button('mine-mode-dig','EXCAVATE',mineMode==='dig'?'primary':'secondary')+button('mine-mode-scan','SURVEY',mineMode==='scan'?'primary':'secondary')+button('mine-unload','UNLOAD CART','secondary',s.cartOre?'':'disabled')+'</div>'+
  '<div class="mine-frame"><div class="mine-board" style="--mine-columns:'+s.size+'">'+cells.map(c=>'<button data-action="mine-cell" data-x="'+c.x+'" data-y="'+c.y+'" class="rock '+(c.done?'revealed':'')+'" title="'+(c.done?(c.exposed?'Collect '+c.exposed+' ore':c.kind):'Rock '+c.hits+'/'+c.hardness)+'">'+(c.exposed?icon('crystal',31):c.done?icon('parcel',31):c.survey==='ore'?icon('scan',31):'<img class="mine-rock-art" src="art/primary/blockers/rock.png" alt="">')+'<small>'+(c.exposed?'ORE ×'+c.exposed:c.done?(c.kind==='barren'?'EMPTY':'CLEARED'):c.survey==='ore'?'ORE HERE':c.survey==='barren'?'BARREN':c.hits+'/'+c.hardness)+'</small></button>').join('')+'</div></div>'+
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
  '<div class="upgrade-list"><div class="upgrade">'+icon('crystal',33)+'<div class="upgrade-name"><b>Polish crystal</b><small>'+Mining.ORE_PER_METAL[s.refineryTier]+' raw ore → 1 polished crystal</small></div>'+button('mine-refine','POLISH ONE','primary',s.ore<Mining.ORE_PER_METAL[s.refineryTier]?'disabled':'')+'</div>'+
  '<div class="upgrade">'+icon('gear',33)+'<div class="upgrade-name"><b>Pack crystal parcels</b><small>2 polished crystals → 1 trade parcel</small></div>'+button('mine-craft','PACK ONE','primary',s.metal<2?'disabled':'')+'</div>'+
  '<div class="upgrade">'+icon('parcel',33)+'<div class="upgrade-name"><b>Sell crystal parcel</b><small>1 parcel → '+Mining.SALE[s.refineryTier]+' mining credits</small></div>'+button('mine-sell','SELL ONE','primary',s.goods<1?'disabled':'')+'</div></div>';
 }else{
  content='<p class="hint">Sell crafted crystal parcels for mining credits, then buy supplies usable immediately in the match-3 campaign.</p>'+
   '<div class="shop-grid">'+Object.entries(Bridge.OFFERS).map(([id,o])=>'<div class="shop-item">'+icon(o.icon,38)+'<strong>'+escape(o.label)+'</strong><small>'+number(o.cost)+' mining credits</small>'+button('mine-buy','CLAIM SUPPLIES','primary','data-offer="'+id+'" '+(s.dollars<o.cost?'disabled':''))+'</div>').join('')+'</div>';
 }
 return '<div class="location-banner location-mine">'+header('Prism Vale Mines','Available from the start. Mine crystal ore, refine it, and turn the proceeds into match-3 supplies.')+'</div>'+ 
 '<div class="mine-wallet">'+icon('rupee',29)+' <b>'+number(s.dollars)+'</b> Mining Credits</div>'+
 '<div class="mine-tabs">'+tabs.map(t=>button('mine-tab',t.toUpperCase(),mineTab===t?'primary':'secondary','data-tab="'+t+'"')).join('')+'</div>'+content;
}
function rewards(){
 const h=B.remaining(saved,'hearts'),m=B.remaining(saved,'moves');
 const timer=ms=>ms?B.countdown(ms):'READY';
 return header('Daily Rewards','Claim a free life refill and five additional moves once each every 12 hours.')+stats()+
 '<div class="shop-grid"><section class="panel">'+icon('heart',40)+'<h2>Life Refill</h2><p>Return to five hearts.</p>'+button('claim-hearts',h?timer(h):'CLAIM REFILL','primary',h||saved.hearts>=5?'disabled':'')+'</section>'+
 '<section class="panel">'+icon('extra',40)+'<h2>Move Refill</h2><p>Add five to the current daily move bank.</p>'+button('claim-moves',m?timer(m):'CLAIM +5 MOVES','primary',m?'disabled':'')+'</section></div>';
}
function settings(){
 return header('Settings','Independent local game data. No Nut Buster saves or accounts are accessed.')+
 '<div class="panel sound-controls"><h2>Embryon sound</h2>'+button('toggle-sfx',Audio.settings().sfx?'SOUND EFFECTS: ON':'SOUND EFFECTS: OFF')+button('toggle-voice',Audio.settings().voice?'EMBRYON ANNOUNCER: ON':'EMBRYON ANNOUNCER: OFF')+'<p>Original crystal sounds and a separate Heroes of Embryon voice script. Spoken lines use device speech only when enabled.</p></div>'+
 (window.RupeePlayCloud?'<div class="panel"><h2>Google Play Games cloud backup</h2><p>Your local game stays playable offline. Back up explicitly or inspect a cloud save before replacing local progress.</p>'+button('cloud-backup','BACK UP TO PLAY GAMES','primary')+button('cloud-restore','CHECK CLOUD SAVE','secondary')+'<p>'+escape(cloudStatus)+'</p>'+(pendingCloudRestore?'<div class="danger"><p>Cloud save available. Stage '+escape(pendingCloudRestore.unlocked)+'; '+number(pendingCloudRestore.coins)+' Rupees. Restoring replaces current progress. A local backup will be retained.</p>'+button('cloud-apply','RESTORE CLOUD PROGRESS','danger')+button('cloud-cancel','KEEP LOCAL PROGRESS','secondary')+'<p>This permanently replaces the inspected cloud progress with this device\'s current save.</p>'+button('cloud-replace','REPLACE CLOUD WITH THIS DEVICE','danger')+'</div>':'')+'</div>':'')+
 '<div class="panel"><h2>Game data</h2><p>Your progress, mine equipment, balances and boosters are saved locally on this device.</p>'+button('advanced',advanced?'HIDE ADVANCED SETTINGS':'ADVANCED SETTINGS','secondary')+
 (advanced?'<div class="danger"><h3>Account maintenance</h3><p>Emergency testing only. Reset deletes all Jewelbrook progress from this device.</p>'+
 button('reset-start','ACCOUNT RESET','quiet')+(resetStep?'<p class="warning">This deletes every stage clear, item, currency and mining upgrade.</p>'+button('reset-confirm',resetStep===1?'CONTINUE TO FINAL CONFIRMATION':'ERASE JEWELBROOK DATA','danger')+button('reset-cancel','CANCEL','secondary'):'')+'</div>':'')+'</div>';
}
function render(){
 P.migrate(saved);Mining.ensure(saved);bank();
 wallet.textContent=number(saved.coins);stars.textContent=number(saved.gems);
 root.innerHTML=(active&&page!=='game'?'<div class="resume-bar">'+button('resume-board','RESUME LEVEL '+active.level,'primary')+'</div>':'')+(page==='home'?home():page==='campaign'?campaign():page==='chapter'?chapter():page==='trials'?trials():page==='game'?gameplay():
  page==='result'?results():page==='shop'?shop():page==='mine'?mine():page==='rewards'?rewards():settings());
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
 const navArt={
  home:Art.icon('home'),campaign:Art.icon('levels'),
  mine:G.entry('pickaxe',Mining.stats(saved).pickTier).image,
  shop:Art.icon('shop'),rewards:Art.icon('gift'),settings:Art.icon('gear')
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
 if(a==='cloud-backup'&&window.RupeePlayCloud){cloudStatus='Submitting a backup...';window.RupeePlayCloud.backup(JSON.stringify(saved));render();return;}
 if(a==='cloud-restore'&&window.RupeePlayCloud){cloudStatus='Loading the cloud save for review...';window.RupeePlayCloud.restore();render();return;}
 if(a==='cloud-replace'&&window.RupeePlayCloud&&pendingCloudRestore&&pendingCloudVersion){
   cloudStatus='Replacing the inspected cloud revision with this device save...';
   window.RupeePlayCloud.replace(JSON.stringify(saved),pendingCloudVersion);
   render();return;
 }
 if(a==='cloud-cancel'){pendingCloudRestore=null;pendingCloudVersion=null;cloudStatus='Kept this device\'s existing progress.';render();return;}
 if(a==='cloud-apply'&&pendingCloudRestore){
   try{const prior=localStorage.getItem(KEY);if(prior)localStorage.setItem(KEY+'.before-cloud-restore',prior);
       saved=pendingCloudRestore;pendingCloudRestore=null;P.migrate(saved);R.ensure(saved);Mining.ensure(saved);D.ensure(saved,Date.now(),dailyCap());
       active=null;outcome=null;page='home';save();cloudStatus='Restored cloud progress. Previous local progress retained as a backup.';render();}
   catch(error){cloudStatus='Cloud restore aborted: '+error.message;render();}return;
 }
 if(a==='resume-board'){if(!active)return message('No active level.');page='game';render();return;}if(a==='go-mine'){nav('mine');return;}if(a==='go-campaign'){nav('campaign');return;}if(a==='go-trials'){nav('trials');return;}
 if(a==='toggle-sfx'){Audio.configure({sfx:!Audio.settings().sfx});render();return;}if(a==='toggle-voice'){Audio.configure({voice:!Audio.settings().voice});render();return;}
 if(a==='open-chapter'){const c=Chapters.byId(info.chapter);if(!c)return;chapterId=c.id;campaignPage=Math.max(0,Math.floor((Math.max(c.start,Math.min(saved.unlocked,c.end))-c.start)/30));page='chapter';Audio.play('chapter-enter');Audio.speak('enter'+c.id);render();return;}
 if(a==='play-next'){start(saved.unlocked);return;}
 if(a==='play-level'){start(Number(info.level));return;}
 if(a==='campaign-prev'){campaignPage=Math.max(0,campaignPage-1);render();return;}
 if(a==='campaign-next'){campaignPage=Math.min(6,campaignPage+1);render();return;}
 if(a==='result-next'){const id=outcome?.won?(outcome.id>=T.FIRST?saved.unlocked:Math.min(1000,outcome.id+1)):outcome?.id;outcome=null;start(id||saved.unlocked);return;}
 if(a==='abandon'){active=null;visualImpact=null;save();nav('campaign');return;}
 if(a==='cell'){
  if(!active)return;const n=Number(info.cell);
  if(selected<0){selected=n;render();return;}
  if(selected===n){selected=-1;render();return;}
  if(!E.adjacent(active,selected,n)){selected=n;render();return;}
  if(bank().remaining<1)return message('Daily moves exhausted. Mine for a move pack.');
  const result=E.swap(active,selected,n);selected=-1;
  if(!result.valid){render();return message('That pair cannot be swapped.');}
  D.spend(saved,1,now,dailyCap());if(result.removed>0||result.cracked>0){impact(result.loops>=2?'cascade':'match',n);Audio.play(result.loops>=2?'cascade':'match');}else{visualImpact=null;Audio.play('swap');}if(result.loops>=3)Audio.speak('cascade');save();settle();render();return;
 }
 if(a==='booster'){
  if(!active)return;
  const id=info.booster,meta=E.BOOSTER_META[id];if(!meta||!P.unlocked(saved,id)||P.count(saved,id)<1)return;
  if(meta.targeted&&selected<0)return message('Select a gem first to target this booster.');
  const r=E.booster(active,id,meta.targeted?selected:undefined);
  if(!r.valid)return message('Booster unavailable: '+(r.reason||'not applicable'));
  P.spend(saved,id);if(id==='extra')D.topUp(saved,5,now,dailyCap());
  impact(id,meta.targeted?selected:-1);selected=-1;Audio.play('booster');Audio.speak(({hammer:'hammer',row:'rocket',column:'rocket',blast:'bomb',shuffle:'shuffle',color:'color',spectrum:'color'})[id]||'boosterUsed');save();settle();render();return;
 }
 if(a==='buy-currency'){const r=P.buyCurrencyOffer(saved,info.offer,D,now,dailyCap());return finishMining(r,'Supplies added to inventory.');}
 if(a==='buy-booster')return finishMining(P.buyBooster(saved,info.booster),'Booster purchased.');
 if(a==='buy-gem-booster')return finishMining(P.buyGemBooster(saved,info.booster),'Four boosters purchased.');
 if(a==='mine-tab'){mineTab=info.tab;render();return;}
 if(a==='mine-mode-dig'){mineMode='dig';render();return;}if(a==='mine-mode-scan'){mineMode='scan';render();return;}
 if(a==='mine-cell'){
  const x=Number(info.x),y=Number(info.y),c=Mining.currentBoard(saved).find(c=>c.x===x&&c.y===y);
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
  if(resetStep===2){localStorage.removeItem(KEY);saved=defaultSave();P.migrate(saved);R.ensure(saved);Mining.ensure(saved);D.ensure(saved,now,dailyCap());active=null;outcome=null;mineTab='dig';advanced=false;resetStep=0;page='home';save();render();message('Jewelbrook local data reset.');return;}
 }
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;handle(b);});
window.RupeePlayCloudMessage=function(response){
 try{
   if(response.action==='restore'&&response.ok){
      const incoming=JSON.parse(response.payload);
      if(!incoming||typeof incoming!=='object'||Array.isArray(incoming)||!Number.isInteger(incoming.unlocked)||incoming.unlocked<1||incoming.unlocked>1000||
         !Number.isFinite(incoming.coins)||incoming.coins<0||!Number.isFinite(incoming.gems)||incoming.gems<0||
         !incoming.stars||typeof incoming.stars!=='object'||Array.isArray(incoming.stars))throw Error('Invalid cloud save format or economy');
      if(!/^[0-9a-f]{64}$/.test(String(response.version||'')))throw Error('Cloud revision fingerprint missing');
   pendingCloudRestore=incoming;pendingCloudVersion=response.version;cloudStatus='Cloud save fetched. Confirm before replacing local progress.';
   }else cloudStatus=String(response.detail||'Cloud operation completed.');
 }catch(error){pendingCloudRestore=null;pendingCloudVersion=null;cloudStatus='Cloud save validation failed: '+error.message;}
 if(page==='settings')render();else message(cloudStatus);
};
render();window.addEventListener?.('load',()=>document.getElementById('jewelbrook-loading-splash')?.remove?.(),{once:true});window.RupeeRushDebug=Object.freeze({getSave:()=>JSON.parse(JSON.stringify(saved)),getPage:()=>page,getChapter:()=>chapterId,activeSnapshot:()=>active?E.snapshot(active):null});
})();