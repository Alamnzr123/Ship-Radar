# Ship Radar

Ship Radar helps developers find GitHub repositories worth evaluating. It ranks live repository search results using release activity, issue health, and community momentum instead of relying on star count alone.

## Features

- Live GitHub repository search
- Daily, weekly, and monthly discovery periods
- Language and text filters
- A reproducible Ship Score
- Persistent watchlist
- Side-by-side comparison of up to three repositories
- Shareable comparison links
- JSON exports for team discussions
- Responsive discovery interface
- Preview data when GitHub API access is unavailable

## Ship Score

The Ship Score is a prioritization aid, not a quality guarantee.

- 40 percent release pulse
- 25 percent issue health
- 35 percent community momentum

The calculation is visible in the interface and may change as the project matures. Public methodology and tests should accompany any future production scoring model.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The deployable static files are written to `dist`.

## Deploy

### GitHub Pages

1. Open repository Settings.
2. Open Pages.
3. Choose GitHub Actions as the deployment source.
4. Add a workflow that runs `npm ci`, `npm run build`, and uploads `dist`.
5. Set Vite's base path to `/Ship-Radar/` if the site is deployed at `https://alamnzr123.github.io/Ship-Radar/`.

### Vercel or Netlify

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

No environment secret is required for the current unauthenticated GitHub API preview. A GitHub token must not be placed in browser code. Future authenticated access requires a server or serverless proxy.

## Roadmap

The next useful release is a command-line tool that reads repository names and returns the same ranking signals as the web app. It should support JSON output and require no browser session.

After the CLI establishes a portable public interface, development will continue with:

- A VS Code extension for repository comparison
- Package manifest based recommendations
- Watchlist change notifications
- Reproducible methodology tests
- A public API for third-party integrations

## Repository visibility

The source is public at `https://github.com/Alamnzr123/Ship-Radar`.

## License

MIT License. Copyright (c) 2026 Alamnzr123.
