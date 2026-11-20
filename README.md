# Ship Radar

Ship Radar is a live repository discovery tool for developers. It ranks GitHub projects using signals that indicate practical usefulness: release pulse, issue health, and community momentum.

## Why it exists

GitHub Trending mostly treats raw star growth as discovery. That misses projects with good maintenance, active releases, healthy issue discussions, or a poor fit for a developer's stack.

Ship Radar is built around a different question: **is this repository safe and useful to evaluate now?**

## MVP features

- Live GitHub repository search
- Time and language filters
- Ranked repository detail view
- Release, issue, and momentum scoring
- Five-minute refresh behavior
- Preview mode when GitHub is rate limited or unavailable
- Responsive mobile layout
- Empty search state

## Ship Score

The MVP score is transparent and reproducible:

- 40% release pulse
- 25% issue health
- 35% community momentum

The score should not be presented as a quality guarantee. It is a prioritization aid for manual review.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite.

## Build

```bash
npm run build
npm run preview
```

## Growth plan

1. Ship a read-only MVP that works without authentication.
2. Publish public demo data or screenshots and one documented use case.
3. Ask developer communities for one missing signal, not general feedback.
4. Add watchlists, signed-in alerts, RSS feeds, and optional GitHub API tokens.
5. Publish a public methodology and API so the ranking can be inspected.
6. Build integrations as developer demand appears: VS Code, CLI, MCP, Slack, and Linear.

## Unique expansion ideas

- A VS Code command that ranks repositories based on a project's package manifest.
- A repository comparison view for choosing between alternatives.
- Watch-only alerts for maintainer response, first release, or issue backlog changes.
- Reproducible score exports for engineering teams.

## Deploy

Any static host works. For GitHub Pages, configure the repository owner and branch in a static deployment workflow. For Vercel or Netlify, use `npm run build` and `dist` as the output directory.
