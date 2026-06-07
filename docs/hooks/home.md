# Home — Hook Contract

The home page is the landing page. It has **no measurement** of its own. It exists to route the visitor to `/info/` or `/stability/`.

## Required DOM

None. The page works without any Libreprobe JS imports.

## Optional imports

- `src/ui/navigation.js` — sidebar/hamburger. Wire it up if you have a `.nav-hamburger` and `.nav-sidebar` on the page.

## Styling

Yours. The default look is dark with `--bg-1`, `--tx-*`, `--ac-*` CSS variables defined in the production site. Reference values:

- `--bg-1: #0d0d0d` (page background)
- `--tx-3: #bbbbbb` (text)
- `--ac-3: #6daa55` (accent green)
- `--tx-5: #777777` (muted)
