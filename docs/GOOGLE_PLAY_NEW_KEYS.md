# 2026 Google Play publishing: NEW signing generation

This supersedes the legacy publisher-key recovery workflow. The familiar one-command Rupee Rush script now generates three **new and separate** Google Play upload keys; no previous private signing keys are needed or reused.

From the Rupee Rush checkout in Windows GitKraken PowerShell:

```powershell
git pull --ff-only; if ($LASTEXITCODE -eq 0) { .\scripts\setup-android-signing.ps1 }
```

The generator creates three RSA-4096 PKCS12 upload keys on the owner's PC in:

`%LOCALAPPDATA%\Embryon\play-upload-v1\keys\reverievr`
`%LOCALAPPDATA%\Embryon\play-upload-v1\keys\nutbuster`
`%LOCALAPPDATA%\Embryon\play-upload-v1\keys\rupeerush`

Each directory includes upload.p12 (private), upload-password.txt (private), upload-certificate.pem (public), and upload-public.json (public metadata). Access to the parent signing directory is restricted to the local user and SYSTEM. The generator needs JDK keytool and age installed, and auto-detects standard Windows Java paths; it refuses to overwrite an interrupted or existing generation.

An encrypted recovery archive is created in:
`%LOCALAPPDATA%\Embryon\play-upload-v1\recovery\embryon-play-upload-v1.zip.age`
An age recovery password must be saved **offline**. A temporary plaintext ZIP is removed after encryption. The encrypted archive and checksum receipt are uploaded and read-back verified in the existing private Google Drive folder if the `gdrive` rclone remote is configured. If not, the script clearly reports remote backup pending.

If GitHub CLI is authenticated, the newly generated signing materials are stored in the distinct new `PLAY_UPLOAD_*` secret names of the three repositories. The old `PHONE_TEST_*` channels are not considered production signers; the generator does not reuse or overwrite their secrets. Existing new-era `PLAY_UPLOAD_*` secrets are not overwritten without separate verification.

## Google Play application identities

| Game | Package ID | New Play upload alias |
|---|---|---|
| ReverieVR | io.github.mrcalzon02.reverievr | reverievr-play-upload-v1 |
| Nut Buster | io.github.mrcalzon02.nutbuster | nutbuster-play-upload-v1 |
| Rupee Rush | io.github.mrcalzon02.rupeerush | rupeerush-play-upload-v1 |

Rupee Rush package ID is reserved pending its own Android wrapper. ReverieVR and Nut Buster have separate Gradle `play` build variants for the new upload key; those variants use `playUploadKeystorePath`, `playUploadStorePassword`, `playUploadKeyAlias` and `playUploadKeyPassword` Gradle project properties, accepting corresponding `ORG_GRADLE_PROJECT_...` environment variables. No Play bundle should be published until the Gradle build, signing fingerprint and on-device behavior are verified.

Google Play App Signing is mandatory for newly published apps and uses a **device signing key managed by Google** separate from the locally generated upload key. The user must enroll each app in Play Console and select Google-managed signing. Changing an upload key alone does not invalidate old installations or prevent save transfers. APKs signed with a different device certificate and the same package ID cannot update one another in place; deliberate application-ID and save migration choices must be made separately. Cross-app `signature` permissions, including ReverieVR companions, require their actual *Play app-signing certificates* to match, not merely upload certificates.

Official resources:
- https://support.google.com/googleplay/android-developer/answer/9842756
- https://developer.android.com/studio/publish/app-signing

No change to the user's Play Console has been executed; no private keys are committed to GitHub.
