# Validation — version 2.0

Checked 1 November 2026 (Pacific/Auckland).

## Automated checks

All 21 tests passed using `node --test tests/*.cjs`: the ten existing exchange-model tests and eleven accumulation-model tests. New checks cover exact finite-sample mean/Gini calibration, proportional-saving invariance, undefined zero-wealth Gini, essential-cost drawdowns and unmet needs, tax/payment accounting, closed-form compounding, stochastic reproducibility, paired comparisons, universal-payment monotonicity under matched shocks, grid-order invariance and computational limits.

The original exchange engine and its benchmark behaviour are retained. Both new JavaScript files pass Node syntax checks, and `npm run build` produces a self-contained HTML with no external runtime script, style, font or chart dependency.

## Browser checks

- The default 77-cell grid completed six replications per cell, each covering 750 households and 360 months.
- Cell selection displayed the cumulative ledger, wealth-percentile trajectory and Monte Carlo intervals.
- A/B selection compared 20% and 80% saving at income Gini 0.4 using matched replications.
- The original cash-exchange experiment still switched into view and advanced by 50 rounds.
- A 390px-wide browser frame had a 375px content viewport and no document-level horizontal overflow. The wide matrix scrolls within its own container; the phone layout includes a swipe hint.
- Stop retained completed replications, and a new run could start afterwards.
- The pure-accumulation preset was exercised as an analytical control.

These checks used the available Chrome browser, not a physical Android or iOS device. Home-screen installation and actual airplane-mode use remain device-level verification tasks.

## Reproducible matrix baseline

`node scripts/finance-benchmark.cjs` generates `finance-baseline.csv` and its exact three scenario configurations in `finance-baseline-assumptions.json`. Every scenario uses 750 households, 360 months and 12 replications per cell, with five saving rates and four income Ginis. Seeds and income draws are matched across scenarios.

At 20% saving and income Gini 0.4:

| Scenario | Mean of final wealth medians | Mean wealth Gini | Unmet household-month share |
|---|---:|---:|---:|
| Pure accumulation: no initial wealth or costs | 219,176 | 0.4000 | 0% |
| Essential costs 2,000/month; initial wealth 1,000 | 76,176 | 0.6570 | 28.17% |
| Same household scenario plus payment 1,000/month | 148,176 | 0.5229 | 6.52% |

Mean gross income is 4,000/month; real returns, tax and income growth are zero. The universal payment is external new income, not a tax-funded scheme. These are illustrative model results in constant-purchasing-power money units, not estimates for actual NZ households.

The pure scenario reproduces the analytical identity that common proportional saving scales wealth while preserving the income Gini. The household scenario illustrates the impact of a fixed necessities floor. Accounting errors in the benchmark remain below the displayed tolerance.

---

# Validation — version 1.0

Checked 1 November 2026 (Pacific/Auckland).

## Numerical engine

All 10 automated Node test cases passed:

- Known Ginis, including equality, full finite-population concentration and fractional quintiles.
- A single transfer respects the payer's cap and conserves money.
- Mixed-group trades conserve aggregate money and never make balances negative.
- Identical seeds reproduce identical balances even when the computation is split into different-sized chunks.
- Equal displayed additions obey G′ = Gμ/(μ+b) without modifying bank balances.
- Multiplicative scaling preserves Gini and quintile shares.
- Recurring payments are injected exactly once per round, including runs advanced in partial-round chunks.
- Homogeneous-cap benchmarks approximate the historical curve.
- Mixed-group mean holdings differ in the direction implied by the outflow/receipt asymmetry.
- Invalid parameters are rejected.

## Browser checks

Checked in the available Chrome browser:

- Default 750-agent scenario starts at equality, runs, pauses and advances by 50 rounds.
- Ranked, distribution and Lorenz tabs switch successfully.
- An equal displayed payment of 1,010 changed a bank Gini near 0.520 to a displayed Gini near 0.259, as the exact formula predicts.
- Rescale mode restored the untransformed relative inequality.
- Recurring payments of 1,010 for 750 agents over 50 rounds injected 37,875,000. Total bank money was 38,625,000, correctly including the initial 750,000.
- The built-in cap study completed two replications at all ten caps and displayed the computed means.
- Responsive phone layout inspected in a 390px-wide browser frame. The document had no horizontal overflow at its 375px content viewport, and the controls and charts fit the available width.

The tests used the browser environment available during creation, not a physical Android or iOS device. Home-screen installation, actual airplane-mode operation and GitHub Pages publication should be checked on the chosen hosting URL and target phone. The downloadable HTML has no external script, style, font or chart dependency; it does not rely on the hosted PWA service worker.

## Repeated-cap baseline

Separate economies, 750 agents, initial balance 1,000, 1,200 rounds, 24 replications per cap, base seed 20261101. Payments off. Full results and Monte Carlo confidence intervals are in `baseline-results.csv`.

| Spend cap | Mean final Gini |
|---|---:|
| 10% | 0.14887 |
| 20% | 0.21624 |
| 30% | 0.27288 |
| 40% | 0.32509 |
| 50% | 0.37523 |
| 60% | 0.42459 |
| 70% | 0.47420 |
| 80% | 0.52499 |
| 90% | 0.57816 |
| 100% | 0.63560 |

This benchmark checks implementation behaviour. It is not empirical validation against observed household data.
