# Paati's Recipe Kitchen

*Working title (renamed from Paati's Muruku Kitchen on 20 Oct 2026).* A short 2D learning and cooking game for Deepavali. The player learns what Deepavali is and what muruku is with Paati (grandmother), earns the six ingredients by answering her questions, makes one muruku with a wooden press, and can then keep cooking with her in a free kitchen.

- **Design brief and user flow:** [docs/design-brief.md](docs/design-brief.md)
- **Quiz facts and their sources:** [docs/quiz-research.md](docs/quiz-research.md)
- **Flow diagram and edge cases:** [docs/user-flow.md](docs/user-flow.md)
- **Work plan:** GitHub [Issues](../../issues) and [Milestones](../../milestones). Open questions from the brief carry the `question` label.

## Status

This is a **playable starter build**. You can play the whole journey (Title → Welcome → 4 chapters → Finale → free kitchen) with touch, mouse or keyboard. However:

- Paati's stories, the quiz questions and the facts are **drafts** waiting for review by Tamil-speaking home cooks.
- The recipe card shows Paati's order but **no amounts**, which must come from a trusted family recipe.
- Paati is illustrated, but the rest of the art is **placeholder** SVG, and there is **no audio** yet.
- Progress lasts for one visit only. Settings (sound, text size, reduce motion) are saved on the device.
- The game is English-only for now, with no Tamil words.

## Play it locally

The game has no build step, but it uses ES modules, so it must be served over HTTP rather than opened as a file.

```bash
python3 tools/serve.py
```

Then open <http://localhost:8000>. The script turns off browser caching, so a normal reload picks up your edits.

## How it's built

- [Phaser 3.88](https://phaser.io), loaded from jsDelivr, with plain JavaScript modules and no bundler.
- The stage is designed at **1280 × 720** (landscape) and scales to fit any screen.
  - It draws at the size it actually shows (`RES` in `src/theme.js`), so it stays sharp on large retina monitors and saves memory on phones.
  - On phones (`COMPACT`), small text grows by up to 35%, buttons get taller, and every touch area is at least 88 stage pixels, which shows as about 46 px. Layouts stack by their real height, so the larger text fits.
  - A phone or small tablet held upright shows a "please turn your device sideways" message instead of a tiny letterboxed game.
  - Tested at 667 × 375 and 844 × 390 (phones sideways), 375 × 812 (phone upright), 768 × 1024, 1280 × 720, and 1920 × 1080.
- Inter (Google Fonts) is used for all interface text. Design tokens follow the brief's design system, with Marigold for the one main action, gold highlights, indigo as an accent, and no red anywhere.

```
index.html            entry page (loads Phaser + src/main.js)
src/
  main.js             game config and scene list
  theme.js            colour, type, radius, button and mood tokens from the brief
  content.js          everything Paati says and asks: stories, quiz, ingredients, steps, facts
  flow.js             the one-time journey, in order
  state.js            settings (saved) and progress (this visit only)
  scoring.js          dough 40 / twist 30 / fry 30 → stars, with one-line reasons
  draw.js             draws the player's own spiral as their muruku
  ui/                 Button (all states), keyboard focus, Paati's bubble, header, settings sheet
  scenes/             Title, Story, Quiz, Store, Cook (6 steps), Result, Finale
assets/
  paati/              Paati's illustrated poses (welcome, teaching, proud, sharing) + round avatar; originals in source/
  art/                placeholder SVG art (press, pan, jars, diyas, kolam, garland…)
  ingredients/        reference photos from the asset sheet (not used in game: the brief asks for flat 2D art)
docs/                 design brief and user flow
tools/serve.py        local server with caching off
figma-scripts/        pending Figma updates from the earlier design pass
paper-whats-left.md   to-do list from the earlier Paper design pass
```

### Editing content

Paati's lines, the quiz and the facts all live in [`src/content.js`](src/content.js).

- **Question banks (`QUIZ_BANK`):** Each chapter has a bank of questions, and every question carries a `teach` line. Paati's story for the chapter is her intro, then the `teach` line of each question she is about to ask, then her outro. So every answer is explained before it's asked.
- **Which questions are asked:** `core` questions are asked every time; the rest are picked at random, so replays bring new facts.
- **Choices:** Each question has exactly three choices, and each choice has its own `why`, which is what Paati says after the player picks it.
- **Rewards and facts:** `REWARDS` sets which ingredient each question position earns. Facts that weren't asked come back in the free kitchen.
- **Sources:** Every fact, its sources and the reviewer checklist are in [docs/quiz-research.md](docs/quiz-research.md).

### Accessibility built in

- Every button has hover, focus, press and disabled states, and the focus ring is clearly visible.
- On a keyboard, Tab moves between buttons and Enter or Space activates them. Hold-to-pour, knead and twist work by holding the key.
- Every gesture has an alternative: dragging can be replaced by tapping, and drawing the spiral by holding **Hold to twist**.
- There are no timers and no way to lose. A wrong answer is never shown in red.
- Stars always come with words, and meters carry text labels as well as colour.
- Reduce motion turns off sparkles, fireworks and fades. It follows the system setting by default.

## Design decisions since the brief

- **20 Oct 2026, renamed:** The game is now **Paati's Recipe Kitchen**, and the first screen opens with a "Happy Deepavali!" banner.
- **20 Oct 2026, festive glow:** Following the user's mood references, the off-white screens gained warm Deepavali light: hanging marigold garlands, soft bokeh, gold firework sparkles, glowing lamps, and a golden lotus diya (`assets/art/lotus-diya.svg`, generated) at the heart of the kolam. The references themselves are not used in the game, because two of them are watermarked stock images. The Title screen no longer has body text; the stories explain the game.
- **20 Oct 2026, garlands:** Following the user's garland references, the marigold garlands and mango-leaf toran are drawn from generated art: ruffled marigolds in three shades, jasmine-and-rose tassels, glossy mango leaves and brass bells (`assets/art/marigold-*.svg`, `jasmine-tassel.svg`, `mango-leaf.svg`, `rose.svg`, `brass-bell.svg`). They are used in the top valance (Title, Finale), the swaying side strands, and the toran on the Cook screen.
- **20 Oct 2026, off-white festive look:** The screens the brief made night indigo (Title, Welcome, chapter 1 and Finale) are now off-white, with bright marigold, gold and Rani pink around them. On the Title screen, Paati stands with open arms behind a doorstep kolam ringed with lit diyas, inviting the player in. The kolam (`assets/art/kolam-doorstep.svg`) is generated, so its colours are easy to change.
- **20 Oct 2026, illustrated Paati:** Paati uses the four illustrated poses in `assets/paati/`.
- **English only:** There are no Tamil words in the game for now. Whether to add them is tracked as an issue.

## Design files

The earlier design passes used the **previous** version of the brief, which had the Kadai shop, points, levels and jars:

- Figma: [Paati's Muruku Kitchen — Game Stage](https://www.figma.com/design/D92o5ppaITPUDEWiCd9KHs)
- Paper: *Paati's Muruku Kitchen — Game* (see [paper-whats-left.md](paper-whats-left.md))

Brief v2, the one in `docs/`, drops the shop and points. Reconciling the design files with v2 is tracked as an issue.
