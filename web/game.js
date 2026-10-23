/* Rupee Rush standalone playable shell around reused deterministic systems. */
(function(){'use strict';
const E=window.RupeeEngine,P=window.RupeeProgress,D=window.RupeeDailyMoves,B=window.RupeeBenefits,
 T=window.RupeeElementalChallenges,R=window.RupeeElementalRewards,
 Mining=window.RupeeMining,G=window.RupeeMiningGear,Bridge=window.RupeeMineBridge,Art=window.RupeeArt,Shared=window.RupeeSharedArt;
if(![E,P,D,B,T,R,Mining,G,Bridge,Art,Shared].every(Boolean))throw Error('Rupee Rush gameplay dependencies missing');
const KEY='rupeerush.save.v1',defaultSave=()=>({unlocked:1,stars:{},coins:250,gems:25,hearts:5,vip:false,claimed:0});
let saved=defaultSave();try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data&&typeof data==='object'&&!Array.isArray(data))saved={...saved,...data,stars:data.stars||{}};}catch(_){}
P.migrate(saved);R.ensure(saved);Mining.ensure(saved);D.ensure(saved,Date.now(),E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked))).moves);
let page='home',active=null,selected=-1,mineTab='dig',mineMode='dig',campaignPage=0,toast='',toastT=null,resetStep=0,advanced=false,outcome=null;
const root=document.getElementById('screen'),wallet=document.getElementById('wallet'),stars=document.getElementById('stargems');
if(!root)throw Error('Missing #screen');
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){message('Unable to save on this device');}}
function number(x){return Number(x||0).toLocaleString('en-US');}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function icon(id,size=30){return '<img class="icon" width="'+size+'" height="'+size+'" alt="" src="'+(Shared.icons[id]||Art.icon(id))+'">';}
function gem(id){return '<img class="gem" alt="'+escape(E.TYPES[id])+'" draggable="false" src="'+Art.gem(id)+'">';}
function button(action,label,cls='secondary',opts=''){return '<button class="btn '+cls+'" data-action="'+action+'" '+opts+'>'+label+'</button>';}
function nav(to){page=to;selected=-1;resetStep=0;advanced=false;render();}
function message(s){toast=s;const el=document.getElementById('toast');if(el){el.textContent=s;el.classList.add('visible');}if(toastT)clearTimeout(toastT);toastT=setTimeout(()=>{const t=document.getElementById('toast');if(t)t.classList.remove('visible');},4000);}
function dailyCap(){return E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked))).moves;}
function bank(){return D.ensure(saved,Date.now(),dailyCap());}
function header(name,description=''){return '<div class="heading"><h1>'+name+'</h1>'+(description?'<p>'+description+'</p>':'')+'</div>';}
function stats(){return '<div class="stats"><div>'+icon('rupee',24)+' <strong>'+number(saved.coins)+'</strong><small>Rupees</small></div><div>'+icon('crystal',24)+' <strong>'+number(saved.gems)+'</strong><small>Star Gems</small></div><div>'+icon('heart',24)+' <strong>'+saved.hearts+'/5</strong><small>Lives</small></div><div>'+icon('extra',24)+' <strong>'+number(bank().remaining)+'</strong><small>Moves today</small></div></div>';}
function home(){
 return header('Welcome to Rupee Rush','Gather gemstones, uncover lost treasures, and match your way through a thousand stages.')+
 '<div class="hero"><div class="hero-art">'+[0,1,2,3,4,5,6].map(i=>gem(i)).join('')+'</div><h2>Match a world of gems</h2><p>Play the main campaign or explore the crystal mines whenever you need extra supplies.</p>'+
 button('play-next',icon('crystal')+' PLAY LEVEL '+saved.unlocked,'primary')+button('go-mine',icon('pickaxe')+' ENTER THE MINES','secondary')+'</div>'+
 '<div class="panels"><section class="panel"><h2>Current expedition</h2><p><b>Stage '+saved.unlocked+'</b> · '+escape(E.makeLevel(saved.unlocked).stageTitle)+'</p><p>'+Object.keys(saved.stars).filter(n=>Number(n)<=1000&&saved.stars[n]>0).length+' stages cleared</p>'+button('go-campaign','CHOOSE A LEVEL')+'</section>'+
 '<section class="panel"><h2>Prism Vale Mines</h2><p>12 daily starter strikes, expandable equipment, refinery, and resource exchanges.</p>'+button('go-mine','MINE FOR SUPPLIES')+'</section></div>';
}
function campaign(){
 const max=1000,from=campaignPage*30+1,to=Math.min(max,from+29),levels=Array.from({length:to-from+1},(_,i)=>from+i);
 return header('Gemstone Campaign','1,000 seeded stages. Unlock the next one by clearing your current level.')+
 '<div class="panel campaign-bar">'+button('campaign-prev','← Previous','secondary',campaignPage===0?'disabled':'')+'<strong>'+from+'–'+to+' / 1000</strong>'+button('campaign-next','Next →','secondary',to===1000?'disabled':'')+'</div>'+
 '<div class="level-grid">'+levels.map(n=>'<button class="level '+(saved.stars[n]?'cleared':n<=saved.unlocked?'unlocked':'locked')+'" data-action="play-level" data-level="'+n+'" '+(n>saved.unlocked?'disabled':'')+' aria-label="Level '+n+(n>saved.unlocked?' locked':'')+'"><b>'+n+'</b><small>'+(saved.stars[n]?'★ '+saved.stars[n]:'')+'</small></button>').join('')+'</div>'+
 '<section class="panel"><h2>Elemental Trials</h2><p>Challenge 300 elemental encounters as they unlock alongside campaign progress.</p>'+button('go-trials','VIEW TRIALS')+'</section>';
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
 active=E.create(id,id*7919+saved.unlocked*17);selected=-1;outcome=null;page='game';render();
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
 '<div class="board-frame"><div class="board" style="--columns:'+g.cfg.width+'">'+g.cells.map((c,i)=>'<button class="cell '+(!c?'hole ':'')+(selected===i?'selected':'')+'" data-action="cell" data-cell="'+i+'" '+(!c?'disabled':'')+' aria-label="Tile '+(i+1)+(c?' '+E.TYPES[c.type]+(Shared.label(c)?', '+escape(Shared.label(c)):''):' empty')+'">'+piece(c,i)+'</button>').join('')+'</div></div>'+
 '<p class="hint">Tap two adjacent gems to swap them. Non-matching swaps still use a move. Select a gem before using targeted tools.</p>'+
 '<div class="booster-grid">'+E.BOOSTERS.filter(id=>P.unlocked(saved,id)).map(id=>'<button class="booster" data-action="booster" data-booster="'+id+'" '+(P.count(saved,id)<1?'disabled':'')+' title="'+escape(E.BOOSTER_META[id].tip)+'">'+icon(id,36)+'<b>'+escape(E.BOOSTER_META[id].label)+'</b><small>×'+P.count(saved,id)+'</small></button>').join('')+'</div>'+
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
 active=null;selected=-1;page='result';save();
}
function results(){
 const x=outcome;if(!x)return home();
 return header(x.won?'Brilliant!':'Try again',x.won?'The vault yields its treasures.':'The crystal board held firm this time.')+
 '<div class="hero"><div class="hero-art">'+[0,1,6].map(i=>gem(i)).join('')+'</div><h2>Score: '+number(x.score)+'</h2>'+
 (x.won?'<p>+'+number(x.earned)+' Rupees · +'+number(x.bonus)+' Star Gems</p>':'<p>One life used. Mine resources or claim a refill to keep playing.</p>')+
 button('result-next',x.won?'NEXT LEVEL':'RETRY LEVEL','primary')+button('go-mine','VISIT THE MINES')+button('go-campaign','LEVEL MAP','quiet')+'</div>';
}
function offerCard(id,o){
 const balance=o.currency==='gems'?saved.gems:saved.coins;
 return '<div class="shop-item">'+icon(o.kind==='hearts'?'heart':'extra',38)+'<strong>'+escape(o.name)+'</strong><small>'+o.amount+' '+(o.kind==='hearts'?'life/lives':'moves')+'</small>'+
 button('buy-currency',(o.currency==='gems'?'STAR GEMS ':'RUPEES ')+number(o.cost),'primary','data-offer="'+id+'" '+(balance<o.cost?'disabled':''))+'</div>';
}
function shop(){
 return header('Crystal Market','Spend earned Rupees or Star Gems. Every exchange grants real in-game supplies; no cash checkout is required.')+stats()+
 '<h2 class="subhead">Lives &amp; moves</h2><div class="shop-grid">'+Object.entries(P.SHOP_EXCHANGES).map(([id,o])=>offerCard(id,o)).join('')+'</div>'+
 '<h2 class="subhead">Booster supplies</h2><div class="shop-grid">'+E.BOOSTERS.map(id=>'<div class="shop-item">'+icon(id,39)+'<strong>'+escape(E.BOOSTER_META[id].label)+'</strong><small>Stock ×'+P.count(saved,id)+'</small>'+
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
 return header('Prism Vale Mines','Available from the start. Mine crystal ore, refine it, and turn the proceeds into match-3 supplies.')+
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
 '<div class="panel"><h2>Game data</h2><p>Your progress, mine equipment, balances and boosters are saved locally on this device.</p>'+button('advanced',advanced?'HIDE ADVANCED SETTINGS':'ADVANCED SETTINGS','secondary')+
 (advanced?'<div class="danger"><h3>Account maintenance</h3><p>Emergency testing only. Reset deletes all Rupee Rush progress from this device.</p>'+
 button('reset-start','ACCOUNT RESET','quiet')+(resetStep?'<p class="warning">This deletes every stage clear, item, currency and mining upgrade.</p>'+button('reset-confirm',resetStep===1?'CONTINUE TO FINAL CONFIRMATION':'ERASE RUPEE RUSH DATA','danger')+button('reset-cancel','CANCEL','secondary'):'')+'</div>':'')+'</div>';
}
function render(){
 P.migrate(saved);Mining.ensure(saved);bank();
 wallet.textContent=number(saved.coins);stars.textContent=number(saved.gems);
 root.innerHTML=(active&&page!=='game'?'<div class="resume-bar">'+button('resume-board','RESUME LEVEL '+active.level,'primary')+'</div>':'')+(page==='home'?home():page==='campaign'?campaign():page==='trials'?trials():page==='game'?gameplay():
  page==='result'?results():page==='shop'?shop():page==='mine'?mine():page==='rewards'?rewards():settings());
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
}
function finishMining(result,success){if(result?.valid){save();render();message(success);}else message('Cannot complete: '+(result?.reason||'unknown')); }
function handle(b){
 const a=b.dataset.action,info=b.dataset,now=Date.now();
 if(info.nav){nav(info.nav);return;}
 if(a==='resume-board'){if(!active)return message('No active level.');page='game';render();return;}if(a==='go-mine'){nav('mine');return;}if(a==='go-campaign'){nav('campaign');return;}if(a==='go-trials'){nav('trials');return;}
 if(a==='play-next'){start(saved.unlocked);return;}
 if(a==='play-level'){start(Number(info.level));return;}
 if(a==='campaign-prev'){campaignPage=Math.max(0,campaignPage-1);render();return;}
 if(a==='campaign-next'){campaignPage=Math.min(33,campaignPage+1);render();return;}
 if(a==='result-next'){const id=outcome?.won?(outcome.id>=T.FIRST?saved.unlocked:Math.min(1000,outcome.id+1)):outcome?.id;outcome=null;start(id||saved.unlocked);return;}
 if(a==='abandon'){active=null;nav('campaign');return;}
 if(a==='cell'){
  if(!active)return;const n=Number(info.cell);
  if(selected<0){selected=n;render();return;}
  if(selected===n){selected=-1;render();return;}
  if(!E.adjacent(active,selected,n)){selected=n;render();return;}
  if(bank().remaining<1)return message('Daily moves exhausted. Mine for a move pack.');
  const result=E.swap(active,selected,n);selected=-1;
  if(!result.valid){render();return message('That pair cannot be swapped.');}
  D.spend(saved,1,now,dailyCap());save();settle();render();return;
 }
 if(a==='booster'){
  if(!active)return;
  const id=info.booster,meta=E.BOOSTER_META[id];if(!meta||!P.unlocked(saved,id)||P.count(saved,id)<1)return;
  if(meta.targeted&&selected<0)return message('Select a gem first to target this booster.');
  const r=E.booster(active,id,meta.targeted?selected:undefined);
  if(!r.valid)return message('Booster unavailable: '+(r.reason||'not applicable'));
  P.spend(saved,id);if(id==='extra')D.topUp(saved,5,now,dailyCap());
  selected=-1;save();settle();render();return;
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
  if(resetStep===2){localStorage.removeItem(KEY);saved=defaultSave();P.migrate(saved);R.ensure(saved);Mining.ensure(saved);D.ensure(saved,now,dailyCap());active=null;outcome=null;mineTab='dig';advanced=false;resetStep=0;page='home';save();render();message('Rupee Rush local data reset.');return;}
 }
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;handle(b);});
render();window.RupeeRushDebug=Object.freeze({getSave:()=>JSON.parse(JSON.stringify(saved)),getPage:()=>page});
})();