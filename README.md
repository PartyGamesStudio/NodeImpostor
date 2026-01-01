# NodeImpostor

Mobile-friendly party game where one impostor only sees rotating hints while everyone else knows the secret word. Runs entirely in the browser with touch gestures, category filters, and extensible word packs.

## Features
- Long-press reveal button with pointer capture and context-menu guard for mobile play
- Category filter (Alltag, Natur, Technik, Kreativ, Medien, Personen)
- Randomized hint selection per impostor to reduce meta-gaming
- Impostor role avoids repetition across rounds
- Player list & category preference persisted via `localStorage`
- Language-ready word-pack loader (`public/words/<lang>/…`)

## Getting Started
```bash
npm install
npm run dev          # or node server.js, depending on your setup
```
Open `http://localhost:3000` (or the port your server prints). You can also serve the `public/` directory with any static web server.

## Project Layout
```
public/
  app.js             # main game logic (ES module)
  index.html         # single-page UI, loads app.js as module
  styles.css
  words/
    index.js         # picks language via <html lang="…"> and loads the pack
    de/
      base.js        # core German vocabulary
      media.js       # film titles, props, actors
      persons.js     # general/celebrity names
```

## Adding New Word Packs
1. Create a folder `public/words/<new-language>/`.
2. Add the desired pack files (e.g., `base.js`, `media.js`…) that `export default` arrays of entries `{ word, hints, difficulty, category }`.
3. Create `public/words/<new-language>/index.js` to merge those arrays and export the final list.
4. Register the new language in `public/words/index.js` by mapping the ISO code (e.g., `en`) to `() => import("./en/index.js")`.
5. Set `<html lang="<new-language>">` or update the loader to select it via UI/localStorage.

## Contributing & License
Pull requests are welcome—please keep categories consistent and provide at least three hints per word to maintain game balance.

Licensed under the [MIT License](LICENSE).
