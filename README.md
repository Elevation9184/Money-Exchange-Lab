# Money Exchange Lab

A mobile-friendly simulator exploring the financial geometry of inequality. It contains two independently specified experiments:

- **Income × saving matrix:** repeated household accumulation simulations, with saving propensity by income distribution and cumulative outcomes in every cell.
- **Cash exchange experiment:** the original 750-agent random-transfer model, with adjustable groups and spending caps.

The complete app is contained in `index.html`. Open it in a browser or visit the existing GitHub Pages site. All simulation and chart code is local; no account, remote computation, data upload or external runtime library is required. Hosted copies can use the included install/offline assets. The Save offline app button downloads a self-contained HTML with both experiments and the current scenario assumptions.

## Income × saving matrix

Defaults: 750 households, 360 monthly periods, six replications per cell, 11 saving propensities from 0% to 100%, and seven income Ginis from 0 to 0.6. Every income column has the same exact sample mean; mean income is controlled separately.

Controls cover income, essential expenditure, universal payments, starting wealth, flat income tax, real investment returns, return risk, real income growth and within-cell variation in saving or starting wealth. Starting wealth and saving can be independent of, aligned with or reversed against income ranks.

Every cell provides final wealth Gini, median and mean wealth, cumulative net saving, unmet essential costs, a financial-buffer measure, a trajectory and a cumulative accounting check. Tap cells to inspect uncertainty or mark A and B for a matched comparison. CSV exports contain the grid or selected trajectory. Experiment JSON includes immutable assumptions and all completed replications. Loading it loads assumptions for a rerun, not a partial-state resume. Copy experiment link shares assumptions only.

The matrix's propensity is a retained share of income **after essential costs**. The cash-exchange propensity is a maximum share of **current bank balance paid in one trade**. These are different definitions and are explicitly labelled.

See [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md) for equations, calibration, statistical treatment, accounting and limitations. In particular, a universal payment is an external inflow here; no tax-funding mechanism is assumed. Debt and intergenerational succession are not included.

## Reproduce the checks

Node.js 20 or later; nothing to install:

```
npm test
npm run build
node scripts/finance-benchmark.cjs
```

The build embeds the source files into `index.html` and writes an equivalent `dist/` directory. The benchmark writes `finance-baseline.csv` and `finance-baseline-assumptions.json` for 12 replications at each point in three matched scenarios. The original cash benchmark remains available as `node scripts/benchmark.cjs`.

`VALIDATION.md` records the release checks. Tests cover numerical identities, income distribution calibration, money conservation, cash-flow accounting, seeded reproducibility, shortfalls, investment compounding, payment transformations and analytical special cases.

## Publish

The repository's existing Pages configuration can continue serving the root `index.html` from `main`. A merged source change takes effect after GitHub's normal Pages build. All assets use relative paths, so repository-subdirectory hosting works. Keep the empty `.nojekyll` file when publishing static assets.

GitHub's browser upload does not unpack ZIPs. For a manual upload, extract the files first. For the minimal self-contained version only `index.html` is required; hosted PWA installation additionally uses `manifest.webmanifest`, `sw.js` and the icons. Bump the cache version in `sw.js` when releasing a new version.

The original cash-exchange specification and research references are in [MODEL.md](MODEL.md). The benchmark outcomes and example household assumptions are model results, not a calibration to observed wealth or income.
