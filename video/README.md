# Paati's Recipe: the playthrough video

This folder turns the game into a video, kept apart from the game itself: nothing in here changes the game's files,
and it lives on the `video` branch. The game plays itself from the Title to the goodbye, as a careful player would:
it types the name Meena, answers the quizzes (one wrong answer first, to show Paati's nudge), watches the Rama story,
cooks a perfect muruku through all seven kitchen steps, lets Paati taste it, and says goodbye. A finger dot shows every
tap, drag, swirl and hold. Every line stays up long enough to read.

## The videos

In `out/` (on this computer only; see "What's in git" below):

- `paatis-recipe-playthrough.mp4`: the whole game, 11 min 39 s (268 MB).
- `clips/`: the same, one clip per part of the game, to trim, reorder or leave out when editing (286 MB in all,
  a little sharper than the full video):

| Clip | What happens | Length |
|---|---|---|
| `01-title` | Happy Deepavali, the title, Paati's vanakkam, Play | 13 s |
| `02-welcome` | Paati's welcome; the name Meena typed in | 27 s |
| `03-before-we-begin` | Let us make muruku, word by word | 11 s |
| `04-chapter-1-story` | Paati's Deepavali stories: the kolam, Deepavali medicine, the diyas | 71 s |
| `05-chapter-1-quiz` | Three questions (a wrong answer first on the kolam), three ingredients earned | 52 s |
| `06-stories-of-deepavali` | The shadow puppet show: Rama comes home | 98 s |
| `07-store` | The Store, 3 of 6, rice flour tapped | 9 s |
| `08-chapter-2-story` | Paati's muruku stories | 54 s |
| `09-chapter-2-quiz` | Three questions, including putting the steps in order | 42 s |
| `10-store-full` | All six on the shelves | 5 s |
| `11-chapter-3-story` | Time to cook | 16 s |
| `12-store-start-cooking` | Start cooking | 5 s |
| `13-kitchen` | Add, Mix, Water, Knead, Fill the press, Twist, Fry, with Paati's questions | 3 min 12 s |
| `14-your-muruku` | Perfect muruku, 99 out of 100 | 9 s |
| `15-chapter-4-story` | Why muruku at Deepavali | 41 s |
| `16-chapter-4-quiz` | Two last questions | 28 s |
| `17-paati-tastes-it` | Offer to Paati: the crunch, and her thanks | 11 s |
| `18-what-next` | Well done, Meena! What next? Finish | 7 s |
| `19-goodbye` | Happy Deepavali, goodbye | 8 s |

All are 1920 × 1080, 30 frames a second, H.264 MP4, so any editor opens them (iMovie, CapCut, DaVinci Resolve,
Descript, Premiere…). The game has no sound yet, so the videos are silent: add music or a voice-over when editing.
Each clip starts just as its screen fades in, so they join cleanly in order.

## Recording it again

After changing the game, or the recorder, make the video again:

1. `python3 video/tools/record_server.py` (it serves the game and saves the frames).
2. Open http://localhost:8001/video/record.html and press **Record**. Leave the tab open and in front until it says
   done (about 8 minutes on this Mac). The frames go to `frames/<clip>/`, about 5 GB.
3. `sh video/tools/make-videos.sh` makes the clips and the full video in `out/` (a few minutes). To redo one clip's
   MP4 from its frames: `sh video/tools/make-videos.sh 13-kitchen`.
4. Delete `frames/` when the videos are made, to free the space.

## Changing what it does

At the top of `record/driver.js`:

- `READ_BASE` and `READ_PER_CHAR`: how long each line stays up (now 1.2 s plus a second for every 16 letters).
- `PICKS`: which quiz questions are asked in each chapter. `WRONG_FIRST`: which ones get a wrong answer first.
- `PLAYER_NAME`: the name typed on the Welcome page. `STORY_TO_WATCH`: the puppet story (pandavas, rama or krishna).
- `PLAN`: the clips, in order, and what happens in each. The functions below it are each part of the game.

## How it works

- `record.html` loads the game (`/index.html`, untouched) in a 1280 × 720 frame and, as soon as the game exists,
  loads `record/driver.js` into that frame, so the recorder uses the game's own modules.
- `record/driver.js` puts the game's own clock to sleep and steps it by hand, one frame at a time, so every frame is
  captured however long saving takes, and the video runs at the game's true speed. It presses the game's own
  buttons and gestures (the same code a tap runs), draws the finger dot and the name box (a real text box over the
  game, which the game's canvas doesn't include) onto each frame, and sends the frame to the server.
- `tools/record_server.py` serves the repository and writes each frame to `frames/<clip>/`.
- `tools/encode.swift` turns frames into an MP4 with the Mac's own video encoder (AVFoundation), so nothing has to be
  installed. `tools/make-videos.sh` builds it (finding an SDK that matches the Swift compiler) and runs it.

## What's in git

The recorder, the tools and this README. The frames and the videos are in `.gitignore`: they are too big for git
(GitHub refuses files over 100 MB), so they stay in this folder on this computer. To share the video, upload the MP4
from `out/` (YouTube, Google Drive, or GitHub Releases, which allows files up to 2 GB).
