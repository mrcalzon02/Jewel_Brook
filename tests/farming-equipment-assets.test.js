'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../web/art/embryon/town/farming');
const m=require('../web/art/embryon/town/farming/manifest.json');
assert.equal(m.schema,'rupee-rush/farming-equipment-runtime/v1');
assert.equal(m.status,'sliced-qa-not-gameplay-enabled');
assert.equal(m.sprites.length,41);
assert.equal(m.archive.additionalOverviewSprites,79);
const seen=new Set();
for(const a of m.sprites){
 assert(!seen.has(a.id),'duplicate icon '+a.id);seen.add(a.id);
 const file=path.resolve(root,a.file);
 assert(file.startsWith(root+path.sep),'asset path outside family');
 const b=fs.readFileSync(file);
 assert.equal(b.length,a.bytes,'runtime bytes '+a.id);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'source sprite hash '+a.id);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.deepEqual(a.size,[192,192]);
}
for(const id of ['shovel','watering-can','pruners','sickle','garden-plot','greenhouse','irrigation-pipe','water-pump','harvest-basket','harvest-boost','magic-seeds'])assert(seen.has(id),id);
const game=fs.readFileSync(path.resolve(__dirname,'../web/game.js'),'utf8');
assert(!game.includes('town/farming/equipment/'),'No premature game mechanics or visual replacement');
console.log('PASS Rupee Rush: 41 source-checked independent farming equipment sprites, QA hold for 79 overview slices');
