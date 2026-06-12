# Create Ratio Calculator

Create Ratio Calculator is a static React/Vite production calculator for the Minecraft Create mod. It models recipes, machine throughput, RPM, Stress Units, byproducts, realistic efficiency, generator planning, and a visual React Flow production graph.

## Tech Stack

- Vite + React + TypeScript
- React Flow for graph visualization
- ELK.js for graph layout
- Zustand for state
- Tailwind CSS for styling
- Vitest for unit tests
- GitHub Pages static deployment

## Local Development

```bash
corepack pnpm install
corepack pnpm dev
```

Open the local URL printed by Vite.

## Build

```bash
corepack pnpm build
```

For GitHub Pages path handling:

```bash
$env:GITHUB_PAGES="true"; corepack pnpm build
```

## Test

```bash
corepack pnpm test
```

## Deploy

Manual deploy with the `gh-pages` package:

```bash
$env:GITHUB_PAGES="true"; corepack pnpm build
corepack pnpm deploy
```

Automatic deployment is configured in `.github/workflows/deploy.yml`. Enable GitHub Pages in the repository settings and set the source to GitHub Actions.

## Included MVP Scenario

The default scenario is Cobblestone to Gravel for one Create-style crushing wheel pair at 256 RPM using brass funnel input and a 64 item stack. It shows approximate and realistic drill counts, SU usage, recommended SU margin, resource needs, byproducts, warnings, and graph output.

## Mechanics Assumptions

- Minecraft timing uses 20 ticks per second and 1200 ticks per minute.
- Default RPM is 256.
- Default planning mode is realistic.
- Default realistic efficiency is 0.85 unless a machine has an override.
- Crushing wheel pair stack processing uses the requested stack-time formula and treats the configured input delay as the primary practical loss for the MVP.
- Mechanical drill cobblestone generation uses the formula for approximate mode and a conservative table for realistic mode.
- Create values vary by version, config, modpack, server TPS, and build design, so constants are editable in Settings.

## Known Limitations

- Starter data is intentionally small and focuses on common Create production chains.
- Recipe selection chooses the first matching recipe.
- Sequenced assembly is represented as a placeholder recipe.
- Item icons are placeholder labels instead of Minecraft/Create textures.
- Settings edits are session-local.
