'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../web');
const E=require('../web/engine.js'),Chapters=require('../web/embryon-chapters.js'),Audio=require('../web/embryon-audio.js');
const book=require('../web/level-design.js');
test('Embryon has precisely five 200-stage chapters with no gap',()=>{
 assert.equal(Chapters.CHAPTERS.length,5);
 assert.deepEqual(Chapters.CHAPTERS.map(c=>c.title),['Goblin Caves','Troll Caverns','Sulfur Sumps','Mushroom Mire','Ghost Mines']);
 for(let i=1;i<=1000;i++){const c=Chapters.forLevel(i);assert.equal(c.id,Math.floor((i-1)/200)+1);assert.ok(c.start<=i&&i<=c.end);}
 assert.equal(Chapters.forLevel(1001),null);assert.equal(Chapters.byId('4').title,'Mushroom Mire');
 // Mechanics remain in ten difficulty bands; public chapter names are paired.
 assert.equal(book.CHAPTERS.length,10);
 for(let i=0;i<10;i++)assert.equal(book.CHAPTERS[i],Chapters.CHAPTERS[Math.floor(i/2)].title);
});
test('Save restoration matches the exact next deterministic board, including RNG',()=>{
 const original=E.create(48,516883);
 function adjacent(g){for(let i=0;i<g.cells.length;i++)for(const j of [i+1,i+g.cfg.width])if(j<g.cells.length&&E.adjacent(g,i,j))return [i,j];throw Error('no adjacent tiles');}
 for(let i=0;i<3;i++){const pair=adjacent(original);assert.equal(E.swap(original,...pair).valid,true);}
 const compact=JSON.parse(JSON.stringify(E.snapshot(original)));
 const resumed=E.restore(compact);
 assert.ok(resumed);
 assert.deepEqual(E.snapshot(resumed),E.snapshot(original));
 const pair=adjacent(original);
 assert.deepEqual(E.swap(resumed,...pair),E.swap(original,...pair));
 assert.deepEqual(E.snapshot(resumed),E.snapshot(original));
 assert.equal(E.restore({...compact,cells:[null]}),null);
 assert.equal(E.restore({...compact,won:true}),null);
});
test('Approved chapter map, chapter art, shop and mining background binaries are local',()=>{
 const assets=['art/embryon/locations/embryon-chapter-overview.webp','art/embryon/locations/embryon-mine.webp','art/embryon/locations/embryon-market.webp',...Chapters.CHAPTERS.map(c=>c.art)];
 for(const asset of assets){const b=fs.readFileSync(path.join(root,asset));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');}
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(index.indexOf('src="embryon-chapters.js"')<index.indexOf('src="game.js"'));
 assert.ok(index.indexOf('src="embryon-audio.js"')<index.indexOf('src="game.js"'));
 const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
 for(const needed of ['open-chapter','embryon-map','location-market','location-mine','E.restore(','E.snapshot(','toggle-voice'])assert.ok(game.includes(needed),needed);
});
test('Original sound files are valid RIFF PCM and match tracked hashes',()=>{
 const m=require('../web/audio/sfx/manifest.json');assert.equal(m.files.length,14);
 for(const a of m.files){const f=fs.readFileSync(path.join(root,a.path));assert.equal(f.toString('ascii',0,4),'RIFF');assert.equal(f.toString('ascii',8,12),'WAVE');assert.equal(crypto.createHash('sha256').update(f).digest('hex'),a.sha256);assert.equal(f.length,a.bytes);}
 const v=require('../web/audio/embryon-announcer-lines.json');
 assert.equal(v.character,'The Embryon Wayfinder');assert.ok(Object.keys(v.lines).length>=40);
 const count=Object.values(v.lines).reduce((n,arr)=>n+arr.length,0);assert.ok(count>=100);
 for(let i=1;i<=5;i++)assert.ok(v.lines['enter'+i]?.length>=3);
 assert.equal(Audio.settings().voice,false,'voice playback is opt-in');
});
