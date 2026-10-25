'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web');
const Yard=require('../web/town-yards.js');
const Generator=require('../scripts/generate-town-yards.js');
const manifest=require('../web/art/embryon/town/yards/manifest.json');
test('four unique transparent yard modules are complete, isolated, original and reproducible',()=>{
 assert.equal(manifest.assets.length,4);
 assert.match(manifest.status,/pending_final_painted_scene_masters/);
 const paths=new Set(),source=new Set();
 for(let n=1;n<=4;n++){
  const pic=Yard.yard((n-1)*10+1);
  const text=fs.readFileSync(path.join(root,pic.path),'utf8');
  assert.match(text,/viewBox="0 0 512 512"/);
  assert.match(text,/aria-label="Embryon yard scenery stage /);
  assert.doesNotMatch(text,/<rect\b|<image\b|\shref=|\ssrc=/i,'no flat backdrop or externally loaded art');
  assert.equal(text,Generator.drawYard(n),'yard module '+n);
  assert.ok(!/garden-plot|crop-bed|plot-hitbox|house_lv_/.test(text),'landscape must not bake in functional plot beds or houses');
  paths.add(pic.path);source.add(text);
 }
 assert.equal(paths.size,4);assert.equal(source.size,4);
});
test('landscape bands follow independent house level without changing campaign progress',()=>{
 const s={unlocked:900,town:{houseLevel:1}};
 assert.equal(Yard.fromSave(s).band,1);
 for(const [level,band] of [[1,1],[10,1],[11,2],[20,2],[21,3],[30,3],[31,4],[40,4]])
  assert.equal(Yard.yard(level).band,band);
 s.town.houseLevel=35;s.unlocked=1;assert.equal(Yard.fromSave(s).band,4);
 assert.equal(Yard.yard(41).level,40);
 assert.equal(Yard.fromSave({}).band,1);
});
test('house remains foreground and yard background cannot capture tap targets',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(root,'game.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
 assert.ok(html.indexOf('src="town-yards.js"')<html.indexOf('src="game.js"'));
 assert.match(ui,/TownYards\.yard\(t\.houseLevel\)/);
 assert.match(ui,/class="town-yard-layer"/);
 assert.match(ui,/class="town-house-illustration"/);
 assert.match(css,/\.town-yard-layer\{[^}]*z-index:0[^}]*pointer-events:none/);
 assert.match(css,/\.town-house-illustration\{[^}]*z-index:1/);
 assert.match(ui,/Array\.from\(\{length:8\}/,'eight plot interactions remain separate');
});
