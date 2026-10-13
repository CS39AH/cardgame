# Substitute Chaos

A browser-based deck-building card game where you play a substitute teacher trying to survive the school day. Fight classroom chaos with classroom supplies until the final bell rings.

Built by Erik Porter, Aaron Villalobos, Jonathan Chavez, Landry Vewenda, and Malachi Mooty for CS39AH (AI as Software Development Teammate) at MSU Denver, Fall 2026.

## Play

**https://cs39ah.github.io/cardgame/**

Open the link in a browser. No install, no login, no account. Click anywhere on the start screen to turn on sound.

### Performance tip: turn on graphics acceleration

The battle screen uses a lot of animation (flying cards, zooming, blur effects). With your browser's graphics acceleration turned off, the game can stutter or lag. Turning it on makes it run much smoother.

- **Chrome:** Settings → System → turn on **Use graphics acceleration when available** → click **Relaunch**
- **Edge:** Settings → System and performance → turn on **Use graphics acceleration when available** → Restart
- **Firefox:** Settings → General → Performance → uncheck **Use recommended performance settings** → check **Use hardware acceleration when available** → restart Firefox

## How to Play

Start with **How to Play** on the title screen. It walks you through the rules, then drops you into a practice fight against the Class Clown.

- **🧠 Sanity** is your health. Hit 0 and you walk out of class. Bring the enemy's Sanity to 0 to win.
- **☕ Coffee** is your energy. You get 3 each turn, and cards cost Coffee to play.
- **😌 Relaxation** blocks damage, but only lasts until your next turn.
- You draw **5 cards** each turn. Play what you can, then hit **End Turn**.
- **Defense cards** like Backpack Wall put defenders on your field. Enemy attacks hit your defenders first, then your Relaxation, then you.
- **Power cards** stay in play in your Powers zone and keep working for the rest of the fight.
- **Confiscated** cards are removed for the rest of the fight after you play them.
- **Your teacher card** has an ability you can use once per fight. It costs Coffee like a normal card.
- The enemy shows the card it will play next turn, so plan around it.

## Screens

| Screen | Status |
|---|---|
| Title + teacher select | Done |
| How to Play (tutorial + practice fight) | Done |
| Cards (browse every card by rarity) | Done |
| Credits | Done |
| Day map | In progress |
| Battle | Playable, more enemies and effects coming |

## Running It Locally

The game loads each screen from the `screens/` folder, so it has to run from a local server. Opening `index.html` by double-clicking won't work.

- **VS Code:** install the **Live Server** extension, right-click `index.html` → **Open with Live Server**
- **Or with Python:** run `python -m http.server` in the repo folder, then open `http://localhost:8000`

## Project Structure

```
index.html            Single page; every screen loads into #screen
styles.css            All styles, one section per screen
screens/              HTML for each screen (battle, cards, credits, map, tutorial)
js/main.js            Router: switches screens based on the URL hash (#cards, #battle, ...)
js/audio.js           Sound effects (Web Audio) and menu music
js/content/           Game data: cards, enemies, levels, days, credits
js/engine/combat.js   Battle rules only, no drawing
js/ui/                Drawing: cards, battle screen, battle animations, map, tutorial
graphics/             Card art, backgrounds, chalkboard and desk textures
audio/                Music
```

**Adding a card:** add an entry to `js/content/cards.js` and its art to `graphics/cards/`. Image filenames must be all lowercase, because GitHub Pages is case-sensitive.

**Adding an enemy:** add it to `js/content/enemies.js` with a deck of cards, then point a level at it in `js/content/levels.js`.

## Working on the Code

`main` is the live site, so nobody pushes to it directly.

1. Big features get a feature branch off `main` (for example `tutorial`).
2. Each task gets its own small branch off the feature branch (for example `tutorial/called-out`).
3. Open the PR into the **feature branch**, not `main`. Check the base dropdown on GitHub.
4. Run `git merge origin/<feature-branch>` on your branch before opening a PR, so conflicts show up on your branch first.
5. When the feature works, the feature branch gets one PR into `main`.

Keep branches small and merge often. Don't delete a branch until it's merged.

## Tech

Vanilla HTML, CSS, and JavaScript. No frameworks, no build step. Hosted on GitHub Pages.

## License

MIT. See [LICENSE](LICENSE).