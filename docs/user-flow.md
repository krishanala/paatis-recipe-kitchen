# User flow

The journey is one straight path through four chapters, followed by an optional free kitchen. Screen numbers match the [Screens table](design-brief.md#screens). Scene names match the files in [`src/scenes/`](../src/scenes).

```mermaid
flowchart TD
    T["1 · Title<br/>Play · Sound · Help"] --> W["2 · Paati's story<br/>Welcome"]
    T -. Help .-> S(["Settings action sheet<br/>sound · captions · text size · language"])

    W --> I["Before we begin<br/>a plate of muruku · words one at a time · Start Chapter 1"]
    I --> C1["2 · Story<br/>Ch 1: What is Deepavali?"]
    C1 --> Q1["3 · Quiz ×3<br/>earns rice flour, urad dal flour, flour"]
    Q1 --> ST1["4 · Store<br/>3 of 6 collected"]

    ST1 --> C2["2 · Story<br/>Ch 2: What is muruku?"]
    C2 --> Q2["3 · Quiz ×3<br/>earns spices, ghee, water"]
    Q2 --> ST2["4 · Store<br/>6 of 6 collected"]

    ST2 --> C3["2 · Story<br/>Ch 3: How is it made?"]
    C3 --> ST3["4 · Store<br/>Start cooking"]
    ST3 --> K["5 · Cook<br/>Add → Water → Knead → Fill press → Twist → Fry"]
    K --> R["6 · Result<br/>stars + score /100 + one-line reasons"]

    R --> C4["2 · Story<br/>Ch 4: Why muruku at Deepavali?"]
    C4 --> Q4["3 · Quiz ×2<br/>no rewards"]
    Q4 --> F["7 · Finale<br/>Let Paati taste it: offer · bite · happy tears · thank you · Next"]
    F --> C["7 · Last page<br/>Make more muruku · Finish"]
    C -- Finish --> G["7 · Finale<br/>Paati's goodbye"]

    C -- Make more muruku --> FK["4 · Store (always full)<br/>Deepavali fact"]
    FK --> K2["5 · Cook<br/>shorter hints"]
    K2 --> R2["6 · Result<br/>Make another · Finish"]
    R2 -- Make another --> FK
    R2 -- Finish --> G
```

## Rules that shape the flow

| Rule | Where it applies |
|---|---|
| A wrong answer is never a dead end: Paati explains, the choice is set aside, and the player tries again | Quiz (all chapters) |
| Stories are two short lines each, read with Next | Story |
| Before we begin shows its words one at a time at reading pace, then Start Chapter 1. A tap or key press shows it all at once | Intro |
| Each correct answer in chapters 1 and 2 earns one ingredient, which flies into the Store | Quiz → Store |
| Chapter 4 answers earn nothing | Quiz (chapter 4) |
| Paati asks first and explains after. Stories are short hooks that don't give answers away | Story, Quiz |
| Paati asks one question at the start of five cooking steps; right first time unlocks her tip for that step (no penalty otherwise) | Cook (not the free kitchen) |
| Start cooking only appears once all six ingredients are collected | Store |
| Every muruku is served: no fail state, no timers | Cook → Result |
| In the free kitchen the Store is always full, and there is no quiz, shop or points | Free kitchen |
| Help opens settings from the header on every screen, and from the Title | All screens |
| A right answer sends up firecrackers (two or three stars do too) | Quiz, Result |

## Edge cases to design for

| Case | Expected behaviour |
|---|---|
| Player taps Back mid-chapter | Returns to Title. Play reads Continue and resumes at the start of the current screen (progress is kept for the session; saving between visits is open question 7) |
| Player answers wrong repeatedly | Each wrong choice is dimmed after Paati's hint, and the choices pause until Try again. The wrong ones stay dimmed, so the right answer is always within reach |
| Player adds an ingredient in the wrong order | Paati gently names the right one; the ingredient goes back to the shelf and the order score drops |
| Player pours too much water | Paati calls "Too much!" as it passes the green zone, and the water in the meter turns amber. Water can't be taken out. The dough score drops and Paati says why on the Result screen |
| Player can't draw a smooth spiral | "Tap and hold" alternative draws a steady spiral while held |
| Player lifts without flipping | The muruku is still served; Paati notes one side is pale |
| Sound is off | Every spoken line is already on screen as text |
| Reduce motion is on | Sparkles, fireworks and the flying ingredient are replaced by a simple fade. Before we begin shows all its words at once. When Paati tastes the muruku, her pictures change in place without movement |
