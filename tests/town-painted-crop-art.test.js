'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../web'),Crops=require('../web/crop-growth-art.js');
const meta=require('../web/art/embryon/town/gardening/growth/painted/manifest.json');
test('all 45 actual painted sprites match source SHA256 and are alpha-enabled 512px WebP',()=>{
 assert.equal(meta.sprite_count,45);
 assert.equal(meta.sprites.length,45);
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
 assert.equal(paths.size,45);assert.equal(hashes.size,45);
});
test('nine crops prefer painted art, other 39 retain old tested transparent SVGs',()=>{
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

test('all nine lossless source sheets are archived with reproducible dimensions and digests',()=>{
 assert.equal(meta.sourceMasters.length,9);
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
