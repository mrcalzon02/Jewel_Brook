# Jewelbrook original APK signing key — encrypted Google Drive backup

This operation is specific to Jewelbrook. It never creates or rotates a signing key and never modifies ReverieVR, Nut Buster, Google Play credentials, the Jewelbrook APK, or GitHub secrets.

Run once from the Jewelbrook checkout in GitKraken PowerShell:

    git pull --ff-only; if ($LASTEXITCODE -eq 0) { .\scripts\backup-rupeerush-signer-to-drive.ps1 }

Required source files already exist under `%LOCALAPPDATA%\Embryon\rupeerush-local-apk-v1`:
- `rupeerush-local-release.p12`
- `store-password.txt`

The script verifies the original keystore, alias and certificate fingerprint. If `age` or `rclone` is not installed, it asks permission to install the official `FiloSottile.age` and `Rclone.Rclone` Windows Package Manager packages. If rclone does not already have a Google Drive remote named `gdrive`, it launches `rclone config` to connect to the **same Google account** that owns the private backup folder.

It creates a temporary ZIP containing ONLY the two original signing recovery files, then encrypts it with `age -p` using one passphrase. **Write down that passphrase offline**; do not store it in Google Drive, GitHub, your source tree, or the plaintext recovery metadata. It decrypts the archive back into a temporary ZIP and checks both contained files' SHA-256 digests against the originals, deleting both temporary ZIPs afterwards.

Only the encrypted `.age` archive and public recovery metadata are uploaded into a unique subfolder of [Android Signing Backups - Encrypted](https://drive.google.com/drive/folders/1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT). The script then runs `rclone check --download --one-way` to read back and verify actual remote bytes. It will only print SUCCESS after verification. If a remote upload fails, the encrypted local copy remains in `%LOCALAPPDATA%\Embryon\rupeerush-local-apk-v1\encrypted-backups`.

To recover later on a trusted machine: download the encrypted archive, decrypt using `age -d -o rupeerush-signing-recovery.zip rupeerush-signing-recovery.zip.age`, extract the two original files and restore them into the Jewelbrook private signing folder. Verify the certificate SHA-256 from the recovery metadata. Do not generate a new key to replace a working publisher key.

Jewelbrook continues building Android APKs on GitHub; this script only provides disaster recovery for the signing identity.
