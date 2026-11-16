# Substitute Chaos

A browser-based deck-building card game where you play a teacher trying to survive the school day. Fight classroom chaos with classroom supplies, one location at a time, until the final bell rings.

Built by Erik Porter, Aaron Villalobos, Jonathan Chavez, Landry Vewenda, and Malachi Mooty for CS39AH (AI as Software Development Teammate) at MSU Denver, Fall 2026.

## Play

**https://cs39ah.github.io/cardgame/**

Open the link in a browser. No install, no login, no account. Click anywhere on the start screen to turn on sound. Your progress saves automatically in your browser.

### Performance tip: turn on graphics acceleration

The battle screen uses a lot of animation (flying cards, zooming, blur effects). With your browser's graphics acceleration turned off, the game can stutter or lag. Turning it on makes it run much smoother.

- **Chrome:** Settings → System → turn on **Use graphics acceleration when available** → click **Relaunch**
- **Edge:** Settings → System and performance → turn on **Use graphics acceleration when available** → Restart
- **Firefox:** Settings → General → Performance → uncheck **Use recommended performance settings** → check **Use hardware acceleration when available** → restart Firefox

Still choppy? Open **Settings** (the ⚙️ button) and turn on **Reduce animations**.

## How to Play

New to the game? Start with **How to Play** on the title screen. It walks you through the rules, then drops you into a practice fight against the Class Clown.

### Your day

1. **Pick a teacher.** There are six: the Substitute Teacher, Janitor, Lunch Lady, Gym Teacher, Librarian, and Principal. Each one has their own starting deck, Sanity, Coffee, and Teacher Ability. Their **Personnel File** shows all of it before you clock in.
2. **Work through the school.** The day map has six locations: Homeroom, Hallway Patrol, Cafeteria Duty, Gym Class, the Library, and the Principal's Office. They unlock one at a time.
3. **Clear each location's zones.** Every location has three zones: two fights and a boss. Beat a zone to unlock the next one.
4. **Build your deck.** After each win you pick 1 of 3 new cards. Zone 1 rewards are Uncommon, zone 2 rewards are Rare, and bosses drop Legendaries. Your deck carries over from fight to fight.
5. **Face the Principal** in the final fight to finish the day.

### In a fight

- **🧠 Sanity** is your health. Hit 0 and you walk out of class. Bring the enemy's Sanity to 0 to win.
- **☕ Coffee** is your energy. You get 3 or 4 each turn depending on your teacher, and cards cost Coffee to play.
- **😌 Relaxation** blocks damage, but only lasts until your next turn.
- You draw **5 cards** each turn. Play what you can, then hit **End Turn**.
- **Defense cards** like Backpack Wall put defenders on your field. Enemy attacks hit your defenders first, then your Relaxation, then you.
- **Power cards** stay in play in your Powers zone and keep working for the rest of the fight.
- **Confiscated** cards are removed for the rest of the fight after you play them.
- **Your Teacher Ability** can be used once per fight. It costs Coffee like a normal card.
- The enemy shows the card it will play next turn, so plan around it.

### Saving

The game autosaves after every win and every reward pick (look for **Saved ✓** in the corner). You get **3 save slots**. **Continue Your Day** on the title screen opens your Save Files, where you can load or delete a save. Saves live in your browser, so clearing your browser data erases them.

## Screens

| Screen | What it does |
|---|---|
| Title | Pick a teacher, start a new day, or continue |
| Personnel File | Your teacher's stats, ability, bio, and starting deck. Clock In starts the day |
| Save Files | Three save slots: continue or delete |
| How to Play | Rules walkthrough and a practice fight |
| Day Map | The six locations of the school day |
| Zone Map | The three zones inside a location |
| Battle | The card fights |
| Cards | Every card in the game, by location and rarity |
| Credits | The team and asset credits |

## Running It Locally

The game loads each screen from the `screens/` folder, so it has to run from a local server. Opening `index.html` by double-clicking won't work.

- **VS Code:** install the **Live Server** extension, right-click `index.html` → **Open with Live Server**
- **Or with Python:** run `python -m http.server` in the repo folder, then open `http://localhost:8000`

**Testing tip:** to play any location or zone in any order, set `SC.UNLOCK_ALL_NODES = true;` in `js/ui/map.js`. Set it back to `false` before you commit.

## Project Structure

```
index.html              Single page; every screen loads into #screen
styles.css              All styles, one section per screen
screens/                HTML for each screen (battle, cards, credits, map, saves,
                        teacher, tutorial, zones)
js/main.js              Router: switches screens based on the URL hash (#cards, #battle, ...)
js/audio.js             Sound effects (Web Audio) and menu music
js/content/             Game data: cards, enemies, levels, days, teachers, credits
js/engine/combat.js     Battle rules only, no drawing
js/engine/save.js       The save system: the only file that reads or writes saves
js/ui/                  Drawing: cards, battle screen and animations, day map,
                        zone maps, teacher profile, save files, settings, tutorial
graphics/               Card art, location maps, backgrounds, textures
audio/                  Music
```

**Adding a card:** add an entry to `js/content/cards.js` and its art to `graphics/cards/<location>/`. Image filenames must be all lowercase, because GitHub Pages is case-sensitive. Rarity must be one of `Common`, `Uncommon`, `Rare`, `Legendary`, or `Enemy`.

**Adding an enemy:** add it to `js/content/enemies.js` with a deck of card ids, then point a level at it in `js/content/levels.js`. Every id in the deck has to match a card in `cards.js` exactly, or the game skips it.

**Zone rewards:** give a zone its own reward cards with `rewards: ['id', 'id', 'id']` in `levels.js`, and mark those cards `rewardOnly: true` so they don't show up in random rewards. Boss rewards go in `bossRewards` in `js/engine/combat.js`.

**Saving:** never use `localStorage` directly. Use `SC.save.load()` and `SC.save.update({ ... })` from `js/engine/save.js`.

## Working on the Code

`main` is the live site and `dev` is where finished work comes together. Nobody pushes to either directly.

1. Make a branch off `dev` for your task (for example `gym-enemy-art`).
2. Before opening a PR, run `git fetch origin` and `git merge origin/dev` on your branch, so conflicts show up on your branch first.
3. Open the PR into **`dev`**. Check the base dropdown on GitHub.
4. When `dev` is tested and working, it gets one PR into `main` to update the live site.

Keep branches small and merge often. Don't delete a branch until it's merged.

## Tech

Vanilla HTML, CSS, and JavaScript. No frameworks, no build step. Hosted on GitHub Pages. Saves use the browser's `localStorage`.

## License

MIT. See [LICENSE](LICENSE).