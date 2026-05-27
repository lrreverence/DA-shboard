# Scam Harm Dashboard

Next.js analytics dashboard answering:

> Which online scam type in the Philippines caused the greatest financial harm from 2023–2025, and which sector of society is most victimized?

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Tremor
- Recharts
- TanStack Query
- TanStack Table v8
- Zustand

## Local Development

```bash
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:3000`.

## Data

The app reads CSV files from the local [`data`](./data) directory at build/runtime:

- `data/fhi_ranking.csv`
- `data/master_dataset.csv`
- `data/platform_losses.csv`
- `data/demographic_findings.csv`

These files are bundled with the project so deployment does not depend on any machine-specific absolute path.

## Vercel Deployment

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Use the default framework preset: `Next.js`.
4. No environment variables are required for the current version.
5. Deploy.

The project builds with:

```bash
corepack pnpm build
```

## Notes

- The dashboard uses server-side file loading from `data/` for the initial render.
- `2023` is baseline context only and is not included in the scam-type FHI calculation.

# DA-shboard
