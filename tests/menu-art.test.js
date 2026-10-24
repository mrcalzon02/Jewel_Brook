/* Home screen art contract, independently checkable without a browser. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const manifest=require('../web/art/embryon/branding/menu-assets.json');
test('approved title and Kingdom background are actual, intact local WebP binaries',()=>{
 assert.equal(manifest.assets.length,2);
 for(const item of manifest.assets){
  const file=path.join(root,item.runtimePath);
  const b=fs.readFileSync(file);
  assert.equal(b.toString('ascii',0,4),'RIFF',file+' RIFF header');
  assert.equal(b.toString('ascii',8,12),'WEBP',file+' WebP type');
  assert.equal(b.length,item.runtimeBytes,'asset size');
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),item.runtimeSha256,file+' checksums');
  assert.equal(item.sourcePreservedOnDrive,true);
 }
});
test('home screen displays approved logo over approved Kingdom and keeps accessible controls',()=>{
 const js=fs.readFileSync(path.join(root,'web','game.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'web','style.css'),'utf8');
 assert.match(js,/class="home-title-art"/);
 assert.match(js,/alt="Rupee Rush — Heroes of Embryon"/);
 assert.match(js,/data-action|button\('play-next'/);
 assert.match(js,/button\('go-mine'/);
 assert.match(css,/embryon-kingdom\.webp/);
 assert.match(css,/\.home-kingdom/);
 assert.match(css,/@media\(max-width:620px\)/);
});
