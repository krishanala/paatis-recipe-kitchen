# Paati's Muruku Kitchen — what's left in Paper

Paper file: **Paati's Muruku Kitchen — Game** (was "Quick meadow"). Work stopped on 2026-10-14 because Paper's weekly MCP limit was reached (it resets around 2026-10-17).

## Done
- **Foundations page**
  - Tokens for colour, type, spacing and radius
  - Colour and type boards
  - Buttons, HUD, Paati's speech bubble, answer-card states, stars and meters
  - Paati's 5 expressions, the 5 muruku outcomes, the press states and plates
  - Ingredients (your photos), jars, diya, kolam, banana leaf and garland
- **Screens page:** 01 Title and 02 Welcome tour (story 1 of 2).
- **Art:** 47 placeholder SVGs in `assets/art/`, used by the Paper file.

## Left to do
1. **03 Paati's kitchen.** This screen is half-built.
   - Its HUD still says "Cook · Batch 2". Rename it to "Paati's kitchen" and swap the home icon for Help.
   - Still to add: Paati with "What shall we make today?", the 4 doors (Quiz, Kadai, Store, Cook) and the jar shelf strip.
2. **02b Welcome tour, story 2:** "What is Deepavali?"
3. **03b Kitchen with an empty store:** Cook is dimmed and Paati points to the Kadai (edge case).
4. **04 Quiz:** question 2 of 3, 4 answer cards, Paati asking.
5. **05a Answer, right** (+10 points, Paati proud) and **05b Answer, not quite** (no penalty, Paati tells a short story).
6. **06 Kadai (shop):** 6 ingredient cards with prices (8 / 8 / 4 / 2 / 6, ghee 25 locked until level 3), quantity, and "basic batch = 28".
7. **07 Store:** the shelf wall, "Batches you can cook", the lowest ingredient glowing, a Kadai button on low stock, and Cook.
8. **08a–d Cook:** a recipe card beside each step.
   - 08a: add water (meter with a green zone)
   - 08b: fill the press (choose the star plate)
   - 08c: twist (spiral in the pan, with tap-and-hold as the alternative)
   - 08d: fry (colour meter, Flip and Lift)
9. **09 Muruku result:** stars with words, the score out of 100 (dough 40 / twist 30 / fry 30), one-line reasons, points, and Next muruku.
10. **10 Jar shelf:** completed jars, speed records and locked designs.
11. **11 Jar complete and level up:** speedy-jar bonus, unlocks, and Back to the kitchen.
12. **Settings overlay** (from Help): sound, text size, language, reset progress.
13. **User Flow page:**
    - First-visit path, then the main loop: kitchen → quiz → Kadai → store check → cook → score → jar check → jar complete
    - Each step labelled with its screen number
    - The edge-case table
14. **Last:** lay the screens out in flow order on the canvas.

To pick this up, open the Paper file and ask Claude to "continue the Muruku game in Paper".
