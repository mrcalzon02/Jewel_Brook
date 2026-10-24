'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const web=path.resolve(__dirname,'../web');
const m=require('../web/art/embryon/runtime/manifest.json');
const Assets=require('../web/embryon-assets.js'),E=require('../web/engine.js');
test('every implemented booster has its own approved, unique image and a function-matched VFX',()=>{
 assert.deepEqual([...Object.keys(Assets.BOOSTERS)].sort(),[...E.BOOSTERS].sort());
 assert.equal(new Set(Object.values(Assets.BOOSTERS)).size,16);
 for(const id of E.BOOSTERS){assert.ok(Assets.booster(id),id);assert.ok(Assets.effect(id),id);assert.ok(m.boosters[id],id);assert.ok(m.effects[id],id);}
 for(const id of ['match','cascade','victory'])assert.ok(Assets.effect(id),id);
});
test('all independent WebP files have actual bytes, safe alpha padding and the matching SHA-256',()=>{
 for(const category of ['boosters','effects','gems'])for(const [id,entry] of Object.entries(m[category])){
  const p=path.join(web,entry.file),bytes=fs.readFileSync(p);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',id);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',id);
  assert.equal(bytes.length,entry.bytes,id);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,id);
  assert.equal(Assets[category==='gems'?'gem':category==='boosters'?'booster':'effect'](id),entry.file);
  assert.match(entry.source_sha256,/^[0-9a-f]{64}$/);
  assert.equal(entry.alpha_bbox.length,4);
  assert.ok(entry.alpha_bbox[0]>0&&entry.alpha_bbox[1]>0&&entry.alpha_bbox[2]<192&&entry.alpha_bbox[3]<192,'sprite clipped: '+id);
 }
});
test('production screens use external isolated art without changing gameplay IDs or save identifiers',()=>{
 const g=fs.readFileSync(path.join(web,'game.js'),'utf8');
 const h=fs.readFileSync(path.join(web,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(web,'style.css'),'utf8');
 assert.match(h,/<script src="embryon-assets\.js"><\/script>/);
 assert.ok(h.indexOf('embryon-assets.js')<h.indexOf('game.js'));
 for(const code of ['boosterIcon(id,36)','boosterIcon(id,39)','impactMarkup(g)','Audio.play(\'booster\')'])assert.ok(g.includes(code),code);
 assert.match(css,/\.board-impact\{/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(g,/rupeerush\.save\.v1/);
 assert.equal(Assets.gem('peridot'),null);
 assert.equal(Assets.gem('turquoise'),null);
 assert.equal(Assets.gem('lapis'),null);
 for(const k of ['citrine','diamond','moonstone','garnet','onyx','opal','jade','tanzanite','alexandrite'])assert.ok(Assets.gem(k),k);
});
