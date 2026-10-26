'use strict';
// Build-only functional reference vectors from the authoritative Android mining
// engine. This JS runs in CI only; NO JavaScript engine ships with desktop builds.
const fs = require('node:fs');
global.RupeeMiningGear = require('../../web/mining-gear.js');
const Mining = require('../../web/mining.js');
const output = process.argv[2];
if (!output) throw Error('Supply fixture output path');
let lines = [];
for (const seed of [4099, 7919, 0xdeadbeef, 113, 123456]) {
  for (let tier = 0; tier < Mining.MAP.length; tier++) {
    const size = Mining.MAP[tier].size;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = Mining.tile(seed, x, y, tier);
      const index = { barren:0, ordinary:1, rich:2, crystal:3 }[t.kind];
      if (index === undefined) throw Error('Unexpected kind '+t.kind);
      lines.push([seed>>>0, tier, x, y, index, t.hardness, t.ore].join(' '));
    }
  }
}
fs.writeFileSync(output, lines.join('\n')+'\n');
console.log('Generated '+lines.length+' functional mining parity vectors from web/mining.js');
