/* Heroes of Embryon: distinct SFX and original Wayfinder dialogue.
   No borrowed Nut Buster recordings, no internet TTS, voice OFF by default. */
(function(root){'use strict';
const STORE='rupeerush.audio.v1';
const SOUNDS=new Set('tap swap match cascade blocked booster victory defeat purchase mine-hit ore-find refine chapter-enter reward'.split(' '));
const PHRASES=Object.freeze({"startup":["The roads of Embryon are yours to explore.","There are treasures beneath this kingdom.","A new expedition begins."],"enter1":["The Goblin Caves. Keep an eye on the rafters.","Watch the loose stones. The goblins have been digging.","Those lanterns are still warm."],"enter2":["Troll Caverns ahead. Choose your footing.","Ancient stone, and something heavier beyond it.","There is more than ore beneath those gates."],"enter3":["Sulfur Sumps. Mind the fumes.","A spark could wake the whole sump.","Stay above the yellow water, if you can."],"enter4":["Mushroom Mire. Not every glowing thing is a gem.","The Mire breathes. Best not to linger.","Follow the dry planks through the spore fog."],"enter5":["Ghost Mines. Listen before you dig.","These tracks remember their last journey.","The lanterns move, even without a hand to carry them."],"levelStart":["Crystals at the ready.","There is a path through this puzzle.","Set your sights on the objective."],"match3":["A clean cut.","Well placed.","Bright work.","A neat fit."],"match4":["A fine chain.","Four stones in harmony.","That opened a path."],"match5":["A brilliant alignment.","Five stones, one perfect line.","A radiant combination."],"cascade":["The stones keep falling!","A crystal chain reaction!","Now that is momentum.","Watch the cascade."],"combo":["Your rhythm is building.","Keep that current flowing.","Another perfect connection."],"boosterUsed":["A little crystalcraft.","Let the magic do its work.","That should clear a path."],"hammer":["One stubborn stone, no more.","A well-placed strike."],"rocket":["Clear the passage!","A streak of light!"],"bomb":["Brace for the burst!","Crystals incoming!"],"shuffle":["Let us try another arrangement.","A fresh pattern."],"color":["One color, swept away.","Follow the spectrum."],"lowMoves":["Make these last moves count.","Only a few chances remain."],"noMoves":["The crystal current has gone still.","Time to regroup."],"levelVictory":["The way forward is open!","Another passage reclaimed.","Embryon grows brighter.","A fine expedition, indeed."],"levelDefeat":["A setback. The tunnels will still be here.","Even the finest prospector meets a wall.","Return when you are ready."],"firstClear":["A first victory worth remembering.","A new marker on the expedition map."],"chapterClear":["One cavern conquered. Another waits.","That chapter of the journey is yours."],"gameComplete":["The deep roads of Embryon shine again.","A thousand trials, and you endured them all."],"mineEnter":["The ore will not dig itself.","Back into the mine we go.","Listen for the hollow stone."],"mineHit":["Stone by stone.","A solid strike.","Steady hands."],"mineEmpty":["Nothing but stone this time.","An empty seam. Keep searching."],"oreFound":["There is the good stuff!","A promising vein!","Fresh ore for the refinery."],"oreCart":["Load it carefully.","Another cart ready."],"refine":["A beautiful polish.","From stone to splendor."],"parcel":["Pack it well.","A merchant will take that."],"mineUpgrade":["Fine equipment. Treat it well.","A sturdier tool for darker tunnels."],"shopEnter":["Welcome to the Crystal Market.","Something useful for the road?"],"shopPurchase":["A wise acquisition.","A fair trade.","May it serve you well."],"shopInsufficient":["Your purse is a touch light.","We may need more Rupees for that."],"rewardReady":["There is a gift waiting for you.","A little help for the road."],"rewardClaimed":["A welcome reward.","That should help the expedition."],"unlock":["Another passage has opened.","A new route beckons."],"pause":["The tunnels can wait.","Take your bearings."],"resume":["Welcome back, explorer.","Shall we finish what we started?"],"settings":["Choose the sound of your adventure."],"saveRecovered":["Your unfinished puzzle is safe.","The crystals are just as you left them."],"soundOff":["The caverns fall quiet."],"soundOn":["The caverns sing again."]});
const fallback={sfx:true,voice:false,sfxVolume:.65};
const live=new Set();let clipIndex=0,context=null;
let config={...fallback};try{const raw=root.localStorage?.getItem(STORE),prev=raw&&JSON.parse(raw);if(prev&&typeof prev==='object')config={sfx:prev.sfx!==false,voice:prev.voice===true,sfxVolume:Math.max(0,Math.min(1,Number(prev.sfxVolume??.65)||0))};}catch(_){}
let lastSpeech=0,previousId='',lineOffset=0;
function settings(){return {...config};}
function configure(p){
 config={sfx:typeof p.sfx==='boolean'?p.sfx:config.sfx,
  voice:typeof p.voice==='boolean'?p.voice:config.voice,
  sfxVolume:Number.isFinite(p.sfxVolume)?Math.max(0,Math.min(1,p.sfxVolume)):config.sfxVolume};
 if(!config.sfx)for(const a of [...live]){try{a.pause();}catch(_){}live.delete(a);}
 try{root.localStorage?.setItem(STORE,JSON.stringify(config));}catch(_){}
 return settings();
}
function synthesize(id,rate=1,level=1){
 const AudioContext=root.AudioContext||root.webkitAudioContext;
 if(!AudioContext||!config.sfx||config.sfxVolume<=0)return false;
 try{
  if(!context)context=new AudioContext();
  context.resume?.().catch?.(()=>{});
  const specs={match:[740,330,.09,'sine'],cascade:[900,470,.14,'triangle'],
   swap:[470,660,.065,'sine'],blocked:[240,140,.11,'triangle'],
   booster:[430,960,.19,'triangle'],victory:[680,1150,.24,'sine']};
  const [from,to,duration,wave]=specs[id]||[400,620,.10,'sine'];
  const t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
  osc.type=wave;
  osc.frequency.setValueAtTime(from*rate,t);
  osc.frequency.exponentialRampToValueAtTime(to*rate,t+duration);
  const strength=Math.max(.0001,Math.min(.18,.12*config.sfxVolume*level));
  gain.gain.setValueAtTime(.0001,t);
  gain.gain.exponentialRampToValueAtTime(strength,t+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+duration+.015);
  return true;
 }catch(_){return false;}
}
function play(id,{delay=0,rate=1,level=1}={}){
 if(!config.sfx||!SOUNDS.has(id)||config.sfxVolume<=0)return false;
 const rateLimit=Math.min(1.20,Math.max(.80,Number(rate)||1));
 function start(){
  if(!config.sfx)return;
  if(typeof root.Audio!=='function'||live.size>=18){synthesize(id,rateLimit,level);return;}
  try{
   const a=new root.Audio('audio/sfx/'+id+'.wav');
   live.add(a);let finished=false;
   const finish=()=>{if(finished)return;finished=true;live.delete(a);};
   const failure=()=>{finish();synthesize(id,rateLimit,level);};
   a.preload='auto';
   a.volume=Math.max(0,Math.min(1,config.sfxVolume*(id==='victory'?.75:.43)*level));
   a.playbackRate=rateLimit;
   a.onended=finish;a.onerror=failure;
   const promise=a.play();promise?.catch?.(failure);
  }catch(_){synthesize(id,rateLimit,level);}
 }
 if(delay>0){(root.setTimeout||setTimeout)(start,Math.round(delay*1000));return true;}
 start();return true;
}
// Match resolution is not one click: each removed stone has a slightly distinct pop.
function burst(count,wave=1){
 if(!config.sfx)return 0;
 const n=Math.min(12,Math.max(0,Math.trunc(Number(count)||0)));
 for(let i=0;i<n;i++)play(wave>1&&i===0?'cascade':'match',{
  delay:i*.018,rate:.86+(i%7)*.047,level:n>8?.59:.75
 });
 return n;
}
function speak(id){
 const phrases=PHRASES[id];if(!config.voice||!phrases||!phrases.length)return false;
 if(!root.speechSynthesis||typeof root.SpeechSynthesisUtterance!=='function')return false;
 const now=Date.now();if(now-lastSpeech<3500)return false;
 const choice=phrases[(lineOffset++)%phrases.length];if(choice===previousId&&phrases.length>1)return false;
 previousId=choice;lastSpeech=now;
 try{
  if(root.speechSynthesis.speaking)return false;
  const u=new root.SpeechSynthesisUtterance(choice);u.lang='en-US';u.rate=1.04;u.pitch=1.15;u.volume=0.8;
  const available=root.speechSynthesis.getVoices?.()||[];
  const voice=available.find(v=>v.lang?.startsWith('en')&&/female|samantha|zira|aria|jenny/i.test(v.name))||available.find(v=>v.lang?.startsWith('en')&&v.localService);
  if(voice)u.voice=voice;
  root.speechSynthesis.speak(u);return true;
 }catch(_){return false;}
}
const api=Object.freeze({settings,configure,play,burst,speak,PHRASES});
root.RupeeAudio=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
