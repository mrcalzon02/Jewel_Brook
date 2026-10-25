# Frozen Glow 2 — offline music source

Original source: **Frozen Glow 2.mp3** from the Rupee Rush Google Drive folder.
Source size: **5,060,262 bytes**; audio duration: approximately **240.024 seconds**.
Source SHA-256: `a4235a9b0797c96fca9ad6d9e870983657bece455f35dfa75f406b8688679fc5`.

The source file is stored byte-for-byte as the thirteen numbered `.bin` segments in this directory. The connector cannot upload the 5 MB MP3 as one Git blob, so this delivery uses split binary files rather than a broken Git LFS pointer or an online dependency. `web/embryon-music.js` reassembles these segments in order into an `audio/mpeg` Blob; there is no transcoding. The player loops it, stops when hidden, and has an independent persisted music toggle.

When building Android, include **every** segment in the APK assets. The audio system must remain offline.
Run `node tests/embryon-music.test.js` to verify the assembled byte count, SHA-256, local playback, persistence, and visibility behavior.
