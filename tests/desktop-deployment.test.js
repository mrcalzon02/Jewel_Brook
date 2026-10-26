'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { resolveAsset } = require('../desktop/asset-routing');

const root = path.resolve(__dirname, '../web');
const config = require('../desktop/package.json');
assert.equal(config.main, 'main.js');
assert.equal(config.build.extraResources[0].from, '../web');
assert.equal(config.build.extraResources[0].to, 'game');
assert.ok(config.scripts['dist:win'].includes('nsis'));
assert.ok(config.scripts['dist:win'].includes('portable'));
assert.ok(config.scripts['dist:linux'].includes('AppImage'));
assert.ok(config.scripts['dist:linux'].includes('tar.gz'));

for (const name of ['index.html', 'game.js', 'mining.js', 'update.js', 'style.css']) {
  assert.ok(fs.statSync(path.join(root, name)).isFile(), 'Missing bundled game resource: ' + name);
  assert.equal(resolveAsset(root, 'rupeerush://game/' + name), path.join(root, name));
}
assert.equal(resolveAsset(root, 'rupeerush://game/'), path.join(root, 'index.html'));
assert.equal(resolveAsset(root, 'https://example.org/index.html'), null);
assert.equal(resolveAsset(root, 'rupeerush://other/index.html'), null);
assert.equal(resolveAsset(root, 'rupeerush://game/%5c..%5cprivate'), null);
assert.equal(resolveAsset(root, 'rupeerush://game/%00foo'), null);
const main = fs.readFileSync(path.join(__dirname, '../desktop/main.js'), 'utf8');
assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /webRequest\.onBeforeRequest/);
assert.match(main, /process\.resourcesPath/);
console.log('Desktop deployment: shared assets, secure origin, offline runtime and Windows/Linux packaging contracts passed.');
