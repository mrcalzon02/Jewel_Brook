/* Embryon art spec static contract; does not assert gameplay integration or image QA. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),art=path.join(root,'web','art','embryon');
const ref=require(path.join(art,'approved-reference.json'));
const tok=require(path.join(art,'style-tokens.json'));
test('approved Daysha style reference has canonical identity and checkable source',()=>{
 assert.equal(ref.approved,true);assert.equal(ref.file,'crystal_princess_of_the_sky_palace.png');
 assert.match(ref.sha256,/^[0-9a-f]{64}$/);assert.equal(ref.productionAssetInRepo,true);
 const original=path.join(art,'characters','daysha-approved-key-art.png');
 const data=fs.readFileSync(original);
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Approved Daysha source must be a PNG');
 assert.equal(data.readUInt32BE(16),1122,'Approved Daysha width');
 assert.equal(data.readUInt32BE(20),1402,'Approved Daysha height');
 assert.equal(require('node:crypto').createHash('sha256').update(data).digest('hex'),ref.sha256,'Approved Daysha must match exact original source');

 assert.equal(tok.approvedCharacterReference.sha256,ref.sha256);assert.equal(tok.approvedCharacterReference.imageWidth,1122);
});
test('palette contains named tokens for character, gems and UI',()=>{
 for(const c of ['night','royal','sapphire','crystal','gold','ivory','ruby','emerald','amber','hair','iris']) assert.match(tok.colors[c],/^#[0-9a-f]{6}$/i);
 assert.ok(tok.ui.targetMinCssPx>=44);assert.ok(tok.ui.gemReadabilityCssPx.includes(32));
 assert.equal(tok.setting,'Heroes of Embryon');
});
test('design specimens exist and are not linked as game-ready sprites',()=>{
 for(const f of ['components/royal-button.svg','components/crystal-medallion.svg']){
  const s=fs.readFileSync(path.join(art,f),'utf8');assert.match(s,/^<svg/);assert.match(s,/<title/);
 }
 for(const doc of ['docs/ART_STYLE_MASTER.md','docs/DAYSHA_ART_CONTRACT.md','docs/EMBRYON_ART_PRODUCTION.md']) assert.ok(fs.statSync(path.join(root,doc)).size>200);
 assert.ok(fs.statSync(path.join(art,'preview.html')).size>200);
});
