# World and royal chronology

## The premise

The player works within **Embryon** as one of the people who mine jewels, grow crops, prepare meals, trade goods and support the realm. Queen **Daysha** and King **Rome** have a separate royal storyline unfolding in that same economy. The game's current Town character illustration uses the established Daysha visual identity; this is a presentation fact, **not** a claim that the player personally performed the queen's historical deeds.

At the story's beginning Daysha and Rome are newly married. Their daughter **Estelle is not yet born**. The later pictures of Estelle's childhood belong to future portions of the larger family chronicle, which extends beyond the opening 1,000-stage campaign.

## Calendar and level progression

The setting's Elaranth calendar has **13 months**, but month names, lengths, weekday alignment, leap rules and the historical starting epoch are **not verified** in this repository. We therefore use the precise **Campaign Day** system, not fabricated calendar dates:

- Main stage **N** represents **Campaign Day N** (1 through 1,000). The first clear makes that day and its assigned royal events historical/unlocked.
- Replaying a cleared stage does not move history forward.
- Elemental trials are optional side encounters; their stage requirement gives only the earliest date of eligibility, **not a distinct fixed campaign day**.
- Estelle's later childhood events occur beyond the first 1,000 campaign days. Their ages and regnal dates await sourced canon.

[Long-form chronology and Elaranth wiki reference](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/EMBRYON_WORLD_WIKI.md) · [Royal Chronicle implementation](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/ROYAL_CHRONICLE_INTEGRATION.md)

## Royal art and authenticity

Only approved **original generated** portraits and royal-household imagery belong in Jewel Brook's source assets. Third-party gown photographs and inspiration references are **not** game-owned material and must not be imported as original art. Ten original elemental gown illustrations are bundled and revealed behind their relevant optional trial and main-stage requirements; they are **not** player wardrobe purchases or assertions about exactly when Daysha bought a dress.

Several additional original atelier image records exist as source references but still lack recovered, verified image bytes. There must be no invented stand-ins. See [the generated-image sorting record](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/DAYSHA_GENERATED_IMAGE_SORTING.md), [Daysha character identity](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/DAYSHA_ART_CONTRACT.md) and [art contract](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/EMBRYON_ART_PRODUCTION.md).

The primary Chronicle and the offline field guide are powered by [`web/royal-chronicle.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/royal-chronicle.js) and [`web/embryon-world-guide.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/embryon-world-guide.js). Their data-driven unlock conditions determine when a player sees each event.
