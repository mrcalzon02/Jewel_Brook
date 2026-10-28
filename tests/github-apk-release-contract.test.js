'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ci=read('.github/workflows/rupee-rush-android.yml');
const script=read('scripts/provision-github-apk-signing.ps1');
const legacy=read('scripts/provision-rupee-signing.ps1');
const play=read('scripts/generate-new-play-upload-keys.ps1');
// Release/signing tooling must not address the renamed repository's old path.
for (const [name, source] of [['provision',script],['legacy signer',legacy],['Play signer',play]]) {
 assert.match(source,/mrcalzon02\/Jewel_Brook/,'Missing active Jewel Brook repo in '+name);
 assert.doesNotMatch(source,/mrcalzon02\/Rupee-rush/,'Obsolete GitHub repo target in '+name);
}

for(const marker of ['push:', 'workflow_dispatch:', ':app:assembleDebug', ':app:assembleRelease',
 'gh release create', 'RupeeRush-Android.apk', 'apksigner', 'aapt',
 'assets/game.js', 'RUPEE_APK_CERT_SHA256', 'rupeerush-local-apk-v1']) {
 assert.ok(ci.includes(marker), 'Missing cloud APK component '+marker);
}
assert.match(ci,/if: steps\.signer\.outputs\.ready == 'true'/);
assert.match(ci,/500000000 \+ GITHUB_RUN_NUMBER \* 100 \+ GITHUB_RUN_ATTEMPT/);
assert.match(ci,/README-DEBUG-UNSTABLE/);
for(const k of ['RUPEE_APK_KEYSTORE_BASE64','RUPEE_APK_STORE_PASSWORD',
 'RUPEE_APK_KEY_ALIAS','RUPEE_APK_KEY_PASSWORD','RUPEE_APK_CERT_SHA256']) {
 assert.ok(script.includes("Set-Secret '"+k+"'"), 'Missing GitHub provisioner secret '+k);
}
assert.match(script,/RUNNING GITHUB BUILD/);
assert.match(script,/rupeerush-local-release\.p12/);
assert.match(script,/Existing or partial GitHub signing secrets detected/);
assert.doesNotMatch(script,/sdkmanager|assembleRelease|gradle -p|PHONE_TEST_KEYSTORE|PLAY_UPLOAD_KEYSTORE/);
console.log('GitHub APK, permanent signer and update verification contract passed.');
