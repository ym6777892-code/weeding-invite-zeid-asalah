# Shihab & Reem — Wedding Invitation

Put these files directly in the root of your GitHub repository (no folders):

```
index.html
style.css
script.js
MP3.mp3        ← your music file (exact name, capital MP3)
```

## Edit details
Open `script.js`. Everything is in `weddingData` at the top:
- `weddingYear`: add the year (e.g. `"2026"`) to show the year and turn on the live countdown. Until then the countdown stays hidden.
- `venueName` / `venueAddress`: empty on purpose; they appear automatically once filled.
- `mapsLink`: already set. The "Get Directions" button opens it.
- Texts for the announcement and message are in `announcementAr/En` and `messageAr/En`.

## Publish (GitHub Pages)
Repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
