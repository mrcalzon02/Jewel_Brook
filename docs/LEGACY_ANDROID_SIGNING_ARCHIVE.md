> **Historical recovery archive only.** The active repository is `mrcalzon02/Jewel_Brook`; use `docs/GITHUB_ANDROID_RELEASES.md` and `scripts/provision-github-apk-signing.ps1` for current releases. Do not run the legacy signer workflow for new APKs.

# Jewelbrook Android signing and encrypted backup

Jewelbrook must use the already-established Nut Buster publisher certificate, pinned in config/nutbuster-publisher.sha256. It must have a different Android package ID, saves, and release channel. Sharing a signer does NOT make the games share data. Do not generate a replacement key.

Canonical existing Nut Buster Windows signing files:
%USERPROFILE%\.local\share\nutbuster-signing\nutbuster-publisher.p12
%USERPROFILE%\.local\share\nutbuster-signing\store-password
Alias: nutbuster.


## Single-command Windows workflow (recommended)

In GitKraken's embedded PowerShell, from a historical Rupee Rush checkout, paste this one line:

    git pull --ff-only; if ($LASTEXITCODE -eq 0) { .\scripts\setup-android-signing.ps1 }

The fast-forward-only pull never discards local changes. The launcher defaults to C:\GITS\ReverieVR as the sibling checkout (or REVERIEVR_ROOT); use -ReverieRoot if the checkout is elsewhere. It verifies the existing Nut Buster key, encrypts the recoverable publisher identities (both when ReverieVR originals are available, otherwise Nut Buster only with a PARTIAL warning), uploads ciphertext using your authenticated rclone Google Drive remote, checks the uploaded ciphertext, then provisions the exact Nut Buster key into Jewelbrook's GitHub secret store. It stops on missing dependencies or keys. It does not generate a new signing key, create an APK, or install anything.

This is **one command to initiate**, not unattended execution: the script discovers installed tools, offers WinGet installation of missing tools after consent, then ensures GitHub CLI/gh authentication and a configured Google Drive rclone remote. The backup prompts for two encryption passphrases when only Nut Buster is available, or four when both signing profiles exist. Save these separately, offline, and verify a private restore. If some Jewelbrook signing secrets already exist, the launcher safely refuses to overwrite them; investigate identity before any explicit override.


### Missing local prerequisites

The one-command launcher now first checks the existing PATH and common Java locations (including Android Studio's bundled jbr\bin\keytool.exe and installed JDKs). It will not install a second JDK when a working keytool already exists at a recognized location. If a tool truly is missing, it displays the exact official WinGet IDs and **asks permission before installation**: Microsoft.OpenJDK.17, GitHub.cli, FiloSottile.age and Rclone.Rclone. Installations may require Windows elevation and a terminal restart before commands become available. Re-run the exact same one-line GitKraken command after reopening the terminal, without generating any new signing key.

If GitHub CLI is not authenticated, the launcher starts its interactive login. If the Google Drive rclone remote named gdrive is missing, it offers to open interactive rclone config; connect the same private Google account and name the remote exactly gdrive. Installing the tools is not equivalent to authenticating them. The backup prompts for encryption passphrases that must be stored OFFLINE. If existing Jewelbrook signing secrets are detected, the launcher deliberately refuses to overwrite them unless the prior publisher identity was independently checked and -AllowExistingSecrets explicitly supplied.


### ReverieVR key is absent from its checkout

The ReverieVR Windows provisioner normally kept .local/reverievr-signing/github-secrets.txt beside its private keystore. This folder is gitignored and cannot be restored with git pull. GitHub Actions secrets are write-only and cannot be retrieved via the GitHub API. Absence at C:\GITS\ReverieVR is **not proof the signer is lost**; it may exist on another computer or trusted backup.

The single-command launcher now **does not require the unrelated ReverieVR file** to provision Jewelbrook. If both original ReverieVR files are present in the specified checkout it verifies and backs them up alongside Nut Buster. Otherwise it encrypts and uploads **only the verified Nut Buster/Jewelbrook key**, and clearly marks the outcome PARTIAL, with ReverieVR NOT BACKED UP. It never guesses, generates, replaces, or silently marks a missing key as recovered. Restore the original ReverieVR key/password privately from the original machine or offline backup and rerun the same command to include it. A remote GitHub secret *name* is not a recoverable private signing key.

## Verify and provision Jewelbrook

Install JDK 17 or newer. In Windows PowerShell from the Jewelbrook checkout:

    .\scripts\provision-rupee-signing.ps1

This verifies the original signer without modifying anything. If restoring the SAME existing identity from safe files into an EMPTY canonical signing folder:

    .\scripts\provision-rupee-signing.ps1 -RestoreKeystorePath 'C:\private\nutbuster-publisher.p12' -RestorePasswordFile 'C:\private\store-password'

An existing key is never overwritten. For Jewelbrook's own GitHub Actions secret store, install GitHub CLI, authenticate with gh auth login, and run:

    .\scripts\provision-rupee-signing.ps1 -SetGitHubSecrets

If any of the four signing secrets already exist, the script refuses to overwrite them. After verifying that Jewelbrook has not published a different signing identity, explicitly opt into re-provisioning with -SetGitHubSecrets -AllowExistingSecrets. Four PHONE_TEST_* secrets are sent over stdin to the historical repository address (now `mrcalzon02/Jewel_Brook`) only. No secrets are printed/committed. Names are read back, but GitHub does not disclose secret values. No workflow, APK or release is triggered.

## Encrypted backup of both original signing profiles

Created private Google Drive folder: https://drive.google.com/drive/folders/1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT

The two original publisher profiles are Nut Buster (also Jewelbrook) and ReverieVR. Back up both keystore and recovery password file for each. ReverieVR's original files are in REVERIEVR_CHECKOUT\.local\reverievr-signing\ (reverievr-phone-test.keystore, github-secrets.txt). The Linux keystore may be .jks.

Install age (https://github.com/FiloSottile/age) and rclone (https://rclone.org/drive/). Configure a Google Drive OAuth remote named gdrive with rclone config. Your local rclone is separate from ChatGPT's connected Drive account, so connect to the correct Google account. Run:

    .\scripts\backup-android-signing-to-drive.ps1 -ReverieRoot 'C:\path\to\ReverieVR'

Use -DriveRemote for another remote name, or -EncryptOnly to skip upload.

The script verifies both original signing sources, encrypts four recovery files individually with interactive age -p passphrases, and saves ONLY ciphertext/public notes under the Git-ignored .local/signing-backups directory. It uploads the ciphertext to a timestamped subfolder under the exact Drive folder ID and uses rclone check --one-way --checksum to confirm remote bytes. No raw keys or passwords are uploaded unencrypted.

IMPORTANT: Age will prompt for each encrypted file. Record EVERY strong decryption passphrase outside Google Drive and away from the computer, ideally in separate offline recovery storage. A backup without these passphrases is not recoverable. Keep an additional offline backup and privately test restoring before relying on Drive.

Recovery example, on a trusted computer in a safe path outside Git:

    age -d -o 'C:\private\nutbuster-publisher.p12' nutbuster-publisher.p12.age
    age -d -o 'C:\private\store-password' nutbuster-store-password.txt.age

Then run the verified restore command above. Never overwrite a working signing identity; never publish private keystores, secrets, or passwords to Git, issues, chat, or Drive as plaintext. Neither a GitHub secret name nor a checked-in script proves a signed APK. Jewelbrook currently lacks its Android build wrapper and release pipeline; those require separate implementation and device verification.
