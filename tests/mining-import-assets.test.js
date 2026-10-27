'use strict';
/* Guard the real Nut Buster mining-art import and its actual runtime use. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p));
const gitBlob = bytes => crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
const expected = {
  'web/art/primary/blockers/rock.png': '58655c1d030c5b2e40af0354ea4acc8393301ca2',
  'web/art/nutvale/mines/nutvale-mines-ore-atlas-approved.png': 'dd895c4bea75ac5566d4da8b7f36108e2ace2aa5',
  'web/art/nutvale/mining-tools/pickaxes/iron-prospector.png': 'cfacc7d66ca1d73817b1221c56325330f6428a6a',
  'web/art/nutvale/mining-tools/gloves/apprentice-leather.png': 'bfde521468b80de83b2ca7cff9ea8f38399f0076',
  'web/art/nutvale/mining-economy/goods/crate-mining-supplies.png': '7dc16e57b8cb859d100c4a0a74a46d1350e55bd7'
};
for (const [file, sha] of Object.entries(expected)) {
  const bytes = read(file);
  assert.equal(gitBlob(bytes), sha, 'Original imported bytes changed: ' + file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Not a PNG: ' + file);
}
const gear = require('../web/mining-gear.js');
for (const kind of ['pickaxe', 'gloves']) {
  for (let tier = 0; tier < 40; tier++) {
    const entry = gear.entry(kind, tier);
    assert.ok(entry.image.startsWith('art/nutvale/mining-tools/'), 'Wrong source family: ' + entry.image);
    assert.ok(fs.existsSync(path.join(root, 'web', entry.image)), 'Missing gear image: ' + entry.image);
  }
}
const html = read('web/index.html').toString('utf8');
const game = read('web/game.js').toString('utf8');
const css = read('web/style.css').toString('utf8');
assert.ok(html.includes('src="mining.js"'), 'Mining controller must load in APK');
assert.ok(html.includes('src="mine-ore-atlas.js"'), 'Approved atlas selector must load in APK');
assert.ok(game.includes('window.MineOreAtlas.sprite(c)'), 'Live mining tiles must use approved atlas, not placeholder rock');
assert.ok(css.includes('background-image:url(\'art/nutvale/mines/nutvale-mines-ore-atlas-approved.png\')'), 'Actual atlas PNG must be painted by mining CSS');
const oreAtlas=require('../web/mine-ore-atlas.js');
assert.deepEqual(oreAtlas.select({done:false,hits:0}),[0,0]);
assert.deepEqual(oreAtlas.select({done:false,hits:1}),[0,3]);
assert.deepEqual(oreAtlas.select({done:false,hits:2}),[0,4]);
assert.deepEqual(oreAtlas.select({done:true,kind:'barren'}),[3,0]);
assert.deepEqual(oreAtlas.select({done:true,kind:'ordinary'}),[1,0]);
assert.deepEqual(oreAtlas.select({done:true,kind:'rich'}),[1,2]);
assert.deepEqual(oreAtlas.select({done:true,kind:'crystal'}),[1,5]);
assert.ok(game.includes("c.hits?'CRACK '+c.hits+'/'+c.hardness:'ROCK'"), 'Hit progress must be visible');
assert.ok(game.includes("G.entry('pickaxe',s.pickTier).image"), 'Pickaxe tier image missing from mine');
assert.ok(game.includes("G.entry('gloves',s.gloveTier).image"), 'Glove tier image missing from mine');
assert.ok(game.includes('crate-mining-supplies.png'), 'Original supply crate icon missing');
assert.ok(!game.includes('mine-rock-chunk'), 'Synthetic rock fragments reintroduced');
assert.ok(!game.includes('mine-rock-fracture'), 'Tile overlay reused as a mining fracture');
assert.ok(!game.includes('mine-survey-indicator'), 'Survey is not a diamond/richness disclosure');
assert.ok(!css.includes('.mine-rock-chunk'), 'Invented rock CSS reintroduced');
assert.ok(!css.includes('.mine-rock-fracture'), 'Wrong magic overlay CSS reintroduced');
assert.ok(oreAtlas.sprite({done:true,kind:'rich'}).includes('mine-ore-slice'), 'Excavated ore must have an atlas sprite');
console.log('PASS approved ore atlas source identity, cropped mine states, mining gear, crate art, and live mining renderer');
