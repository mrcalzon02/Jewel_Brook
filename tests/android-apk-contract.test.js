'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

const html=read('web/index.html');
assert.match(html,/<main id="screen"/);
for(const m of html.matchAll(/<script\s+src="([^"]+)"/g)){
  assert.ok(exists('web/'+m[1]),'Missing APK-packaged script '+m[1]);
}
for(const m of html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)){
  assert.ok(exists('web/'+m[1]),'Missing APK-packaged stylesheet '+m[1]);
}
for(const p of ['web/game.js','web/mining.js','web/engine.js',
 'web/update.js','web/economy.js']) {
  assert.ok(exists(p),'Missing game asset '+p);
}

const gradle=read('android/app/build.gradle');
const settings=read('android/settings.gradle');
const rootGradle=read('android/build.gradle');
const manifest=read('android/app/src/main/AndroidManifest.xml');
const java=read('android/app/src/main/java/io/github/mrcalzon02/rupeerush/MainActivity.java');
const script=read('scripts/build-android-apk.ps1');
const docs=read('docs/ANDROID_APK.md');
const ignore=read('.gitignore');

assert.match(settings,/include ':app'/);
assert.match(rootGradle,/com\.android\.application/);
assert.match(gradle,/applicationId 'io\.github\.mrcalzon02\.jewelbrook'/);
assert.doesNotMatch(gradle,/applicationId 'io\.github\.mrcalzon02\.rupeerush'/,'New app must not replace old installed package');
assert.match(gradle,/namespace 'io\.github\.mrcalzon02\.rupeerush'/,'Internal Java namespace stays stable');
assert.match(gradle,/assets\.srcDirs = \[rootProject\.file\('\.\.\/web'\)\]/);
assert.match(gradle,/rupeerush-local-apk-v1/);
assert.match(gradle,/requirePermanentLocalSigner/);
assert.match(gradle,/if \(task\.name == 'assembleRelease'/);
assert.match(gradle,/signingConfig signingConfigs\.rupeeLocal/);
assert.doesNotMatch(gradle,/nutbuster-publisher|reverievr-phone-test|PLAY_UPLOAD/);
assert.match(manifest,/android:allowBackup="false"/);
assert.match(manifest,/android:exported="true"/);
assert.match(manifest,/<uses-permission[^>]+android\.permission\.INTERNET/);
assert.match(manifest,/android\.permission\.REQUEST_INSTALL_PACKAGES/);
assert.match(manifest,/androidx\.core\.content\.FileProvider/);
assert.match(java,/WebViewAssetLoader\.AssetsPathHandler/);
assert.match(java,/https:\/\/appassets\.androidplatform\.net/);
assert.match(java,/\/assets\/index\.html/);
assert.match(java,/setDomStorageEnabled\(true\)/);
assert.match(java,/setJavaScriptEnabled\(true\)/);
assert.match(java,/setBlockNetworkLoads\(true\)/);
assert.match(java,/setAllowFileAccess\(false\)/);
assert.match(java,/shouldInterceptRequest\(/);
assert.match(java,/data-nav/);
assert.match(java,/new RupeeUpdateService/);
assert.match(java,/RUPEE_UPDATE_BRIDGE/);
assert.match(script,/-genkeypair/);
assert.match(script,/REUSING permanent Jewelbrook APK key/);
assert.match(script,/INCOMPLETE existing key\/password pair/);
assert.match(script,/ORG_GRADLE_PROJECT_/);assert.match(script,/rupeeStorePassword=\$secret/);
assert.match(script,/last-successful-version\.txt/);
assert.match(script,/\(\$last\+1\)/);
assert.match(script,/:app:assembleRelease/);
assert.match(script,/apksigner\.bat/);
assert.match(script,/Signer #1 certificate SHA-256 digest/);
assert.match(script,/versionCode/);
assert.match(script,/assets\/game\.js/);
assert.match(script,/adb install -r/);
assert.doesNotMatch(script,/gh workflow run|PHONE_TEST_KEYSTORE|PLAY_UPLOAD_KEYSTORE/);
assert.match(ignore,/release\//);
assert.match(docs,/Jewel-Brook-Heroes-of-Embryon-Android\.apk/);
console.log('Jewelbrook Android app, bundled assets, local signing and update contract checks passed.');
