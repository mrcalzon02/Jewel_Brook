# Jewel Brook — approved splash art (staged)

**Public title:** Jewel Brook: Heroes of Embryon. **Source:** the user-approved final composite image, not a regenerated Daysha, and no unapproved dog.

The production crops were extracted losslessly by region but WebP-encoded at quality 94. The original sheet and eight crops are available in the approved transfer archive, which has been uploaded to the existing project art-source Google Drive folder. The binary files are **not yet committed to GitHub**; the manifest deliberately lists the source-transfer state as `pending-verified-import`.

To finish transfer: place the exact archived ZIP on the same machine as a current checkout of `main`; execute `python scripts/import-jewelbrook-splash-art.py <archive>`; then Git-add only the eight vetted `.webp` files here and commit/push, read back the GitHub blob hashes, and run the existing Android and Windows/Linux functional release checks. Use an appropriately rebased/port-specific change on `google-play` without discarding its Google integration. No cosmetic CI tests.

Until the binaries are verified in the repository, do **not** switch active home title or loading UI to missing image paths. The active wordmark remains the safe fallback.

| Asset | Role |
| --- | --- |
| title-portrait.webp | Portrait title screen |
| loading-wide.webp | Clean panoramic loading illustration (no progress bar) |
| banner-wide.webp | Primary promotional banner |
| banner-medium.webp | Landscape advertisement |
| banner-horizontal.webp | Smaller horizontal advertisement |
| poster-vertical.webp | Tall promo |
| promo-daysha-square.webp | Daysha portrait promo crop |
| promo-kingdom-square.webp | Environment promo crop |

Preserve the original art, approved currencies, package ID, save namespace, original updater URLs, and release tags.
