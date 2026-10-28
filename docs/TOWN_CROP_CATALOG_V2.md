# Jewelbrook: forty-eight playable crop varieties (developer catalog)

This release implements 48 growable, purchasable, harvestable, sellable crops across eight families and forty home levels. This is a game economy catalog, not just a list of art concepts. Each crop has its own ID, unlock tier, seed price, growth duration, harvest yield and unit sale price. Fertilizer and mining gloves modify all species through the existing farming transactions.

No released farm save data exists. Existing Day One starter crop IDs carrot/wheat/berry and six real kitchen recipes are retained to keep their tested game features functional, not for migration requirements.

|House|Variety|Family|Seed cost|Grow (min)|Yield|Sale/unit|
|---:|---|---|---:|---:|---:|---:|
|1|Hawseed Carrot|roots|12|5|2|12|
|1|Ruby Radish|roots|10|3|2|9|
|1|Moonleaf Lettuce|greens|15|6|3|10|
|1|Sweetpod Peas|greens|16|7|3|10|
|1|Frostmint|herbs|18|8|3|12|
|2|Copper Potato|roots|20|10|4|9|
|2|Amber Onion|roots|22|11|3|12|
|3|Nightshade Spinach|greens|22|10|4|10|
|3|Crimson Beet|roots|24|13|3|14|
|4|Sunwheat|grains|25|12|3|12|
|5|Sunblush Strawberry|fruits|28|15|3|16|
|6|Blazevine Tomato|fruits|32|18|4|14|
|7|Pearl Cabbage|greens|34|20|3|17|
|8|Bluebell Berry|fruits|40|30|3|18|
|9|Goldrunner Beans|greens|42|25|4|15|
|10|Silver Garlic|roots|44|29|3|21|
|11|Golden Corn|grains|47|35|4|17|
|12|Firecrest Pepper|fruits|50|38|3|23|
|13|Evergreen Broccoli|greens|55|40|3|24|
|14|Dewdrop Cucumber|fruits|58|45|4|22|
|15|Cloudbloom Cauliflower|greens|62|50|3|30|
|16|Ironleaf Kale|greens|65|55|4|25|
|17|Velvet Raspberry|fruits|70|60|3|33|
|18|Sungold Sunflower|flowers|75|70|3|36|
|19|Duskstripe Zucchini|fruits|78|75|4|29|
|20|Violet Eggplant|fruits|85|85|3|42|
|21|Harvest Pumpkin|fruits|95|95|2|65|
|22|Highland Barley|grains|94|100|4|36|
|23|Moonwater Rice|grains|98|110|5|34|
|24|Cloud Cotton|exotics|110|120|4|43|
|25|Crystal Sugarcane|grains|115|135|4|45|
|26|Emberleaf Herbs|herbs|120|140|5|42|
|27|Royal Lavender|herbs|130|150|4|55|
|28|Mistvale Tea|herbs|140|160|5|50|
|29|Sunburst Daisy|flowers|145|180|4|62|
|30|Silverglow Tulip|flowers|160|200|4|67|
|31|Moonshadow Rose|flowers|170|220|4|72|
|32|Nightfall Coffee|exotics|180|240|4|78|
|33|Arcane Orchid|flowers|200|265|3|110|
|34|Starlight Grapes|fruits|215|280|4|90|
|35|Crystal Melon|fruits|235|300|3|125|
|36|Royal Watermelon|fruits|250|330|3|137|
|37|Gilded Apple|orchard|280|360|3|156|
|37|Moonstone Pear|orchard|290|390|3|160|
|38|Blushfire Peach|orchard|320|420|3|184|
|38|Sunspire Pineapple|exotics|335|450|3|193|
|39|Dragonheart Fruit|exotics|370|490|3|217|
|40|Astral Starfruit|exotics|425|540|3|250|

## Artwork
Existing independent farming-overview image files are reused for 28 crop inventory icons. The 20 species without inventory images require species-specific generated art. Each crop will receive five separate transparent stage silhouettes. Painted production art remains a separate visual QA milestone.

## Runtime integration
Farm selectable seed cards, seed shop, 5× bulk purchase, plot timing, stage art, harvest sale and the kitchen pantry all enumerate the full 48-crop catalog. Families filter the seed picker. Existing separate mining-glove yield bonuses and fertilizer buffs apply to all 48 crops. The 225 new stage sprites are generated under `web/art/embryon/town/gardening/growth`; 15 original crop-stage assets remain. The artwork is programmatic illustration for QA, not final painted master art.

## Kitchen recipe expansion
37 additional kitchen recipes, bringing actual deterministic craft-and-serve meals to 43. Recipe ingredients draw from the new crop IDs, gated by available house levels. Rewards use the existing canonical life/moves/mining-strikes/mining-surveys/farming power-up/match booster systems. The kitchen now lists craftable-tier recipes and prepared dishes, while preventing future-tier dishes from flooding the current kitchen UI. High-tier cooking cannot activate until the required house and stored harvest are available.

## Hand-painted growth upgrade — batch 1
The first eight crops (carrot, radish, lettuce, pea, mint, potato, onion, strawberry) now use their individual 512×512 painted WebP sprites in all five growth phases: **40 live game sprites**. The original source sheets were 2172×724 transparent five-stage images with gaps; stage splits were derived from blank alpha columns and normalized using the same scale and 487px ground baseline. The 40 output WebPs are stored in `web/art/embryon/town/gardening/growth/painted/` with pixel-space crop records and SHA-256 hashes in `manifest.json`. `web/crop-growth-art.js` prioritizes these painted assets for eight crop IDs; the 40 other crops keep working SVG illustrations until upgraded. All 240 stage URLs still resolve. A GitHub workflow verified the transfer archive and committed all 40 separate image files. Source PNG sheets are archived in the Jewelbrook Painted Crop Art Transfer folder in Google Drive; their full-resolution, pixel-identical lossless WebP masters are now separately committed under the painted/source_sheets/ directory.

Batch 2 begins with Nightshade Spinach: five additional approved-quality painted growth sprites, 512px WebP with shared soil baseline, plus its full-resolution pixel-lossless source sheet, now committed under `growth/painted/`. The painted resolver therefore covers 9/48 species (45/240 growth stages); 39 species still use individual generated vectors. Decorative crop-category overview charts are not valid individual stage assets and were deliberately excluded.

## Reproducing the painted growth sprite cuts
The exact executable cropping recipe is now versioned at `scripts/slice-painted-crops.py`. From a Python environment with `Pillow==12.3.0`, run `python scripts/slice-painted-crops.py --check` to validate all 45 painted stage sprites against the recorded digests without modifying game assets. Each original lossless 2172×724 source sheet is stored under `growth/painted/source_sheets/`; new crops should follow five transparent columns, four sufficiently broad alpha gaps, consistent light direction and no labels. To render any one crop use `python scripts/slice-painted-crops.py --crop spinach`. Always inspect mobile-scale details before enabling newly painted species in `web/crop-growth-art.js`.

## Crimson Beet candidate — review only, not approved

The painting generator repeatedly produced unrelated eight-category charts when a single five-stage Crimson Beet sprite sheet was requested. Those unrelated outputs were discarded, not added to the runtime. To continue with a tangible review artifact, we built a provisional five-stage **radish-derived** beet palette study using the existing approved Radish transparent painted asset as a starting point.

Review path: `web/art/embryon/town/gardening/growth/candidates/crimson-beet-v1/review.png`. Five alpha-enabled `beet-{seed,sprout,growing,maturing,ready}.webp` candidates are stored in the same directory, with a digest manifest and reproducible script `scripts/generate-crimson-beet-candidate.py`. Requirements: Pillow 12.3.0, NumPy 2.3.5. The draft retains root/shoot morphology from Radish and **is not an original painted beet master**. In particular, assess the radish-like tail and lack of beet-specific ruby veins before approval.

**Do not wire this into `web/crop-growth-art.js` without specific art acceptance.** The playable Crimson Beet crop continues to use `beet-*.svg`; this review-only import changes no gameplay, saves, economics or approved painting assets.

## Original Crimson Beet painting — now active
An original five-stage Crimson Beet painting (not adapted Radish art) now supplies the runtime WebP assets for beet at all five stages. The lossless 2172x724 source is stored at web/art/embryon/town/gardening/growth/painted/source_sheets/beet-growth-source.webp; the original painting cut previews are at web/art/embryon/town/gardening/growth/painted/reviews/beet-review.png. Because the leaf canopies nearly touch, its source boundaries are fixed at x=[0,338,700,1129,1634,2172] and stages are individually resized to fit 430 pixels inside 512px transparent tiles with a common y=487 baseline. Run python scripts/slice-painted-crops.py --crop beet --check to validate the five exported images against recorded SHA-256. Older radish-derived candidates remain explicitly archived as not approved. Current painted completion: 10/48 species (50/240 stage images); remaining 38 crops use SVGs.

## Continuous original art verification
The GitHub Actions workflow .github/workflows/verify-painted-crop-art.yml runs on changes to painted source masters, sliced sprites or the slicer itself. It installs the pinned Pillow version, regenerates every production sprite, and checks each committed SHA-256 against the approved manifest without writing files. Node art tests additionally verify all 50 images' alpha metadata, dimensions, origins, IDs and the isolation of the retired Radish-derived beet review candidate. This prevents inadvertent palette-recolored drafts entering the active art lookup.

## Original Blazevine Tomato artwork — integrated
The full five-stage Blazevine Tomato painting is now active on Home/Farm for crop ID `tomato`. A 2172×724 pixel-lossless WebP source master is stored in `web/art/embryon/town/gardening/growth/painted/source_sheets/tomato-growth-source.webp`. Five individually framed 512×512 transparent runtime images with shared soil baseline y=487 were split using measured x boundaries [0,353,721,1150,1631,2172], fixed 0.66 scale, and SHA-256 digests in `painted/manifest.json`. Their two-background QA sheet is `painted/reviews/tomato-review.png`. `python scripts/slice-painted-crops.py --crop tomato --check` regenerates the five files byte-for-byte. Flowering and small green fruit precede the red tomato harvest stage. Painted art coverage: **11 crops, 55 stages**; 37 species continue using fallback transparent SVGs.

## Original Pearl Cabbage artwork — integrated
Five painted cabbage growth stages have now replaced the SVG placeholders for `cabbage`. Runtime stage assets are each 512×512 transparent WebP, cut from the original 2172×724 art at fixed x boundaries [0,354,704,1128,1623,2172] with 0.66 scale and common 487px soil baseline. The pixel-lossless source is `web/art/embryon/town/gardening/growth/painted/source_sheets/cabbage-growth-source.webp`; the combined review strip is `painted/reviews/cabbage-review.png`. Their content SHA-256 hashes are registered in the manifest. Run `python scripts/slice-painted-crops.py --crop cabbage --check` to reproduce and validate exactly. Current painted coverage: **12 species, 60 stages**, with 36 species remaining on SVG growth images.

## Live artwork review queue
`web/town-crop-art-review.html` loads all forty-eight actual crop names, categories and house unlock levels directly from `web/town-garden.js`, and painted coverage from `web/crop-growth-art.js`. Functional filters show painted images or outstanding vector-only crops; the next illustrated artwork queue is Goldrunner Beans, Silver Garlic, Golden Corn, Firecrest Pepper, and Evergreen Broccoli. This is a review-only surface and does not change gameplay. Repeated cabbage-sheet generation attempts are excluded rather than mislabeled as beans.
