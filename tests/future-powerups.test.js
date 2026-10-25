/* Approved future-art reserve: image bytes and identity must not drift. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..');
const manifest=require('../web/art/embryon/future-powerups/manifest.json');
assert.equal(manifest.schema,'rupee-rush-future-powerups/v1');
assert.equal(Object.keys(manifest.categories).length,2);
assert.deepEqual(Object.values(manifest.categories).map(a=>a.length),[16,16]);
assert.equal(manifest.qa.iconCount,32);
assert.equal(manifest.files.length,32);
const ids=new Set();
for(const x of manifest.files){
 assert.equal(x.role,'individual-icon');
 assert(!ids.has(x.id),'Duplicate icon id '+x.id);ids.add(x.id);
 assert(x.path.startsWith('web/art/embryon/future-powerups/'+x.category+'/'));
 const bytes=fs.readFileSync(path.join(repo,x.path));
 assert.equal(bytes.length,x.size,x.path+' wrong bytes');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),x.sha256,x.path+' wrong SHA256');
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.deepEqual(x.size_px,[192,192]);
 assert.equal(x.transparent,true);
 assert.equal(x.semanticStatus,'concept; not a live booster mechanic');
}
for(const x of Object.values(manifest.categories))for(const id of x)assert(ids.has(id),'Lost listed icon '+id);
assert.equal(manifest.referenceSources.length,4,'Both original sheets and optimized atlases referenced');
const game=fs.readFileSync(path.join(repo,'web/game.js'),'utf8');
const engine=fs.readFileSync(path.join(repo,'web/engine.js'),'utf8');
assert(!game.includes('future-powerups'),'No runtime activation');
assert(!engine.includes('future-powerups'),'No mechanical activation');
console.log('PASS future-powerups: all 32 WebP source checksums, category keys, dimensions, alpha and isolation');