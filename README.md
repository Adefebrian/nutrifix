# Nutrifix

Fresh, AI-powered nutrition workspace. Find the most suitable foods by their numbers, build balanced recipes, and plan a full week, in one calm UI.

## Features

- **Find Food**: search 600k+ real foods (USDA FoodData Central), see per-100g macros plus a calorie-split bar, then **AI-rank** them for a goal (lose weight, build muscle, low carb, heart healthy).
- **Recipe Builder**: add ingredients, dial grams with live macro totals and per-serving math, then let AI write the full method (steps, time, difficulty, chef tips).
- **Meal Plan**: pick a program (fat loss / maintain / lean bulk / endurance) and diet, and AI lays out a 7-day plan. Tap any meal to push it into the recipe builder.

## Stack

- **React 18 + Vite**, **Framer Motion** (page transitions, layout animations, micro-interactions), **lucide-react** icons.
- **Food data:** [USDA FoodData Central](https://fdc.nal.usda.gov/), free and CORS-clean. `DEMO_KEY` works out of the box; add your own free key for higher limits.
- **AI:** [OpenCode Zen](https://opencode.ai/zen), OpenAI-compatible. Defaults to a **free** model (`deepseek-v4-flash-free`); switch models in Settings.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Keys

Open **Settings** (top right) and paste:

1. **OpenCode Zen API key**: get one free at <https://opencode.ai/auth>. Required for AI features (ranking, recipes, plans). Stored in `localStorage` only, never bundled or committed.
2. **USDA Food API key** *(optional)*: blank uses `DEMO_KEY`; a free key at <https://fdc.nal.usda.gov/api-key-signup.html> lifts rate limits.

## Production / deployment

AI calls are proxied so the browser never hits a CORS wall and no server key is stored:

- **Dev:** Vite proxies `/api/zen/*` to OpenCode Zen (see `vite.config.js`).
- **Prod (Vercel):** the serverless function `api/zen/[...path].js` does the same. The user's own key (bring-your-own-key) is forwarded from the client; nothing is stored or logged server-side.

Deploy on Vercel with zero config (framework preset: Vite). The `api/` directory becomes serverless functions automatically.

## Credits

Made by Brian. IG [@brianeedsleep](https://instagram.com/brianeedsleep) · [github.com/adefebrian](https://github.com/adefebrian) · [adefebrian.com](https://adefebrian.com)
