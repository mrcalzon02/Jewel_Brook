'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const Town=require('../web/town-avatars.js');
const dir=path.resolve(__dirname,'../web/art/embryon/town');
const manifest=require(path.join(dir,'manifest.json'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('Town is the new location naming and map clamps at 40',()=>{
 assert.equal(Town.name,'Town');
 assert.equal(Town.fromSave({unlocked:1}).level,1);
 assert.equal(Town.fromSave({unlocked:21}).level,21);
 assert.equal(Town.fromSave({unlocked:1000}).level,40);
 assert.equal(Town.avatar(-30).level,1);
 assert.equal(Town.avatar('oops').level,1);
 assert.match(Town.avatar(11).path,/daysha_lv_11\.png$/);
 assert.match(Town.avatar(40).sheet,/daysha_levels_31-40\.png$/);
});
test('all 40 actual Town avatar PNGs exist, are properly numbered, unique and transparent',()=>{
 assert.equal(manifest.avatars.length,40);
 assert.equal(new Set(manifest.avatars.map(x=>x.sha256)).size,40);
 for(let i=0;i<40;i++){
   const item=manifest.avatars[i];assert.equal(item.level,i+1);
   const file=path.resolve(dir,item.sprite);assert.ok(file.startsWith(dir+path.sep));
   const binary=fs.readFileSync(file);
   assert.equal(binary.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(binary.readUInt32BE(16),288);assert.equal(binary.readUInt32BE(20),480);
   assert.equal(binary[25],6,'RGBA PNG (true transparency capable)');
   assert.equal(sha(file),item.sha256);
   const lookup=Town.avatar(item.level);
   assert.equal(lookup.path,'art/embryon/town/'+item.sprite);
 }
});
test('four exact ten-level sheets are retained and original source is cross-referenced in Drive',()=>{
 assert.equal(manifest.sheets.length,4);
 for(let j=0;j<4;j++){
  const sheet=manifest.sheets[j];assert.deepEqual(sheet.levels,[10*j+1,10*j+10]);
  const file=path.resolve(dir,sheet.file);assert.equal(sha(file),sheet.sha256);
  const binary=fs.readFileSync(file);assert.equal(binary.readUInt32BE(16),1536);assert.equal(binary.readUInt32BE(20),1024);
 }
 assert.equal(manifest.source.file,null);
 assert.match(manifest.source.sha256,/^[a-f0-9]{64}$/);
 assert.match(manifest.source.driveUrl,/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view/);
 assert.equal(manifest.source.retainedInRepository,false);
});
