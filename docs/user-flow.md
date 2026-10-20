# User flow

The journey is one straight path through four chapters, followed by an optional free kitchen. Screen numbers match the [Screens table](design-brief.md#screens). Scene names match the files in [`src/scenes/`](../src/scenes).

```mermaid
flowchart TD
    T["1 · Title<br/>Play · Sound · Help"] --> W["2 · Paati's story<br/>Welcome"]
    T -. Help .-> S(["Settings action sheet<br/>sound · captions · text size · language"])

    W --> C1["2 · Story<br/>Ch 1: What is Deepavali?"]
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
    Q4 --> F["7 · Finale<br/>offer muruku · recap card · farewell"]

    F -- Make more muruku --> FK["4 · Store (always full)<br/>Deepavali fact"]
    FK --> K2["5 · Cook<br/>shorter hints"]
    K2 --> R2["6 · Result<br/>Make another · Finish"]
    R2 -- Make another --> FK
    R2 -- Finish --> G["7 · Finale<br/>Paati's goodbye"]
    F -- Finish --> G
```

## Rules that shape the flow

| Rule | Where it applies |
|---|---|
| A wrong answer is never a dead end: Paati explains, the choice is set aside, and the player tries again | Quiz (all chapters) |
| Each correct answer in chapters 1 and 2 earns one ingredient, which flies into the Store | Quiz → Store |
| Chapter 4 answers earn nothing | Quiz (chapter 4) |
| Start cooking only appears once all six ingredients are collected | Store |
| Every muruku is served: no fail state, no timers | Cook → Result |
| In the free kitchen the Store is always full, and there is no quiz, shop or points | Free kitchen |
| Help opens settings from the header on every screen, and from the Title | All screens |

## Edge cases to design for

| Case | Expected behaviour |
|---|---|
| Player taps Back mid-chapter | Returns to Title. Play reads Continue and resumes at the start of the current screen (progress is kept for the session; saving between visits is open question 7) |
| Player answers wrong repeatedly | Each wrong choice is dimmed after Paati's explanation, so the right answer is always reached in at most 3 taps |
| Player adds an ingredient in the wrong order | Paati gently names the right one; the ingredient goes back to the shelf and the order score drops |
| Player pours too much water | Water can't be taken out. The dough score drops and Paati says why on the Result screen |
| Player can't draw a smooth spiral | "Tap and hold" alternative draws a steady spiral while held |
| Player lifts without flipping | The muruku is still served; Paati notes one side is pale |
| Sound is off | Every spoken line is already on screen as text |
| Reduce motion is on | Sparkles, fireworks and the flying ingredient are replaced by a simple fade |
