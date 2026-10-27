# Paati's Recipe

*Working title (first Paati's Muruku Kitchen, then Paati's Recipe Kitchen).* A short 2D learning and cooking game for Deepavali. The player learns what Deepavali is and what muruku is with Paati (grandmother), earns the six ingredients by answering her questions, makes one muruku with a wooden press, and can then keep cooking with her in a free kitchen. It is for every age, from young children to grandparents.

- **Play it:** **https://krishanala.github.io/paatis-recipe-kitchen/** (GitHub Pages; every push to `main` goes live in about a minute)
- **Design brief and user flow:** [docs/design-brief.md](docs/design-brief.md)
- **Quiz facts and their sources:** [docs/quiz-research.md](docs/quiz-research.md)
- **Flow diagram and edge cases:** [docs/user-flow.md](docs/user-flow.md)
- **Work plan:** GitHub [Issues](../../issues) and [Milestones](../../milestones). Open questions from the brief carry the `question` label.

## Status

This is a **playable starter build**. You can play the whole journey (Title → Welcome → Before we begin → 4 chapters → Finale → free kitchen → a note for someone you miss → goodbye) with touch, mouse or keyboard. However:

- Paati's stories, the quiz questions and the facts are **drafts** waiting for review by Tamil-speaking home cooks.
- The recipe card shows Paati's order but **no amounts**, which must come from a trusted family recipe.
- Paati, rice flour and urad dal are illustrated, but the rest of the art is **placeholder** SVG, and there is **no audio** yet.
- Progress lasts for one visit only. Settings (sound, text size, reduce motion) are saved on the device.
- The game is English-only for now, with no Tamil words.

## Play it locally

The game has no build step, but it uses ES modules, so it must be served over HTTP rather than opened as a file.

```bash
python3 tools/serve.py
```

Then open <http://localhost:8000>. The script turns off browser caching, so a normal reload picks up your edits.

## Screen shortcuts

To check a change without playing up to it, add `?screen=` and a name to the address. For example, <http://localhost:8000/?screen=taste> opens Let Paati taste it straight away. The game sets up what you would have by then (the ingredients earned, the chapters done, a well-made muruku), so the screen looks as it does mid-game, and Next carries on from there. The shortcuts work on the live site too; players never see them unless they type one. A name that doesn't exist opens the Title, and the browser console lists the names.

The links in the first column open your local copy (start it as above); the last column opens the live site.

| Screen | What it opens | Live |
|---|---|---|
| [`title`](http://localhost:8000/?screen=title) | Title screen (the normal start) | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=title) |
| [`welcome`](http://localhost:8000/?screen=welcome) | Paati's welcome | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=welcome) |
| [`intro`](http://localhost:8000/?screen=intro) | Before we begin (the plate of muruku and the words that appear one at a time) | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=intro) |
| [`ch1`](http://localhost:8000/?screen=ch1) | Chapter 1 story | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=ch1) |
| [`quiz-ch1`](http://localhost:8000/?screen=quiz-ch1) | Chapter 1 quiz | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=quiz-ch1) |
| [`store`](http://localhost:8000/?screen=store) | Paati's Store after chapter 1, with three ingredients flying in | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=store) |
| [`ch2`](http://localhost:8000/?screen=ch2) | Chapter 2 story | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=ch2) |
| [`quiz-ch2`](http://localhost:8000/?screen=quiz-ch2) | Chapter 2 quiz | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=quiz-ch2) |
| [`store-full`](http://localhost:8000/?screen=store-full) | The Store after chapter 2, with the last three flying in | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=store-full) |
| [`ch3`](http://localhost:8000/?screen=ch3) | Chapter 3 story | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=ch3) |
| [`store-cook`](http://localhost:8000/?screen=store-cook) | The full Store, with Start cooking | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=store-cook) |
| [`kitchen`](http://localhost:8000/?screen=kitchen) | Kitchen, step 1: Add | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen) |
| [`kitchen-water`](http://localhost:8000/?screen=kitchen-water) | Kitchen, step 2: Water (the bowl already has the flours, spices and ghee) | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen-water) |
| [`kitchen-knead`](http://localhost:8000/?screen=kitchen-knead) | Kitchen, step 3: Knead (the water is already in) | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen-knead) |
| [`kitchen-fill`](http://localhost:8000/?screen=kitchen-fill) | Kitchen, step 4: Fill the press | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen-fill) |
| [`kitchen-twist`](http://localhost:8000/?screen=kitchen-twist) | Kitchen, step 5: Twist | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen-twist) |
| [`kitchen-fry`](http://localhost:8000/?screen=kitchen-fry) | Kitchen, step 6: Fry (a spiral is already in the oil) | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=kitchen-fry) |
| [`result`](http://localhost:8000/?screen=result) | Your muruku: stars, score and reasons | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=result) |
| [`ch4`](http://localhost:8000/?screen=ch4) | Chapter 4 story | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=ch4) |
| [`quiz-ch4`](http://localhost:8000/?screen=quiz-ch4) | Chapter 4 quiz | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=quiz-ch4) |
| [`taste`](http://localhost:8000/?screen=taste) | Let Paati taste it, and the tasting animation | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=taste) |
| [`bonus`](http://localhost:8000/?screen=bonus) | Bonus for your heart | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=bonus) |
| [`note`](http://localhost:8000/?screen=note) | The note for someone you miss | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=note) |
| [`last`](http://localhost:8000/?screen=last) | The last page: Make more muruku or Finish | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=last) |
| [`goodbye`](http://localhost:8000/?screen=goodbye) | Paati's goodbye | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=goodbye) |
| [`free-kitchen`](http://localhost:8000/?screen=free-kitchen) | The free kitchen Store | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=free-kitchen) |
| [`free-cook`](http://localhost:8000/?screen=free-cook) | Cooking in the free kitchen | [live](https://krishanala.github.io/paatis-recipe-kitchen/?screen=free-cook) |

The kitchen steps ask Paati's question for that step first, as in the game. The shortcuts live in [`src/shortcuts.js`](src/shortcuts.js); add a line there for a new screen.

## How it's built

- [Phaser 3.88](https://phaser.io), loaded from jsDelivr, with plain JavaScript modules and no bundler.
- The stage is designed at **1280 × 720** (landscape) and scales to fit any screen.
  - It draws at the size it actually shows (`RES` in `src/theme.js`), so it stays sharp on large retina monitors and saves memory on phones.
  - On phones (`COMPACT`), small text grows by up to 35%, buttons get taller, and every touch area is at least 88 stage pixels, which shows as about 46 px. Layouts stack by their real height, so the larger text fits.
  - On wide screens (most phones held sideways) the view stretches to the screen's full width, up to 2.4:1. The content stays in the middle 1280, and the extra width shows more background. It adapts live when the window changes shape.
  - On phones and tablets, **Play** also switches to full screen so the browser's bars don't shrink the game. There's a **Full screen** button on the Title screen and in Help & settings, wherever the browser supports it. iPhones don't support web full screen, but **Add to Home Screen** opens the game full screen and sideways (`manifest.webmanifest`, with Paati as the icon).
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
  shortcuts.js        ?screen= shortcuts that open one screen straight away
  state.js            settings (saved) and progress (this visit only)
  scoring.js          dough 40 / twist 30 / fry 30 → stars, with one-line reasons
  draw.js             draws the player's own spiral as their muruku
  ui/                 Button (all states), keyboard focus, Paati's bubble, header, settings sheet
  scenes/             Title, Story, Intro (before we begin), Quiz, Store, Cook (6 steps), Result, Note, Finale
assets/
  paati/              Paati's illustrated poses (welcome, teaching, proud, sharing, and four for tasting the muruku)
                      + round avatar; originals in source/
  art/                placeholder SVG art (press, pan, water jar, diyas, kolam, garland…) and the user's illustrations
                      as PNGs (the five dry ingredients, banana leaf, plate of muruku, leaf laid with a meal)
  ingredients/        reference photos from the asset sheet (not used in game: the brief asks for flat 2D art)
docs/                 design brief and user flow
tools/serve.py        local server with caching off
tools/cutout.swift    cuts an illustration out of its white background (for assets/art/*.png)
figma-scripts/        pending Figma updates from the earlier design pass
paper-whats-left.md   to-do list from the earlier Paper design pass
```

### Editing content

Paati's lines, the quiz and the facts all live in [`src/content.js`](src/content.js).

- **Formats:** questions come in four formats: 3 choices, **True or not?**, **Tap the picture** and **Put in order**. Each chapter mixes them.
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

- **27 Oct 2026, screen shortcuts:** Adding `?screen=` and a name to the address opens that screen straight away, set up as it would be mid-game, including each of the six kitchen steps (see [Screen shortcuts](#screen-shortcuts)). Building them turned up a crash: after the free kitchen, Play again on a computer broke the kitchen when you reached it. That is fixed.
- **27 Oct 2026, Let Paati taste it:** The offering page now reads "Let Paati taste it". After Offer to Paati, she steps into the middle of the screen as the muruku flies over, and tastes it in four pictures from the user's illustrations: a bite (with a "Crunch!" and crumbs), chewing, a happy dab of her eyes with her handkerchief, then she looks at the player and says thank you in a speech bubble on her left, and Next (on her right) goes on to Bonus for your heart. A tap or key press skips to the end; with Reduce motion the pictures change in place without movement. The frames are `assets/paati/taste-*.png`, all cut to one shared box (`tools/cutout.swift` gained `trim=no` for that) so they line up as they swap.
- **26 Oct 2026, Paati shares muruku:** Her sharing pose (chapter 4 and the last page) now holds a plate of muruku instead of round sweets, from the user's new illustration (`assets/paati/sharing.png`, source in `assets/paati/source/sharing.jpg`).
- **26 Oct 2026, a shorter ending:** The three jars to share and the What you learned page are gone. After you offer your muruku to Paati, it flies over to her and the game goes straight to Bonus for your heart (or the last page, once the note has been offered). The safety line that sat on What you learned ("May contain sesame. Younger cooks need an adult near hot oil.") went with it; the chapter 3 story still warns about hot oil.
- **26 Oct 2026, more of the user's art:** Flour (a jute sack with wheat), spices (a clay tray of seven spices) and ghee (a painted clay pot) now use the user's illustrations instead of the generated tins and jar, cut from one picture as `assets/art/flour-sack.png`, `spice-tray.png` and `ghee-pot.png`. `tools/cutout.swift` gained `crop=` and `erase=` for pictures with several things in them, and `shadow=` to take away soft drop shadows. On phones the kitchen's ingredient row sits a little lower so it clears the step tabs. The note page now shows the user's banana leaf laid with a full meal (`assets/art/food-leaf.png`) between the two lamps, in place of the leaf with three muruku and flowers.
- **26 Oct 2026, before we begin, and a new banana leaf:** After Paati's welcome comes a new page, **Before we begin** (`src/scenes/IntroScene.js`), with a big plate of muruku on the right. It says we are going to learn how to make muruku, and along the way find out what Deepavali is. The heading slides in, then the words arrive **one at a time, at a pace people can read** ("make muruku" and "Deepavali" picked out in marigold), then **Start Chapter 1**. A tap or key press shows it all at once, and Reduce motion shows it all from the start. (A path of the four chapters under the words was tried and taken out.) The words are set by `wordText` in `src/ui/widgets.js`, and their text is `INTRO` in `src/content.js`. The muruku and banana leaf at the start of chapters 2 and 4 are gone, and the chapter 4 story now opens "You made muruku with your own two hands!" Every banana leaf (Result, the chapter 4 quiz, the offering and the note page) now uses the user's leaf illustration. The leaf and the plate of muruku are cut out from white as `assets/art/banana-leaf.png` and `muruku-pile.png` with `tools/cutout.swift`. A long header title (Chapter 4's) now moves left to clear the chapter diyas, and gets smaller only if it still doesn't fit.
- **22–23 Oct 2026, polish phase 3:** Stories are now **two short lines each**, with nothing to tap. (Tap moments were tried on 22–23 Oct and then taken out: a kolam scratch card, lamps to light, biting the muruku and cooling it.) On the Finale, after you offer your muruku to Paati, you **tap three jars to pass them on**: to the neighbours, the cousins and the ants. They're on the Finale, not in the chapter 4 story, so they don't give away the "Who is muruku shared with?" answer. **Kneading** now leads with the real circular gesture: a marigold dot circles the bowl until you touch it, swirl marks follow your finger, and the dough rounds off into a smooth, shiny ball. "Or hold to knead" stays as the smaller alternative.
- **22 Oct 2026, polish phase 2:** Paati now **asks first and explains after**. Chapter stories are a two-line hook that gives nothing away, and every question was rewritten so it makes sense on its own, with **believable wrong answers** (no more "glows in the dark"). Each wrong answer has its own nudge, and the right one gets the full explanation. After a right answer, only it stays on screen, moved to the top. In the kitchen, **Paati asks one question at the start of five steps**. Right first time unlocks her tip: numbered jars (the jars are now shuffled), a slower pour near the green zone, kneading that counts for more, a guide spiral on the oil, and golden that lasts longer. Wrong answers just mean no tip. The free kitchen has no questions, and every tip is on there. Facts, answers and sources: [docs/quiz-research.md](docs/quiz-research.md).
- **22 Oct 2026, polish phase 1:** Paati's voice now has gentle humour and a little sass ("Shoes off, appetite on."), rewritten across the stories, store, kitchen, results and finale. The note for someone you miss stays gentle. Quiz explanations will be rewritten in phase 2, which asks first and explains after. A wrong answer now pauses the choices on Paati's hint until **Try again**, and the plate choice in the kitchen works the same way. While pouring, Paati reacts live and the meter's green zone glows, with a tiny buzz on phones at just right. While frying, a pulsing **Flip now!** badge, then **Lift it out!**, appears beside the pot. Every line goes through a voice-over hook, so recordings can be added later ([docs/voice-over.md](docs/voice-over.md)), and the speech bubble keeps the captions. Paati's kitchen, store and quiz lines now live in `src/content.js` (`COOK_LINES`, `STORE_LINES`, `QUIZ_LINES`).
- **21 Oct 2026, the end of the game:** What you learned is now three boxes (Deepavali, Muruku, Together), each with an icon, a number, a serif title and a colour band, under a raised maroon heading, with only a Next button. Next opens **Bonus for your heart**, a page in the welcome page's style that leads to the note for someone you miss. After the note comes the last page, with only Make more muruku and Finish. Finish (and the other secondary buttons paired with an orange one, such as Skip) has a marigold label. The welcome page's look is now shared helpers in `src/ui/widgets.js` (`raisedTitle`, `ribbon`, `welcomeStage`).
- **21 Oct 2026, kitchen look:** Following the user's references, the cook screen's bowl is now a wooden bowl seen from the front: each flour pours in and lands as a soft peaked pile with a puff of dust, spices and ghee land on top, and the pile turns into a rounder dough as water goes in and lumps smooth out with kneading. Water pours from a clay pitcher that lifts and tips, with a stream and a splash. Frying happens in an orange enamel pot of golden oil that fizzes around the dough as it goes in and bubbles hard, with froth, while it fries. Hold to twist now sits beside the pot so the spiral stays in view, and the press nozzle is see-through. On Fill the press, a dashed "Drag" arrow with a gliding dot shows where the dough, the plunger and the plate go, and the plates are dragged under the press (tapping still works). The plate arrow starts from the row, so it doesn't give the answer away. The art is generated (`assets/art/bowl-back.svg`, `bowl-front.svg`, `pitcher.svg`, `pot-oil.svg`); the references themselves are not used, because two are watermarked stock images.
- **21 Oct 2026, buttons and header:** Every main (filled) button now matches Play: Poppins, off-white on a deeper marigold that passes contrast. All button labels use Poppins. Every screen with a Help button now has Full screen beside it, where the browser allows full screen.
- **21–22 Oct 2026, welcome animation:** The Title screen opens with a greeting: "Happy Deepavali", on two lines in a big ribbon, pops up with sparkles and two firecrackers, stays for five seconds, then pops away; "PAATI'S RECIPE" slides in, then Play (or Continue), then Sound, Help and Full screen in a row under Play. It plays once per visit. A tap or key press skips it, and coming back to the Title shows it settled. With Reduce motion, the greeting shows still for five seconds and then the screen appears. The name is set in capitals in EB Garamond (70 px, maroon), flat. The Play button's label is Poppins in the page's off-white, on a deeper marigold (#D96500) so the text passes 3:1 contrast in every state.
- **21 Oct 2026, ingredient art:** Rice flour (a jute sack with a scoop) and urad dal (a clay bowl of lentils with a scoop) use the user's illustrations, cut out from their white backgrounds as `assets/art/rice-flour.png` and `assets/art/urad-dal.png`. They are wider than the other jars and tins, so `artScale` in `INGREDIENTS` draws them a little larger to match.
- **21 Oct 2026, firecrackers:** A right answer sends up firecrackers: rockets with sparkling trails that burst into colour (`rocket` and `celebrate` in `src/ui/widgets.js`). A two- or three-star muruku gets them too, and the Finale sky has them all the time. Reduce motion turns them off.
- **21 Oct 2026, a note for someone you miss:** Before Paati's goodbye, a new screen (`src/scenes/NoteScene.js`) explains that the day before Deepavali, many families set out the favourite foods of loved ones who have passed away, as a way of saying "I remember you". The player can write a note on parchment, roll it up, tie it with a string, and send it off with a pigeon, or skip it. The note is **never saved or sent**: it exists only on that screen, and the screen says so. The parchment, scroll and pigeon are generated art (`assets/art/parchment.svg`, `scroll-roll.svg`, `pigeon-body.svg`, `pigeon-wing.svg`), and the handwriting uses the Kalam font. The wording needs cultural review ([quiz research](docs/quiz-research.md#remembering-loved-ones-the-note-screen)).
- **21 Oct 2026, live:** The repo was made public so the game could be hosted for free on GitHub Pages.
- **20–21 Oct 2026, renamed:** The game is now **Paati's Recipe**, and the first screen opens with a "Happy Deepavali!" banner. The "Starter build" note was removed from the Title screen. The repo and web address keep the name `paatis-recipe-kitchen`.
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
