'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('web/index.html'),game=read('web/game.js'),css=read('web/style.css');
const home=game.slice(game.indexOf('function home(){'),game.indexOf('function manor(){'));
const cssWithoutComments=css.replace(/\/\*[\s\S]*?\*\//g,'');
let braces=0;
for(const char of cssWithoutComments){if(char==='{')braces++;else if(char==='}'){braces--;assert.ok(braces>=0,'CSS has an extra closing brace');}}
assert.equal(braces,0,'Unclosed CSS rule causes mobile layout rules to be ignored');
assert.match(html, /id="jewelbrook-loading-splash" role="status"/);
assert.match(html, /class="splash-picture"/);
assert.match(html, /title-portrait\.webp/);
assert.match(game, /splashReadyAt=Date\.now\(\)\+900/);
assert.match(game, /window\.addEventListener\?\.\('load',finishStartupSplash/);
assert.ok(home.indexOf('home-intro')<home.indexOf('home-menu-grid'),'Title must precede main menu');
assert.ok(home.indexOf('home-menu-grid')<home.indexOf('townAvatarPanel()'),'The tall Daysha art must not obstruct initial menu');
for(const action of ['play-next','go-campaign','go-mine','go-farm','go-manor','go-shop','go-chronicle','go-guide','go-rewards']){
 assert.ok(home.includes("button('"+action+"'"),'Missing mobile menu action '+action);
}
assert.match(game, /if\(a==='go-shop'\)\{nav\('shop'\)/);
assert.match(game, /if\(a==='go-rewards'\)\{nav\('rewards'\)/);
assert.match(css, /\.bottom\{grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
assert.match(css, /\.home-vista\{[^}]*height:clamp/);
assert.match(css, /#app:not\(\.playing\) \.top-money\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
for(const asset of ['title-portrait.webp','loading-wide.webp','banner-wide.webp','../../locations/embryon-kingdom.webp'].slice(0,3)){
 assert.ok(fs.existsSync(path.join(__dirname,'../web/art/embryon/branding/jewelbrook',asset)),'Missing approved art '+asset);
}
assert.ok(fs.existsSync(path.join(__dirname,'../web/art/embryon/locations/embryon-kingdom.webp')));
console.log('Android/Fire portrait startup: finite splash, compact hero, functional menu actions, 3 currency cells and 7 navigation items.');
