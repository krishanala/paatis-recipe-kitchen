# Voice-over for Paati

The game is ready for recorded voice-over, but has none yet. Every line Paati says goes through one hook (`speak()` in [`src/voice.js`](../src/voice.js)), and her speech bubble always shows the words, so the captions stay whether or not there's a recording.

## How a recording is found

Each line has a **key**: a short code worked out from its exact text (for example `1x3k9qz`). [`assets/voice/lines.json`](../assets/voice/lines.json) maps keys to sound files in `assets/voice/`:

```json
{
  "1x3k9qz": "welcome-01.mp3",
  "0f8a2lm": "welcome-02.mp3"
}
```

When Paati says a line that has a file, it plays (only when Sound is on). A line without a file stays silent. A new line plays over the last one, and leaving a screen stops it.

## Getting the script

Open the game, then in the browser console run:

```js
copy(JSON.stringify(muruku.voiceScript(), null, 2))
```

That copies every line Paati can say, in the order players meet them, each with its `where`, `key` and `text`. Give the voice artist the `text` column, and name each file however you like. Then list `key → file` in `lines.json`.

## Before recording

- **The key belongs to the exact words.** If a line is rewritten, its key changes and its old recording stops playing. Lock the script (after the cultural review) before booking the session.
- **Lines with names in them** (such as "Next: urad dal flour.") are listed once for each name, so each needs its own recording.
- **Short lines for the free kitchen.** Many kitchen lines also have a short version, which the script lists separately.
- **Pace:** Paati is warm and a little dry. The jokes land best said lightly, never as a punchline.
