# AGENTS.md

## Project Overview
DroneDB Docs — Docusaurus v3 documentation site deployed at docs.dronedb.app.

## Build & Run
| Command | Description |
|---------|-------------|
| `npm start` | Dev server with hot reload |
| `npm run build` | Production build → `build/` |
| `npm run serve` | Serve production build locally |

Node ≥18 required.

## Conventions
- Docs are Markdown/MDX files in `docs/`, organized by category (`cli/`, `registry/`, `features/`, etc.)
- Sidebar is **manual** in `sidebars.js` — adding a new doc requires updating this file
- Redirects are hardcoded in `docusaurus.config.js`
- Mermaid diagrams enabled via `@docusaurus/theme-mermaid`
- Custom CSS in `src/css/custom.css`

## Pitfalls
- `build/` is in `.gitignore` — not tracked in git. Deployment uses a separate CI/CD pipeline.
- Broken links cause build errors (`onBrokenLinks: 'throw'`); broken anchors warn only.
- Single locale (`en`); i18n scaffold exists but is unused.
