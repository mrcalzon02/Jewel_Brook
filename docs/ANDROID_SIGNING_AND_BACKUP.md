# Archived: legacy APK publisher signing

**This document is retired for the NEW Google Play signing era.** Use [NEW Google Play upload-key generation](GOOGLE_PLAY_NEW_KEYS.md) instead.

The former single-command signing launcher has intentionally been repointed to generate **three new, independent Play upload keys**. It no longer performs legacy signing recovery.

The old signing material is not required to generate the new Play upload keys. Preserve legacy keys only for archival and installed-version compatibility; the new Play releases use distinct signing identities.

For historical context, the previous runbook is preserved in [Legacy Android Signing Archive](LEGACY_ANDROID_SIGNING_ARCHIVE.md). Do not use its old provisioning commands to create Play builds.
