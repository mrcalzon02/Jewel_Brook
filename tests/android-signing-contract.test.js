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
assert.match(launcher, /Android Studio\/jbr\/bin\/keytool\.exe/);
for (const id of ['Microsoft.OpenJDK.17', 'GitHub.cli', 'FiloSottile.age', 'Rclone.Rclone']) {
  assert.ok(launcher.includes(id), 'unrecognized WinGet dependency ' + id);
}
assert.match(launcher, /Read-Host 'Install these missing tools/);
assert.match(launcher, /rclone config/);
assert.match(launcher, /gh auth login/);
assert.match(launcher, /-SetGitHubSecrets/);
assert.match(launcher, /\[1\/3\]/);
assert.match(launcher, /& \$backup -ReverieRoot/);
assert.ok(launcher.indexOf('& $backup -ReverieRoot') < launcher.indexOf('& $provision -SetGitHubSecrets'));
assert.doesNotMatch(launcher, /-genkeypair|New-SelfSignedCertificate|git reset|git push/);
console.log('Source-only Android signing and dependency-bootstrap contracts passed.');
