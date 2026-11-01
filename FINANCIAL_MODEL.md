# Income × saving matrix: model specification

Version 2.0 adds an independent household accumulation experiment alongside the original random cash-exchange model. Saving propensity here is a share of income remaining after necessities, not a spending cap applied to current cash. The two mechanisms are not interchangeable.

## Matrix and control variables

Rows specify a central saving propensity; columns specify the finite-sample Gini of permanent gross earned income. Within every replication, all columns have the same exact mean and aggregate income. A numerical calibration adjusts the dispersion of a lognormal-shaped sample to each requested Gini. No observed NZ income distribution is fitted.

Mean income is a separate control. The global controls are initial wealth, monthly essential expenditure, an equal universal payment, flat income tax, expected real investment return, return volatility and real income growth. Optional within-cell variation changes saving rates and starting wealth, with independent, positively rank-aligned or negatively rank-aligned associations with income.

Without saving-rate spread, every household in a cell uses the same saving propensity. With spread, each individual rate is clipped to [0,1]; the row label is the central rate, and the inspector reports the realised mean. Independent spread is uniform about the centre; rank-aligned spread is assigned by income rank. Starting wealth can be equal or lognormal-shaped with a calibrated Gini.

All sums are in model money units at constant purchasing power. The dollar symbol is a display convention. Monthly income growth and investment returns are real rates.

## Monthly cash-flow geometry

For household i, let W be non-negative wealth, Y gross earned income, τ the flat tax rate, U the equal payment, C essential costs and s the saving propensity. Every month:

1. Apply an investment factor R to existing wealth: A = W R.
2. Receive disposable income D = (1−τ)Y + U.
3. If D ≥ C, save s(D−C) and consume C + (1−s)(D−C). New wealth is A + s(D−C).
4. If D < C, use min(A,C−D) of wealth to help meet essentials. New wealth is max(0,A−(C−D)). Any remaining shortfall is recorded as unmet essential cost.

Income in month t, counting the first month as t=0, is Y₀(1+g)^(t/12). Universal payments and essential costs remain constant in real terms.

For expected real annual return r and annual log-return volatility σ, a monthly stochastic factor is

```
R = exp((ln(1+r) − σ²/2)/12 + σ Z / sqrt(12)),  Z ~ N(0,1).
```

With no volatility this is (1+r)^(1/12). Returns precede that month's saving contribution. The return draws are independent between households and months and shared between matched cells. There is no cross-household market factor in this version.

Gross earnings and universal payments enter from outside the household sector. Taxes and consumption leave it. This is an open household-sector accounting model, not a closed macroeconomic model. Tax receipts are not assumed to fund universal payments. Returns and universal payments are untaxed. There is no debt or hidden financing: an unfunded essential cost does not become negative wealth or consumption.

## Cumulative accounting identity

Every replication checks

```
final wealth = initial wealth + cumulative gross earned income
             + cumulative universal payments + investment gains/losses
             − cumulative income tax − cumulative actual consumption.
```

The inspector reports the means of these components per household across replications. It also reports unmet needs separately. Negative cumulative net saving means wealth was drawn down to cover essential expenditure. Investment gains are separate from net saving.

## Outcomes in every cell

- Mean of the within-replication median final wealth.
- Mean final wealth (with a common population, this also determines aggregate final wealth).
- Mean final wealth Gini and richest-quintile share.
- Mean of the within-replication median cumulative net saving.
- Fraction of household-months with an unfunded essential shortfall.
- Fraction of final households holding less than three months of essential costs; undefined if essential costs are zero.
- A trajectory, sampled initially and at year ends (plus the final month), showing mean within-run 10th, 50th and 90th wealth percentiles, mean wealth and mean Gini.

A Gini is undefined if aggregate wealth is zero. Such cases are not presented as equality: the UI shows an em dash. The original exchange module retains its original convention and implementation.

The heatmap defaults to accumulated median wealth. Changing its outcome selector does not rerun the simulation. Its colour scale is calculated from the current experiment's available outcomes; colours from separate experiments are not a common numeric scale. The row/column sensitivity summary is a descriptive spread over the chosen grid, not an estimate of causal shares of observed inequality.

## Replications and matched comparisons

Distinct replication seeds are `(baseSeed + imul(replicationIndex+1,0x9e3779b9)) mod 2^32`. Separate deterministic streams generate incomes, initial wealth, saving variation and returns. The same underlying draws are shared across cells in a replication. Changing grid order does not change those draws.

A cell's 95% Monte Carlo interval is the sample mean plus or minus a Student-t critical value times the sample standard error, with n−1 degrees of freedom. A/B comparisons use B−A within each matched replication before calculating the interval. Rounded critical values are used through 30 degrees of freedom and a close approximation above that. These are approximate simulation intervals; they do not quantify uncertainty about the economic assumptions or validate the model against real households.

Partial experiments retain completed replications, and their actual n is displayed. Provisional cells do not masquerade as a full experiment. JSON exports retain all completed samples, their trajectories and the immutable run assumptions. Loading a JSON file loads its assumptions for a reproducible rerun; it does not resume or trust imported results. Changing assumptions leaves previous results labelled as stale until a new experiment is run.

## Analytical checks

With equal zero starting wealth, no essential costs, no returns, no tax, no payment and fixed income:

```
W_i(T) = T s Y_i.
```

For a common s > 0, the wealth Gini equals the income Gini. Increasing saving scales wealth but cannot change its Gini in this special case. At s=0 all wealth is zero and Gini is undefined. The pure-accumulation preset exposes this identity.

For constant monthly surplus S, no borrowing or shortfall and deterministic monthly factor q, with saving applied after returns:

```
W_T = W_0 q^T + S (q^T − 1)/(q − 1),  q ≠ 1,
W_T = W_0 + T S,                       q = 1.
```

These identities, cumulative accounting, mean/Gini calibration, return reproducibility and matched-shock payment monotonicity are tested in `tests/finance.test.cjs`.

## Interpretation and current boundaries

This experiment makes assumptions explicit and tests their consequences. It does not establish that either budgeting or income dominates real-world wealth inequality. Essential costs can leave a household with no surplus to save regardless of its propensity. Uniform saving changes wealth levels without necessarily changing relative inequality. Income distribution, starting wealth, costs, payments, returns and their associations interact.

There are no firms, endogenous wages or prices, housing assets, debt, unemployment, progressive tax, tax-funded redistribution or generational succession. Starting-wealth dispersion is available, but is not an inheritance simulation. Results require empirical calibration and additional mechanisms before drawing policy conclusions.

The baseline scenario is illustrative: 750 households, 360 months, mean monthly income 4,000, essential costs 2,000 and equal starting wealth 1,000. It is not a household budget recommendation or a fit to New Zealand data.
