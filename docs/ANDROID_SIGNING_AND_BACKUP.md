# Rupee Rush Android signing and encrypted backup

Rupee Rush must use the already-established Nut Buster publisher certificate, pinned in config/nutbuster-publisher.sha256. It must have a different Android package ID, saves, and release channel. Sharing a signer does NOT make the games share data. Do not generate a replacement key.

Canonical existing Nut Buster Windows signing files:
%USERPROFILE%\.local\share\nutbuster-signing\nutbuster-publisher.p12
%USERPROFILE%\.local\share\nutbuster-signing\store-password
Alias: nutbuster.

## Verify and provision Rupee Rush

Install JDK 17 or newer. In Windows PowerShell from the Rupee Rush checkout:

    .\scripts\provision-rupee-signing.ps1

This verifies the original signer without modifying anything. If restoring the SAME existing identity from safe files into an EMPTY canonical signing folder:

    .\scripts\provision-rupee-signing.ps1 -RestoreKeystorePath 'C:\private\nutbuster-publisher.p12' -RestorePasswordFile 'C:\private\store-password'

An existing key is never overwritten. For Rupee Rush's own GitHub Actions secret store, install GitHub CLI, authenticate with gh auth login, and run:

    .\scripts\provision-rupee-signing.ps1 -SetGitHubSecrets

Four PHONE_TEST_* secrets are sent over stdin to mrcalzon02/Rupee-rush only. No secrets are printed/committed. Names are read back, but GitHub does not disclose secret values. No workflow, APK or release is triggered.

## Encrypted backup of both original signing profiles

Created private Google Drive folder: https://drive.google.com/drive/folders/1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT

The two original publisher profiles are Nut Buster (also Rupee Rush) and ReverieVR. Back up both keystore and recovery password file for each. ReverieVR's original files are in REVERIEVR_CHECKOUT\.local\reverievr-signing\ (reverievr-phone-test.keystore, github-secrets.txt). The Linux keystore may be .jks.

Install age (https://github.com/FiloSottile/age) and rclone (https://rclone.org/drive/). Configure a Google Drive OAuth remote named gdrive with rclone config. Your local rclone is separate from ChatGPT's connected Drive account, so connect to the correct Google account. Run:

    .\scripts\backup-android-signing-to-drive.ps1 -ReverieRoot 'C:\path\to\ReverieVR'

Use -DriveRemote for another remote name, or -EncryptOnly to skip upload.

The script verifies both original signing sources, encrypts four recovery files individually with interactive age -p passphrases, and saves ONLY ciphertext/public notes under the Git-ignored .local/signing-backups directory. It uploads the ciphertext to a timestamped subfolder under the exact Drive folder ID and uses rclone check --one-way --checksum to confirm remote bytes. No raw keys or passwords are uploaded unencrypted.

IMPORTANT: Age will prompt for each encrypted file. Record EVERY strong decryption passphrase outside Google Drive and away from the computer, ideally in separate offline recovery storage. A backup without these passphrases is not recoverable. Keep an additional offline backup and privately test restoring before relying on Drive.

Recovery example, on a trusted computer in a safe path outside Git:

    age -d -o 'C:\private\nutbuster-publisher.p12' nutbuster-publisher.p12.age
    age -d -o 'C:\private\store-password' nutbuster-store-password.txt.age

Then run the verified restore command above. Never overwrite a working signing identity; never publish private keystores, secrets, or passwords to Git, issues, chat, or Drive as plaintext. Neither a GitHub secret name nor a checked-in script proves a signed APK. Rupee Rush currently lacks its Android build wrapper and release pipeline; those require separate implementation and device verification.
