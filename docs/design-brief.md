# Muruku Game: Design Brief & User Flow

Oct 12, 2026 · Deepak · Converted from *Muruku Game Design Brief & User Flow-2.pdf*

## Overview

**Paati's Muruku Kitchen** (working title) is a short 2D game built around a one-time learning journey. In one sitting the player learns what Deepavali is, what muruku is, how it is made and why it matters, then makes one muruku of their own with Paati. When the journey ends, they can keep making muruku with Paati for as long as they like.

**One-line pitch:** Learn about Deepavali with Paati, earn the ingredients by answering her questions, then make your own muruku, and keep cooking with her as long as you like.

| | |
|---|---|
| Genre | Short 2D learning and cooking game with an optional free kitchen |
| Length | One sitting for the journey, targeting about 10 to 15 minutes (to be tested). The free kitchen has no set length |
| Journey | Four chapters in a straight line, ending with one muruku, then an optional free kitchen |
| Core promise | Anyone, with no prior experience, learns what muruku is, how it is made and why it belongs to Deepavali |
| Guide character | Paati (grandmother) |
| Platform and tech | To be confirmed (see [Open questions](#open-questions)) |

## Why this game

Muruku is a crunchy, spiral-shaped South Indian snack made from rice flour and urad dal flour, seasoned and deep-fried. The word means "twisted" in Tamil, which describes both its shape and the way it is made.

Families traditionally make muruku at home in the weeks before Deepavali. The dough is pressed through a hand press into spirals, the work is slow, and it is often done together by several generations. The jars are then shared with visitors, neighbours and friends.

> **A note on the premise.** Muruku is sold and eaten all year, so the game should not claim it is only eaten at Deepavali. What is true is that Deepavali is when families make it at home, in large batches, and share it. The game teaches that: why it is a festival tradition, not why it is forbidden the rest of the year.

## What players should learn

1. What muruku is, and what its name means.
2. What goes into it and what each ingredient does (rice flour for crunch, urad dal for flavour and lightness, ghee for richness, spices for taste).
3. How it is made: mix, knead, press and twist, fry.
4. What Deepavali is, and how food and sharing sit at the centre of it.
5. Why home-made muruku takes effort, and why that effort is part of the celebration.

## Audience

The game is for every age. Its main player has never made muruku, never used a muruku press and may not know the festival well, so nothing assumes prior knowledge.

- **Children** get big touch targets, simple words and Paati's spoken lines.
- **Adults and grandparents** get an authentic recipe and Tamil words with their meanings.
- **Players new to the tradition** get short stories from Paati instead of long text.

## Meet Paati

Paati (Tamil for grandmother) is the player's guide, teacher and judge. She is warm, patient and a little cheeky, and she is the reason the game feels like being invited into a family kitchen rather than sitting a test.

### Her jobs in the game

- Welcomes the player and explains muruku and Deepavali in short spoken stories.
- Asks the quiz questions and explains every answer, right or wrong.
- Gives step-by-step cooking instructions and hints.
- Judges the muruku and reacts to the result.

### Personality rules

- Encourages first, corrects second. A bad muruku is a chance to try again, never a failure.
- Keeps each line short, one idea at a time, so children and first-time players can follow.
- Uses a few Tamil words with the meaning shown alongside, so players pick them up naturally.

### Paati's reactions

| State | When | Sample line (English first, Tamil flavour in brackets) |
|---|---|---|
| Welcome | Opening the game | "Come in, dear, the kitchen is ready." (Vaanga kanna) |
| Teaching | Quiz and recipe steps | "Watch how the dough should feel, soft like an earlobe." |
| Proud | 3-star muruku, correct answers | "Very good! Even I could not do better." (Romba nalla irukku) |
| Gentle correction | 1-star muruku, wrong answers | "Oops, too much water. Let us try again together." (Aiyo) |
| Celebrating | Finished muruku, finale | "Now we can share this with the whole street." |

> The Tamil phrases above are suggestions only. Have a Tamil-speaking reviewer confirm spelling, meaning and tone before they go into the game.

## The journey and user flow

The game is one straight path of four chapters. There is no points score and no shop. The player learns with Paati, earns the ingredients by answering her questions, and makes a first muruku. When the journey ends, the player can choose to keep making muruku with Paati in a free kitchen.

**One-time journey · 4 chapters, 1 muruku**

| Chapter | Paati teaches | The player | Ends with |
|---|---|---|---|
| Welcome | What the game is and who Paati is | Taps through a short story | Chapter 1 opens |
| 1. What is Deepavali? | The festival of lights, lamps, kolam, sharing | Answers 3 quiz questions | Rice flour, urad dal flour and flour in the Store |
| 2. What is muruku? | The name means twisted, the main ingredients, why it is made before Deepavali | Answers 3 quiz questions | Spices, ghee and water in the Store, so all 6 ingredients are collected |
| 3. How is it made? | Each step of the recipe, one at a time | Cooks one muruku in six steps with the wooden press | A fried muruku and its star rating |
| 4. Why muruku at Deepavali? | Sharing, family, and the effort that goes into it | Answers 2 quiz questions and offers the muruku to Paati | A recap card and Paati's farewell |
| Free kitchen (optional) | Short hints and a Deepavali fact between muruku | Chooses to make more muruku, as many as they like | The player choosing to finish |

See [user-flow.md](user-flow.md) for the flow diagram.

### How the quizzes work

- Paati tells a short story (about 30 seconds) before each chapter, then asks the questions.
- Each question has 3 answer choices.
- A wrong answer is never a dead end. Paati explains it kindly and the player tries again until they get it, so every player finishes.
- In chapters 1 and 2 each correct answer earns one ingredient, which flies into the Store.
- Chapter 4 questions earn nothing. By then everything has been collected and the point is the meaning.

### Example questions

To be checked by a Tamil-speaking home cook before use.

| Chapter | Question | Answer |
|---|---|---|
| 1 | What does Deepavali celebrate? | The victory of light over darkness |
| 1 | What do many families light in their homes? | Oil lamps |
| 1 | What is drawn at the doorstep with rice flour? | A kolam |
| 2 | What does "muruku" mean in Tamil? | Twisted |
| 2 | Which two flours form the base of muruku? | Rice flour and urad dal flour |
| 2 | When do families traditionally make muruku at home? | In the days before Deepavali |
| 4 | Who is muruku shared with? | Family, neighbours and visitors |
| 4 | Why do families often make muruku together? | It takes time, and making it together is part of the celebration |

## The Store

The Store is Paati's store room, drawn as a 2D side-on wall of shelves. It starts empty and fills up as the player answers questions, so it also shows how far the player has come.

### What the player sees

- Six container outlines on the shelves, one per ingredient. Each fills in with a small animation when the ingredient is earned.
- Tapping a container lets Paati explain what that ingredient does.
- A **Start cooking** button that appears once all six are collected.

The Store appears briefly after chapters 1 and 2 to show what was earned, and again at the start of chapter 3, where the player picks the ingredients up for the bowl. There is no buying and no stock count in the journey: each ingredient is earned once and used once. In the free kitchen the Store is always fully stocked.

| Ingredient | Drawn as | Earned in | Used in step | What Paati teaches |
|---|---|---|---|---|
| Rice flour | Cloth sack | Chapter 1 | 1 Add | Gives muruku its crunch |
| Urad dal flour | Steel jar | Chapter 1 | 1 Add | Adds flavour and lightness |
| Flour | Steel tin | Chapter 1 | 1 Add | Helps the dough bind and stay soft |
| Spices | Round spice tin | Chapter 2 | 1 Add | Gives the taste |
| Ghee | Jar | Chapter 2 | 1 Add | Makes the muruku richer |
| Water | Clay pot | Chapter 2 | 2 Water | Brings the dough together |

## Making the muruku

In chapter 3 the player makes one muruku in six steps. Paati shows an instruction card for each step, and the player does the action by touch or mouse.

| # | Step | What the player does | What is judged |
|---|---|---|---|
| 1 | Add | Drag the ingredients from the Store into the bowl in Paati's order: rice flour, urad dal flour, flour, spices, ghee | Right order and amounts |
| 2 | Water | Hold to pour, release when the meter is in the green zone | Water level |
| 3 | Knead | Rub in circles until the progress ring fills | Smooth, soft dough |
| 4 | Fill the press | Drag the dough into the wooden press, fit the plunger and choose the star plate | Not scored, Paati checks it |
| 5 | Twist | Hold the lever while drawing a spiral over the hot oil | Even rings, closed spiral, steady thickness |
| 6 | Fry | Flip once, lift when golden | Colour and timing |

### Perfection score and stars

Steps 1 to 3 make up the dough (40), step 5 the twist (30) and step 6 the fry (30), out of 100. 90 or more earns 3 stars, 70 to 89 earns 2 stars, and anything lower earns 1 star. The player cannot fail: every muruku is served to Paati, who reacts to it kindly and explains each lost point in one line, for example "too pale, give it a little longer".

> The scoop amounts on Paati's recipe card must come from a trusted family recipe, so the game teaches a real method. Placeholder ratios should not ship.

## The free kitchen

After the finale, Paati asks whether the player wants to make more muruku. Choosing yes opens the free kitchen, where the only thing to do is cook with Paati.

- The Store is always fully stocked, so the player goes straight to **Start cooking**. There is no quiz, no shop and no points.
- Each muruku follows the same six steps as chapter 3. Paati gives shorter hints and repeats the full instructions only if the player asks.
- After each muruku, the result screen shows stars and one line from Paati, with **Make another** and **Finish** buttons.
- A plate on the counter fills up with the muruku the player has made, so progress stays visible.
- Between muruku, Paati shares a small Deepavali fact. It is never a quiz, so there is still something to learn.
- **Finish** ends the game with Paati's goodbye.

## The muruku press

The game's cooking tool is a traditional wooden hand press, drawn in 2D as three separate wooden pieces so each can animate on its own.

| Part | What it looks like in the reference photo | Role in the game |
|---|---|---|
| Base | A short, wide reddish-brown cylinder with a flat arm extending to one side | Holds the dough. Sits over the frying pan during the twist |
| Plunger | A pale, smooth wooden cylinder | Fits into the base and pushes the dough down |
| Lever | A large curved, forked reddish-brown wooden arm | Swings down to drive the plunger. The player holds it to press |

The photo does not show the plate with the shaped holes that gives muruku its spiral. The game draws a star plate at the bottom of the base. Please confirm how your real press loads and which plate it uses, so the game matches it.

### How the press is used (steps 4 and 5)

1. **Fill.** Side view. The player drags a ball of dough into the open base and fits the plunger on top.
2. **Press.** The lever swings down, the plunger lowers and a ribbon of dough comes out of the base. Holding the lever keeps it flowing.
3. **Twist.** Top-down view of the pan. The base becomes a circle that follows the player's finger while the dough ribbon lays down behind it. A steady spiral scores high. Lifting the finger stops the dough.

### 2D art needs for the press

- Three sprites (base, plunger, lever) in a side view, with states: empty, filled, pressing and resting.
- One simple top-down circle for the base while twisting, plus a dough ribbon drawn as a growing spiral line.
- Colours taken from the photo: reddish-brown for the base and lever, pale wood for the plunger, on the cream background.

## Screens

The game needs 7 screens. Settings (sound, text size, language) sit behind the Help button on the title screen.

| # | Screen | Purpose | Key elements |
|---|---|---|---|
| 1 | Title | Set the festive mood and start | Game name, Paati waving, Play, Sound, Help |
| 2 | Paati's story | Welcome and open each chapter | Paati, a short story in a few lines, Next |
| 3 | Quiz | Learn through questions | Question, 3 answer choices, progress dots, Paati's explanation after each answer, ingredient flying to the Store |
| 4 | Store | Show what has been collected | Six ingredient containers, tap for Paati's note, Start cooking |
| 5 | Cook | Make the muruku | Bowl view (steps 1 to 3), press side view (step 4), frying pan top-down view (steps 5 and 6), instruction card, Paati's hints |
| 6 | Result | Judge the muruku | The finished muruku, stars, one-line reasons from Paati. In the free kitchen: Make another and Finish buttons |
| 7 | Finale | Close the journey | Recap card of what was learned, Paati's farewell, a choice to make more muruku or finish |

## Look and design system

The look is **modern traditional** and very vibrant. The structure is modern and clean, taken from the Design System (Community) in Figma: its typeface, rounded components and clear states. The decoration is traditional Deepavali: kolam patterns, marigold garlands, brass lamps and silk-border trims. The design system is the skeleton, and Deepavali supplies the colour and ornament.

### What the design system provides

| Foundation | In the design system | How the game uses it |
|---|---|---|
| Typeface | Inter, Semi Bold for headings and buttons, Regular and Medium for body | Inter for all interface text. Tamil words need a companion Tamil font (for example Noto Sans Tamil) because Inter has no Tamil letters, so test the weights side by side |
| Type scale | H1 48/58, H2 40/48, H3 32/38, H4 28/34, H5 24/28, S1 18/28, B1 16/24, B3 14/20 | Title in H1, chapter names in H3, quiz questions in H5, Paati's story text in S1. No play-screen text below 14 (B3) |
| Corner radius | Tokens of 12 px (used on buttons) and 24 px (extra large) | 12 px for buttons and inputs, 24 px for cards, pop-ups and Paati's speech bubble |
| Buttons | Giant 56, Large 48, Medium 40, Small 32, Tiny 24. Filled, Outline and Clear styles. Default, Hover, Focus, Press and Disabled states | Giant for Play and Next, Large for quiz answers. Every touch target at least 48 px |
| Shadow | Eight levels, 100 to 800 | Low levels for cards, high levels for pop-ups and celebration moments |
| Icons | A large icon set at 24 px | Interface icons only (back, help, sound). Game illustrations are custom |

### Colour

The system's primary colour is indigo, which suits Deepavali: lamps glow brightest against a night sky. Indigo stays as the night colour, and the brief adds warm Deepavali colours on top. Only colour tokens change. No component is redrawn.

| Role | Colour | Hex | Source |
|---|---|---|---|
| Night backgrounds | Primary 900 and 800 | `#212967`, `#2B3587` | Design system |
| Secondary actions, links | Primary 500 and 700 | `#4E61F6`, `#3745AF` | Design system |
| Main action (the one big button) | Marigold 500 | `#F77700` | New |
| Lamp glow, stars, highlights | Yellow 500 and 300 | `#FFAA00`, `#FFC654` | Design system |
| Paper and kitchen backgrounds | Yellow 50 | `#FFF7E6` | Design system |
| Celebration and kolam accents | Rani pink 500 | `#D6246E` | New |
| Correct answers, banana leaf | Green 600 and 700 | `#3DA755`, `#308242` | Design system |
| Hints and gentle correction | Blue 600 (Info), Yellow 600 (Warning) | `#0088E8`, `#E89B00` | Design system |
| Text | Grey 900 on light, white on night | `#131927`, `#FFFFFF` | Design system |

The system's red (Error) is not used in the game, so a wrong answer is never shown in red. Marigold and Rani pink are new colours: a designer builds their full ramps in the same steps as the system's, and checks text contrast. Use dark text (Grey 900) on Marigold and white text on Indigo and Rani pink.

### Which component is used where

| Need | Component | Use |
|---|---|---|
| Play, Next, Start cooking | Button, Filled, Giant, Marigold | The one main action on a screen |
| Quiz answers | Button, Outline, Large, stacked | Three per question. A selected state on tap, never red |
| Paati in speech bubbles | Avatar, Image, XXXL (96) | Her portrait. Full-body art is used on story screens |
| Paati's explanations | Alert: Success, Info, Warning | Success for correct, Info for hints, Warning for a gentle correction |
| Chapter progress | Page Control, 4 dots | Each dot is a small diya that lights up when the chapter is done |
| Question progress | Progress Bar | Fills with gold as questions are answered |
| Header on every screen | Navbar Top | Back on the left, title in the middle, help on the right |
| Ingredient labels in the Store | Badge & Chip | A Collected chip in Success style |
| Ingredient notes | Tooltip | Paati's one-line note when a container is tapped |
| Reasons on the result screen | List | One row each for dough, twist and fry |
| Recap on the finale | Card, Vertical | Three things the player learned |
| Make more or finish | Button Group | Make more muruku (Filled) and Finish (Outline) |
| Sound and captions | Toggle | In settings |
| Language | Dropdown | In settings |
| Waiting while frying | Loader | Restyled as a flickering diya |
| Help and settings | Action Sheet | Opened from the header |

### The Deepavali layer

| Motif | Where | Treatment |
|---|---|---|
| Kolam line pattern | Card and pop-up corners, dividers, Loader | Thin gold or Rani pink lines, never behind text |
| Marigold garland | Top edge of the Title and Finale screens | A row of Marigold and Yellow flowers |
| Diyas | Page Control, quiz rewards, Loader | The flame turns on when something is completed |
| Mango-leaf toran | Above the kitchen door on the Cook screen | Green leaves on a Marigold string |
| Silk-border trim | Header and pop-up edges | Two thin gold lines with a Marigold or Rani pink band |
| Mango (paisley) pattern | Backgrounds on cream screens | Very low contrast, so text stays clear |
| Sparkles and fireworks | An ingredient earned, the finale | Short bursts, switched off when Reduce motion is on |

### Mood by chapter

| Screen | Background | Accents |
|---|---|---|
| Title and Finale | Night indigo (Primary 900) with lamp glow | Gold, Marigold, fireworks |
| Chapter 1, Deepavali | Night indigo (Primary 800) | Gold lamps, kolam |
| Chapter 2, muruku | Cream (Yellow 50) | Marigold |
| Chapter 3 and free kitchen | Warm kitchen cream with the wood browns of the press | Marigold, wood brown |
| Chapter 4, meaning | Soft Rani pink wash (light tint) | Rani pink, gold |

> **Update, 20 Oct 2026:** The night-indigo screens (Title, Welcome, chapter 1 and Finale) are now **off-white**, with bright Deepavali colour around Paati: a marigold-and-gold sunburst, twinkles, and a colourful doorstep kolam with lit diyas. Indigo stays as an accent, for example the title text and the centre of the kolam.

### Style rules

- Flat 2D shapes with soft texture. No realistic photography.
- The whole game is 2D: side-on scenes for Paati's story, the quiz and the Store, and top-down views for the mixing bowl and frying pan. No 3D models, camera moves or perspective.
- Colour is used boldly: each screen has one dominant colour (night or cream) plus Marigold and gold. Keep other hues to illustrations.
- Setting and props: a family kitchen with brass and steel vessels, the wooden muruku press, a banana leaf, diyas on the windowsill and a kolam at the door. The Store shelves fill up as the player answers questions.
- Motion feels tactile: dough squishes, oil bubbles, the press turns. Keep animations short.
- Every interactive element uses the system's states (hover, focus, press, disabled), with a clearly visible focus state.

## Audio

- Soft instrumental background (flute, veena or similar), quieter during cooking.
- Real kitchen sounds as feedback: dough, sizzling oil, the clink of a steel tin lid.
- Paati's voice for key lines, with every line also shown as text.
- Sound can be switched off, and nothing essential is communicated by sound alone.

## Accessibility and cultural care

A game for all ages must be playable by young children and older adults, and must treat the tradition with accuracy and respect.

### Accessibility

- Touch targets at least 48 px, with an alternative to the twist gesture (tap and hold) for players who cannot draw smoothly.
- Stars always come with words, and colour is never the only signal.
- Adjustable text size, captions for every spoken line, and a sound-off mode.
- There are no timers and no way to lose, so players can take their time.
- Quiz wording at a reading level a primary-school child can follow.

### Cultural care

- Have Tamil-speaking home cooks review the recipe steps, the Tamil words and every quiz answer before launch.
- Present the recipe as Paati's version, since families make muruku differently.
- Deepavali is celebrated in different ways across communities and regions. Phrase facts as "many families" unless they are universal.
- Keep Paati warm and dignified, never a caricature.
- Mention that muruku may contain sesame, and remind younger players that hot oil needs an adult in real life.

## Success measures

The game succeeds if players learn something and finish the journey. Track these, and set targets after the first playtests.

| Measure | What it tells us |
|---|---|
| Players who finish all four chapters | Whether the journey is short and engaging enough |
| Questions answered correctly first time, by chapter | Whether Paati's stories prepare players for the questions |
| Players who can say what muruku means afterwards | Whether the game teaches |
| Stars on the finished muruku | Whether the cooking steps are clear and fair |
| Playtest comments from children and from grandparents | Whether it works across ages and feels true to the tradition |
| Players who choose to make more muruku, and how many they make | Whether the cooking itself is fun enough to keep playing |

## Open questions

Each one is tracked as a GitHub issue with the `question` label.

1. **Tech and platform.** What are you building with (for example Unity, Godot, a web game, or a Figma prototype), and is it mobile, web or both? This affects touch controls and the twist gesture. *(Decided 2026-10-19: web game in Phaser 3, playable in phone, tablet and desktop browsers.)*
2. **Length.** The brief targets about 10 to 15 minutes. Is that right for your audience?
3. **Free kitchen.** Should the free kitchen have an end, for example a fixed number of muruku, or can players cook as long as they like? Should the plate of finished muruku be saved between visits?
4. **Flour and oil.** "Flour" is not specific. The brief assumes plain flour. Frying oil is not one of the ingredients, so the pan is simply ready with hot oil. Confirm both.
5. **Recipe.** Which family recipe will supply the real amounts for Paati's recipe card?
6. **Content.** Who writes and reviews Paati's stories and the 8 quiz questions? The examples here are drafts.
7. **Saving.** Is any saving needed, for example resuming if a player quits halfway?
8. **Launch window.** Deepavali 2026 falls on or around 8 November (please confirm the date). That decides how much can be built for the first release.
