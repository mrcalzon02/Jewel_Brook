'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const base='web/art/embryon/town/gardening/growth/candidates/crimson-beet-v1/';
const manifest=require('../web/art/embryon/town/gardening/growth/candidates/crimson-beet-v1/manifest.json');
const resolver=require('../web/crop-growth-art.js');

test('Crimson Beet draft has five distinct verifiable transparent images but is never deployed as approved art',()=>{
 assert.equal(manifest.crop,'beet');
 assert.equal(manifest.approval_status,'draft_only_not_approved');
 assert.equal(manifest.runtime_integrated,false);
 assert.equal(manifest.source_reuse_approved_for_production,false);
 assert.equal(manifest.assets.length,5);
 assert.deepEqual(manifest.stages,['seed','sprout','growing','maturing','ready']);
 assert.ok(!resolver.PAINTED.includes('beet'),'Only an approved painted beet should replace the SVG in the live game');
 assert.equal(resolver.image('beet','ready'),'art/embryon/town/gardening/growth/beet-ready.svg');
 const hashes=new Set();
 for(const item of manifest.assets){
  assert(item.path.startsWith(base));
  assert.equal(item.path,base+'beet-'+item.stage+'.webp');
  const file=fs.readFileSync(path.join(root,item.path));
  assert.equal(file.length,item.bytes,item.stage);
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'),item.sha256,item.stage);
  assert.equal(file.toString('ascii',0,4),'RIFF');
  assert.equal(file.toString('ascii',8,12),'WEBP');
  assert.equal(file.toString('ascii',12,16),'VP8X','extended WebP required for transparency');
  assert.equal(file[20]&0x10,0x10,'alpha channel required');
  assert.equal(file.readUIntLE(24,3)+1,512);
  assert.equal(file.readUIntLE(27,3)+1,512);
  hashes.add(item.sha256);
 }
 assert.equal(hashes.size,5);
 const review=fs.readFileSync(path.join(root,base,'review.png'));
 assert.equal(review.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});
