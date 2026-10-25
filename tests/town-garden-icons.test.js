'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '../web/art/embryon/town/gardening');
const m = require(path.join(root,'manifest.json'));
const townPath=path.resolve(__dirname,'../web/town-garden.js');
const Town=fs.existsSync(townPath)?require(townPath):null;
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
test('Town garden art contains ten individually named RGBA assets with correct content hashes', () => {
 assert.equal(m.icons.length,10);
 assert.equal(new Set(m.icons.map(x=>x.id)).size,10);
 const signed = new Set();
 for (const icon of m.icons) {
  const file=path.resolve(root,icon.path);
  assert.ok(file.startsWith(root+path.sep));
  assert.ok(fs.existsSync(file),icon.path);
  const b=fs.readFileSync(file);
  assert.equal(digest(b),icon.sha256,icon.path);
  assert.equal(icon.bytes,b.length,icon.path);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b.readUInt32BE(16),512);
  assert.equal(b.readUInt32BE(20),512);
  assert.equal(b[25],6,'RGBA PNG');
  signed.add(icon.category);
 }
 assert.deepEqual([...signed].sort(),['fertilizer','seed','store']);
});
test('source image is preserved unchanged for slicing and audit',()=>{
 const p=path.join(root,m.source.path);const b=fs.readFileSync(p);
 assert.equal(digest(b),m.source.sha256);
 assert.equal(b.readUInt32BE(16),1448);
 assert.equal(b.readUInt32BE(20),1086);
});
test('only existing Town economy IDs are assigned; extra crops are not silently created',()=>{
 const ids=m.icons.filter(x=>x.gameplayMapping.id).map(x=>x.gameplayMapping);
 assert.equal(ids.length,6);
 assert.equal(ids.filter(x=>x.kind==='seed').length,3);
 assert.equal(ids.filter(x=>x.kind==='fertilizer').length,3);
 for(const link of ids){
  const allowed=link.kind==='seed'?['carrot','wheat','berry']:['compost','quality','royal'];
  assert.ok(allowed.includes(link.id),link.id);
  if(Town)assert.ok((link.kind==='seed'?Town.CROPS:Town.FERTILIZERS)[link.id],link.id);
 }
 const names=m.icons.map(x=>x.id);
 for(const id of ['seeds-onion','seeds-cabbage','seeds-herbs','seed-store-bundle']) {
  const icon=m.icons.find(x=>x.id===id);
  assert.ok(icon);
  assert.equal(icon.gameplayMapping.id,null);
 }
});
