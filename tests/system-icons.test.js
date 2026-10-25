'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.join(__dirname,'../web');
const manifest=require('../web/art/embryon/system-icons/manifest.json');
const icons=require('../web/system-icons.js');
const game=fs.readFileSync(path.join(base,'game.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
assert.equal(manifest.schema,'rupee-system-icon-assets/v1');
assert.equal(icons.navigation.length,16);
assert.equal(icons.gameplay.length,16);
const sprites=manifest.assets.filter(item=>item.id!=='navigation-economy-atlas'&&item.id!=='gameplay-hazards-atlas');
assert.equal(manifest.assets.length,34);
assert.equal(sprites.length,32);
assert.equal(new Set(sprites.map(x=>x.path)).size,32,'No duplicate sprite assigned');
for(const item of manifest.assets){
 const absolute=path.join(base,item.path),bytes=fs.readFileSync(absolute);
 assert.equal(bytes.length,item.bytes,item.path+' byte count');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path+' altered');
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 const name=item.id;
 if(!name.endsWith('-atlas'))assert.equal(icons.get(name),item.path);
}
for(const x of ['home','levels','mine','shop','rewards','settings']){
 const p=icons.get(x);
 assert(html.includes('src="'+p+'"'),'Approved navigation art missing '+x);
}
for(const x of ['rupee','star-gems']){
 assert(html.includes('src="'+icons.get(x)+'"'),'Top wallet must use approved currency art');
}
assert(html.includes('<script src="system-icons.js"></script>'));
assert(html.indexOf('system-icons.js')<html.indexOf('game.js'));
assert(game.includes('Icons.get(id)||Shared.icons[id]||Art.icon(id)'),'System icons precede vector fallback');
assert(game.includes("Icons.get('portal')")&&game.includes("Icons.get('wind-'+dir)"),'Board features use approved icon family');
assert(game.includes('gem-special-art'),'Special tile sigils use booster art rather than emoji');
assert.equal(icons.get('extra'),icons.get('daily-moves'));
assert.equal(icons.get('campaign'),icons.get('levels'));
assert.equal(icons.get('unknown'),null,'Unknown art IDs remain unchanged, not wrongly mapped');
console.log('PASS: 32 approved independent system icons, 2 atlases, source checksums and UI wiring');
