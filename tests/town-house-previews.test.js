'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web');
const draw=require('../scripts/generate-town-house-previews.js').drawHouse;
const Houses=require('../web/town-houses.js');
const gallery=fs.readFileSync(path.join(root,'town-house-art-review.html'),'utf8');
const manifest=require('../web/art/embryon/town/houses/previews/manifest.json');
test('40 different house illustration files are transparent SVGs reproduced by the generator',()=>{
 assert.equal(manifest.assets.length,40);
 assert.match(manifest.status,/not approved/);
 const seen=new Set();
 for(let i=1;i<=40;i++){
  const e=Houses.house(i);assert.equal(e.level,i);assert.equal(e.approved,false);
  assert.equal(e.name,require('../web/art/embryon/town/houses/plan.json').entries[i-1].name);
  assert.match(e.path,/house_lv_\d\d\.svg$/);
  const svg=fs.readFileSync(path.join(root,e.path),'utf8');
  assert.equal(svg,draw(i),'level '+i+' is not generator-identical');
  assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 -56 480 516"/);
  assert.doesNotMatch(svg,/acorn|squirrel|<rect\b/i);
  assert.match(svg,/transform="translate\(47 0\) scale\(\.92 1\)"/,'consistent sprite-anchor framing');
  seen.add(svg);
 }
 assert.equal(seen.size,40);
});
test('house display follows purchased Town upgrade level, never Daysha/campaign level',()=>{
 const save={unlocked:900,town:{houseLevel:2}},first=Houses.fromSave(save);
 assert.equal(first.level,2);
 save.unlocked=1;assert.equal(Houses.fromSave(save).path,first.path);
 save.town.houseLevel=40;assert.equal(Houses.fromSave(save).level,40);
 assert.equal(Houses.house(41).level,40);
 assert.equal(Houses.house(-1).level,1);
 assert.equal(Houses.fromSave({}).level,1);
});
test('starter hovel is not a premature castle or manor, with separate functional beds',()=>{
 const l1=draw(1),l10=draw(10),l11=draw(11),l21=draw(21),l31=draw(31),l40=draw(40);
 assert.notEqual(l1,l10);assert.notEqual(l10,l11);assert.notEqual(l21,l31);assert.notEqual(l31,l40);
 assert.doesNotMatch(l10,/fortress|castle/i);
 assert.match(manifest.bases,/Ground and crop beds are independent/);
});

test('four review boards display forty full house candidates with real transparent inspection',()=>{
 assert.match(gallery,/Four independent ten-level review boards/);
 assert.match(gallery,/const levels=/);
 assert.match(gallery,/window\.RupeeTownHouses\.house\(spec\.level\)/);
 assert.match(gallery,/band<4/);
 assert.match(gallery,/levels\.slice\(band\*10,band\*10\+10\)/);
 assert.match(gallery,/modal\.showModal\(\)/);
 assert.match(gallery,/alpha checkerboard/i);
});
