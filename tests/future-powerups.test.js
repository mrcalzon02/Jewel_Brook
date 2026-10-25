'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../web');
const manifest=require('../web/art/embryon/future-powerups/manifest.json');
assert.equal(manifest.schema,'rupee-rush-future-powerups/v1');
assert.equal(Object.keys(manifest.categories).length,2);
assert.deepEqual(Object.values(manifest.categories).map(a=>a.length),[16,16]);
assert.equal(manifest.qa.iconCount,32);
assert.equal(manifest.files.length,36);
const ids=new Set();
let sprites=0,originals=0,atlases=0;
for(const entry of manifest.files){
 assert(!ids.has(entry.path),'Duplicate file: '+entry.path); ids.add(entry.path);
 assert(entry.path.startsWith('web/art/embryon/future-powerups/'),'Future art must not overwrite live booster art');
 const bytes=fs.readFileSync(path.join(__dirname,'..',entry.path));
 assert.equal(bytes.length,entry.size,'Asset size mismatch: '+entry.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,'Asset hash mismatch: '+entry.path);
 if(entry.role==='original-unaltered'){
  originals++;
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG source corrupted');
  assert.equal(bytes.readUInt32BE(16),1254);assert.equal(bytes.readUInt32BE(20),1254);
 }else{
  assert.equal(bytes.toString('ascii',0,4),'RIFF','Not RIFF: '+entry.path);
  assert.equal(bytes.toString('ascii',8,12),'WEBP','Not WebP: '+entry.path);
  if(entry.role==='individual-icon'){
    sprites++;
    assert.deepEqual(entry.size_px,[192,192]);
    assert.equal(entry.transparent,true);
    assert.equal(entry.semanticStatus,'concept; not a live booster mechanic');
    assert(entry.sourceCell[0]>=1&&entry.sourceCell[0]<=4&&entry.sourceCell[1]>=1&&entry.sourceCell[1]<=4);
  } else if(entry.role==='reference-atlas')atlases++;
 }
}
assert.equal(sprites,32);assert.equal(originals,2);assert.equal(atlases,2);
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'engine.js'),'utf8');
assert(!game.includes('future-powerups'),'The new icon reserve must not modify the live game UI yet');
assert(!engine.includes('future-powerups'),'Concept art does not alter booster balance or rules');
console.log('PASS Rupee Rush future powerups: 32 alpha icons, source PNGs, WebP atlases, checksums, gameplay isolation');