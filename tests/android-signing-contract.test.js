'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const fingerprint = 'cdde49a6d72b49e50d1cf3454ebb0a1e63444640719e4afa40c6c74bd5c8b0b9';
assert.equal(read('config/nutbuster-publisher.sha256').trim(), fingerprint);
const signer = read('scripts/provision-rupee-signing.ps1');
const backup = read('scripts/backup-android-signing-to-drive.ps1');
const launcher = read('scripts/setup-android-signing.ps1');
assert.match(signer, /Assert-OriginalSigner/);
assert.match(signer, /Refusing to overwrite/i);
assert.match(signer, /PHONE_TEST_KEYSTORE_BASE64/);
assert.match(signer, /AllowExistingSecrets/);
assert.equal((signer.match(/function Set-Secret\(/g) || []).length, 1, 'duplicate signing writer');
assert.equal((signer.match(/if \(\$SetGitHubSecrets\) \{/g) || []).length, 1, 'duplicate signing block');
assert.match(signer, /\$clashing.Count -gt 0 -and -not \$AllowExistingSecrets/);
assert.doesNotMatch(signer, /-genkeypair|New-SelfSignedCertificate/);
for (const filename of [
  'nutbuster-publisher.p12.age',
  'nutbuster-store-password.txt.age',
  'reverievr-phone-test.keystore.age',
  'reverievr-github-secrets.txt.age'
]) assert.ok(backup.includes(filename), 'missing backup artifact ' + filename);
assert.match(backup, /age -p -o/);
assert.match(backup, /rclone check/);
assert.match(backup, /--one-way --checksum/);
assert.match(read('.gitignore'), /^\.local\/$/m);
// The old provision/backup files remain historical; the DEFAULT one-line entry point is NEW Play generation.
assert.match(launcher, /generate-new-play-upload-keys\.ps1/);
assert.doesNotMatch(launcher, /provision-rupee-signing\.ps1|backup-android-signing-to-drive\.ps1/);
console.log('Legacy signing material is archived and default launcher routes to new Play key generation.');
