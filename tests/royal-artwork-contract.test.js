'use strict';
// Deterministic artwork bytes, story unlocks, and replay checks (not screenshots).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const Royal=require('../web/royal-chronicle.js');
const Trials=require('../web/elemental-challenges.js');
const Rewards=require('../web/elemental-rewards.js');
const source=require('../web/art/embryon/story/elemental-gowns/manifest.json');
const pending=require('../data/daysha-generated-atelier-recovery.json');
const bytes=p=>fs.readFileSync(path.join(root,p));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitSha=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(source.garments.length,10);
assert.equal(Royal.GOWNS.length,10);
assert.equal(pending.entries.length,19);
assert.equal(new Set(pending.entries.map(a=>a.sha256)).size,19);
const catalog=new Map(source.garments.map(g=>[g.id,g]));
for(const gown of Royal.GOWNS){
  const record=catalog.get(gown.id);assert.ok(record,'Missing source record '+gown.id);
  for(const key of ['image','gitBlobSha','generatedSourceId','element','trialId','minimumMainLevel'])
    assert.equal(gown[key],record[key],gown.id+' '+key+' differs from source catalog');
  assert.equal(gown.subject,'Daysha');
  assert.equal(gown.historicalDay,null,'Do not invent dress purchase dates');
  const binary=bytes('web/'+gown.image);
  assert.equal(binary.toString('ascii',0,4),'RIFF');
  assert.equal(binary.toString('ascii',8,12),'WEBP');
  assert.equal(gitSha(binary),gown.gitBlobSha,'Wrong original artwork: '+gown.image);
  const profile=Trials.profile(gown.trialId);
  assert.ok(profile);assert.equal(profile.element,gown.element);
  assert.equal(profile.requiredMainLevel,gown.minimumMainLevel);
  assert.equal(Royal.gownsForTrial(gown.trialId).length,1);
  const save={unlocked:gown.minimumMainLevel,elementalTrials:{},coins:0,gems:0};
  assert.equal(Royal.gownUnlocked(save,gown),false,'Campaign gate is not a trial completion');
  if((gown.trialId-Trials.FIRST)%Trials.PER_AREA!==0)save.elementalTrials[gown.trialId-1]=1;
  assert.equal(Royal.gownUnlocked(save,gown),false,'Unrelated trial completion must stay locked');
  assert.equal(Trials.available(save,gown.trialId),true);
  const first=Rewards.clear(save,gown.trialId,250);
  assert.equal(first.valid,true);assert.equal(first.first,true);
  assert.equal(Royal.gownUnlocked(save,gown),true,'Successful trial must reveal its gown');
  const restored=JSON.parse(JSON.stringify(save));
  assert.equal(Royal.gownUnlocked(restored,gown),true,'Save/reload must keep the dress');
  const balances=[restored.coins,restored.gems];
  const replay=Rewards.clear(restored,gown.trialId,999);
  assert.equal(replay.valid,true);assert.equal(replay.first,false);
  assert.deepEqual([restored.coins,restored.gems],balances,'Replay cannot duplicate rewards');
  assert.equal(Royal.gownUnlocked({...restored,unlocked:gown.minimumMainLevel-1},gown),false);
}
const family=Royal.current({stars:{1000:3}}).events.filter(e=>e.track==='royal-family');
assert.ok(family.length>0);assert.ok(family.every(e=>!e.unlocked),'Do not reveal Estelle childhood in the opening campaign');
const byId=new Map(pending.entries.map(e=>[e.id,e]));
const published=Royal.ART.filter(a=>byId.has(a.id));
assert.ok(published.length===0||published.length===19,'Do not partially publish recovered atelier scenes');
assert.equal(Royal.ART.length,13+published.length,'Preserve all 13 earlier approved images');
for(const art of published){
 const entry=byId.get(art.id);
 assert.equal(art.eventId,entry.eventId,'Wrong royal episode');
 assert.equal(art.sourceSHA256,entry.sha256,'Lost original PNG identity');
 assert.equal(art.origin,'verified-generated-original-derived-webp');
 assert.match(art.src,/^art\/embryon\/story\/gilded-spindle\/runtime\//);
 const binary=bytes('web/'+art.src);
 assert.equal(binary.toString('ascii',0,4),'RIFF');
 assert.equal(binary.toString('ascii',8,12),'WEBP');
 assert.equal(sha256(binary),art.sha,'Published derivative bytes changed');
}
console.log('Verified 10/10 exact original Daysha gowns, trial/save/replay gates, and '+published.length+'/19 atelier imports.');
