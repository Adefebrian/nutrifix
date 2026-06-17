# Nutrifix — "Fresh Garden" UI/UX redesign

**Date:** 2026-06-17
**Status:** Approved (visual brainstorm), implementing
**Scope:** Frontend visual overhaul only. No logic, data, API, or routing changes.

## Goal

Replace the dated coffee-toned minimalism with a fresh, light, friendly nutrition
aesthetic. Keep the (genuinely good) bones — CSS-variable token system, 8px spacing
grid, Framer Motion — and re-skin them. Make it look premium and on-genre for a
health/nutrition product.

## Decisions (locked with user)

- **Direction:** Fresh Garden — greens + lime, clean whites, energetic.
- **Scope:** Everything — hero, all 3 views (Food Finder, Recipe Builder, Meal Planner),
  Settings modal, topbar/nav, footer, all shared components.
- **Dark mode:** Light only.
- **Feel:** Soft & friendly — rounded corners, pill buttons, gentle green-tinted shadows, airy.
- **No "AI-guided nutrition" marketing badge.** Functional AI (ranking, recipe/plan
  generation) stays; no AI-positioning badge in the hero.

## Design system

### Palette
| Role | Hex |
|------|-----|
| Forest ink (text/dark) | `#16241A` |
| Pine (deep green / secondary) | `#1F5A2C` |
| Primary green (actions) | `#2E9E4F` |
| Lime pop (energy / AI gradient) | `#84CC16` |
| Soft mint (chip-on, fills) | `#E8F3DC` / `#DFF3D4` |
| Page wash (body bg) | `#EEF6E3` |
| Card | `#FFFFFF` |
| Border | `#E2ECD9` |
| Ink soft / faint | `#52685A` / `#8AA08E` |

### Macro color system (consistent across all views)
- Protein `#16A34A` · Carbs `#F59E0B` · Fat `#FB7185`

### Typography
- Display / headings: **Fraunces** (soft serif, kept).
- UI / body: **Plus Jakarta Sans** (friendly geometric — replaces Inter).

### Shape & depth
- Radii: `--r-sm 12 / --r 18 / --r-lg 24 / --r-xl 30`. Pill buttons (99px).
- Soft green-tinted shadows. 8px spacing grid retained.

### Buttons
- `.btn-primary` — solid green, white text (main CTAs).
- `.btn-accent` — lime→green gradient (AI "magic" actions).
- `.btn-ghost` — white, green-tint border, green text.

## Implementation approach

Token-layer rewrite cascades most of the change:

1. **`src/index.css`** — rewrite `:root` tokens to Fresh Garden values (keeping legacy
   var names aliased so existing class/inline refs keep resolving), new body gradient,
   button restyle, focus rings, scrollbar, selection.
2. **`src/components.css`** — re-skin every component class to fresh palette + soft radii;
   modernize the hero art (mint orbit, green-gradient core, lime glow) in place of the
   coffee bean-ring.
3. **`index.html`** — swap fonts (Plus Jakarta Sans + Fraunces), title, favicon (🥗),
   description.
4. **`src/components/ui.jsx`** — recolor MacroRow/MacroBar/NutriScore to the green/amber/
   rose macro system.
5. **`src/App.jsx`** — fresh hero copy; hero art re-skinned via CSS (structure kept).

View JSX (FoodFinder/RecipeBuilder/MealPlanner/SettingsModal) needs little/no change —
they consume classes that get restyled centrally.

## Out of scope
Dark mode, new features, data/API/logic changes, routing, copywriting beyond hero.

## Verification
- `npm run dev`, load app, screenshot each view (find/recipe/plan) + settings modal.
- Check: contrast (text on green/mint), focus states, mobile breakpoints, reduced-motion.
- Adversarial design QA pass (consistency, a11y, responsive, motion, code correctness).
