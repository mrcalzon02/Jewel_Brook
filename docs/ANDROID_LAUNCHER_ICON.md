# Jewel Brook — approved Android launcher icon

The signed Android application uses the **Daysha portrait in the gold ornamental frame** from the project's user-approved splash-art montage, not the obsolete purple/green vector gem.

**Approved image source:** `source/approved-composite.png` inside `jewel_brook_approved_splash_pack.zip` (the image whose bottom row explicitly says `APP ICON` beneath Daysha). The exact icon tile was cropped at (591, 777) through (752, 938), then downsampled for a compact Android launcher resource; no generative artwork was substituted.

**Installed Android resource:** `android/app/src/main/res/drawable-nodpi/ic_jewel_brook.webp` (96×96 RGB WebP). The manifest points both icon and roundIcon here.

**Signing and update identity:** Jewel Brook's independent package is `io.github.mrcalzon02.jewelbrook`; retain, the permanent keystore, the `rupeerush-local-apk-v1` alias, and the internal `rupeerush.save.v1` key. Existing Rupee Rush data does not automatically migrate. The public download filename is `Jewel-Brook-Heroes-of-Embryon-Android.apk`. Do not remap currency gems, reuse the original vector icon, or insert an unapproved icon selection.

A higher-resolution original square source, if subsequently supplied separately, can replace this derived icon with identical artwork while retaining all Android identities and build contracts. Do not regenerate the portrait.
