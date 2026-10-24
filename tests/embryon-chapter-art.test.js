/* Five approved underground chapter image contracts; no gameplay mapping assertions. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const root=path.join(base,'web','art','embryon','locations','chapters');
const m=require(path.join(root,'manifest.json'));
test('five approved chapters retain order and declared identities',()=>{
 assert.equal(m.chapterCount,5);
 assert.deepEqual(m.chapters.map(c=>c.id),['goblin-caves','troll-caverns','sulfur-sumps','mushroom-mire','ghost-mines']);
 assert.deepEqual(m.chapters.map(c=>c.chapter),[1,2,3,4,5]);
});
test('each compressed chapter background is a complete original-derived WebP',()=>{
 for(const c of m.chapters){
  const p=path.join(root,c.runtimeFile);
  const bytes=fs.readFileSync(p);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',c.id);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',c.id);
  assert.equal(bytes.length,c.runtimeSizeBytes,c.id);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),c.runtimeSha256,c.id);
  assert.deepEqual(c.runtimeDimensions,[1280,720]);
  assert.match(c.sourceSha256,/^[0-9a-f]{64}$/);
  assert.equal(c.originalPreservedInDrive,true);
 }
});
