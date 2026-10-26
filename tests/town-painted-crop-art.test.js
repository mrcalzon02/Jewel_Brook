'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../web'),Crops=require('../web/crop-growth-art.js');
const meta=require('../web/art/embryon/town/gardening/growth/painted/manifest.json');
test('all 55 actual painted sprites match source SHA256 and are alpha-enabled 512px WebP',()=>{
 assert.equal(meta.sprite_count,55);
 assert.equal(meta.sprites.length,55);
 assert.deepEqual(Crops.PAINTED,meta.crops);
 assert.deepEqual(Crops.STAGES,meta.stages);
 const paths=new Set(),hashes=new Set();
 for(const entry of meta.sprites){
  const expected='art/embryon/town/gardening/growth/painted/'+entry.crop+'-'+entry.stage+'.webp';
  assert.equal(Crops.image(entry.crop,entry.stage),expected);
  assert.equal(entry.asset,'web/'+expected);
  const p=path.join(root,expected),bytes=fs.readFileSync(p);
  assert.equal(bytes.length,entry.bytes,p);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,p);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',p);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',p);
  assert.equal(bytes.toString('ascii',12,16),'VP8X',p);
  assert.equal(bytes[20]&0x10,0x10,'image must contain alpha: '+p);
  assert.equal(1+bytes.readUIntLE(24,3),512,'width '+p);
  assert.equal(1+bytes.readUIntLE(27,3),512,'height '+p);
  assert.deepEqual(entry.dimensions,[512,512]);
  assert(entry.render_bbox[0]>=0&&entry.render_bbox[1]>=0);
  assert(entry.render_bbox[2]<=512&&entry.render_bbox[3]<=512);
  assert(!paths.has(expected),'duplicate sprite path');
  paths.add(expected);hashes.add(entry.sha256);
 }
 assert.equal(paths.size,55);assert.equal(hashes.size,55);
});
test('eleven crops prefer painted art, other 37 retain old tested transparent SVGs',()=>{
 assert.equal(Crops.CROPS.length,48);
 for(const c of Crops.CROPS)for(const st of Crops.STAGES){
  const expected=Crops.PAINTED.includes(c)?'.webp':'.svg';
  assert(Crops.image(c,st).endsWith(expected),c+'/'+st);
  assert(fs.existsSync(path.join(root,Crops.image(c,st))),c+'/'+st);
  assert(fs.existsSync(path.join(root,Crops.vector(c,st))),c+'/'+st+' SVG fallback');
 }
 assert.equal(Crops.image('bogus','ready'),null);
 assert.equal(Crops.fromStatus({crop:'carrot',state:'ready'}),Crops.image('carrot','ready'));
 assert.equal(Crops.fromStatus({crop:'wheat',state:'ready'}),Crops.image('wheat','ready'));
});

test('all eleven lossless source sheets are archived with reproducible dimensions and digests',()=>{
 assert.equal(meta.sourceMasters.length,11);
 const seen=new Set();
 for(const master of meta.sourceMasters){
  const bytes=fs.readFileSync(path.join(root,master.path.slice(4)));
  assert.equal(bytes.length,master.bytes,master.crop);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),master.sha256,master.crop);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.toString('ascii',12,16),'VP8L','master must be pixel-lossless');
  assert.equal(bytes[20],0x2f);
  const width=1+(bytes[21]|((bytes[22]&63)<<8));
  const height=1+((bytes[22]>>6)|(bytes[23]<<2)|((bytes[24]&15)<<10));
  assert.deepEqual([width,height],master.dimensions);
  seen.add(master.crop);
 }
 assert.deepEqual([...seen],meta.crops);
});

test('original Crimson Beet painting is production art; recolored Radish draft stays archive only',()=>{
 const stages=meta.sprites.filter(s=>s.crop==='beet');
 const master=meta.sourceMasters.find(s=>s.crop==='beet');
 assert(master&&stages.length===5);
 assert.deepEqual(stages.map(s=>s.stage),Crops.STAGES);
 const draft=require('../web/art/embryon/town/gardening/growth/candidates/crimson-beet-v1/manifest.json');
 assert.equal(draft.runtime_integrated,false);
 for(const stage of stages){
  assert.equal(stage.source,master.path);
  assert.equal(stage.render_bbox[3],487);
  assert.equal(Crops.image('beet',stage.stage),'art/embryon/town/gardening/growth/painted/beet-'+stage.stage+'.webp');
  assert(!draft.assets.some(s=>s.sha256===stage.sha256),'new painting must not reuse Radish-derived candidate');
 }
});

test('Blazevine Tomato original painting has five distinct verifiable stage images and a separate master',()=>{
 const tomato=meta.sprites.filter(s=>s.crop==='tomato');
 assert.equal(tomato.length,5);
 assert.deepEqual(tomato.map(s=>s.stage),Crops.STAGES);
 const master=meta.sourceMasters.find(s=>s.crop==='tomato');
 assert(master && master.format==='lossless_WEBP');
 const hashSet=new Set(tomato.map(s=>s.sha256));
 assert.equal(hashSet.size,5);
 for(const art of tomato){
  assert.equal(art.source,master.path);
  assert.equal(art.render_bbox[3],487);
  assert.equal(Crops.image('tomato',art.stage),'art/embryon/town/gardening/growth/painted/tomato-'+art.stage+'.webp');
 }
 assert.equal(Crops.vector('tomato','ready'),'art/embryon/town/gardening/growth/tomato-ready.svg');
});
