'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const x=read('scripts/generate-new-play-upload-keys.ps1'),s=read('scripts/setup-android-signing.ps1');
for(const [id,alias,repo] of [
 ['reverievr','reverievr-play-upload-v1','mrcalzon02/ReverieVR'],
 ['nutbuster','nutbuster-play-upload-v1','mrcalzon02/NUTBUSTER-R'],
 ['rupeerush','rupeerush-play-upload-v1','mrcalzon02/Rupee-rush']
]){ assert.ok(x.includes("Id='"+id+"'"));assert.ok(x.includes("Alias='"+alias+"'"));assert.ok(x.includes("Repo='"+repo+"'")); }
assert.match(x,/-genkeypair -keystore/);
assert.match(x,/-keysize 4096/);
assert.match(x,/Incomplete existing Play identity/);
assert.match(x,/EMBRYON_PLAY_KEYPASS/);
assert.match(x,/& \$age -p -o \$archive/);
assert.match(x,/--one-way --checksum/);
assert.match(x,/PLAY_UPLOAD_KEYSTORE_BASE64/);
assert.match(x,/\$clashing.Count -gt 0/);
assert.doesNotMatch(x,/PHONE_TEST_KEYSTORE_BASE64|nutbuster-publisher\.p12|reverievr-phone-test\.keystore/);
assert.match(s,/generate-new-play-upload-keys\.ps1/);
assert.doesNotMatch(s,/provision-rupee-signing\.ps1|backup-android-signing-to-drive\.ps1/);

assert.match(s, /winget\.Source install --id FiloSottile\.age --exact --source winget/);
assert.match(s, /function Find-Age/);
assert.match(s, /FiloSottile\.age_\*/);
assert.match(s, /Encryption prerequisite verified/);
assert.ok(s.indexOf('Encryption prerequisite verified') < s.indexOf('& $generator -SkipDrive'));
assert.match(x, /if \(\$Name -eq 'age'\)/);
assert.match(x, /FiloSottile\.age_\*/);
assert.match(x, /No unprotected keys generated/);
console.log('New Google Play upload-key generation source contracts passed.');
