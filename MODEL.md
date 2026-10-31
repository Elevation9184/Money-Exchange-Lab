# Model and interpretation

## What is being measured

The state variable is non-negative **cash balance**. It is neither income per period nor net wealth (cash plus assets minus liabilities). This distinction matters when comparing model results with a survey of wealth or an OECD disposable-income Gini.

The model tests how one particular exchange mechanism redistributes a fixed initial stock of money. Recurring credits explicitly relax the fixed-stock assumption. It does not test which mechanisms dominate real economic inequality.

## Exchange rule and group effects

Every trade selects two distinct agents with equal probability. The first transfers U times its cap times its current balance to the second, where U is uniform on [0,1). Each group retains its assigned cap.

For an agent i with expected balance μ_i and cap f_i, the expected outflow when chosen as payer is f_i μ_i / 2. Its incoming-payment opportunities do not depend on its own cap.

In a stationary expectation, write S = Σ_j f_j μ_j. The expected balance change per trade is

```
E[Δm_i] = -f_i μ_i/(2N) + (S - f_i μ_i)/(2N(N - 1)).
```

Setting this to zero gives **f_i μ_i = S/N**, so mean balances are proportional to **1/f_i**. For groups g of size n_g, with total money M,

```
μ_g = (M / Σ_h(n_h / f_h)) / f_g.
```

This is a consequence of the exchange rule, derived here. It explains why low-cap groups accumulate larger average holdings: caps restrict their outflows without restricting receipts. It is not independent evidence that more cautious real-world households receive the same revenues as less cautious ones.

Homogeneous-group simulations are different experiments from subgroups inside a mixed economy. Within-group Ginis from a mixed economy need not match the separate-economy cap curve.

## Gini and payment transformations

For sorted non-negative balances x₁ ≤ … ≤ x_N, total M > 0,

```
G = 2 Σ_i(i x_i)/(N M) - (N + 1)/N.
```

This is the ordinary empirical Gini; it is not multiplied by N/(N-1). Its maximum for a finite population is (N-1)/N.

For a non-negative equal addition b and original mean μ:

```
G(x + b) = G(x) μ/(μ + b).
```

Absolute pairwise gaps do not change, while the denominator (mean balance) increases. An equal addition to every account therefore **does not merely change the units**. For example, adding 1,000 to balances averaging 1,000 exactly halves Gini, before any further exchanges.

For any positive scalar a:

```
G(a x) = G(x).
```

This does merely rescale amounts. Quintile money shares are also invariant.

A recurring payment is a different process because money is added before each round and participates in subsequent exchanges. After R completed rounds, starting balance m₀ and equal payment b per round, expected and actual aggregate money (apart from floating-point error) are

```
M_R = N(m₀ + R b).
```

There is no stationary fixed monetary scale when b > 0. Gini over the chosen horizon can still be examined, but neither constant nominal prices nor constant purchasing power is implied.

## Why “Boltzmann–Gibbs” needs care

A non-negative exponential distribution has Gini **0.5**, regardless of its mean. The supplied historical 100% spend-cap benchmark near **0.63** cannot be the same pure exponential distribution.

Money conservation alone does not force every exchange rule to yield an exponential distribution. Transition rules and boundary conditions matter. Pooled random redistribution, payer-proportional transfers, savings rules and yard-sale exchanges are distinct mechanisms. They should not be silently substituted for one another.

Nor does a similar-looking observed histogram identify its cause. Similar patterns can arise from different processes. A cash-exchange simulation cannot rule out institutional effects, oppression, taxation or bargaining power in a real economy. The claim supported here is narrower and useful: under a stated stochastic transfer rule, sizeable inequality emerges from equal starting balances, and changing spending caps changes the distribution.

## Monte Carlo design

The built-in study uses the current population, initial balance and duration, but puts every agent in a homogeneous-cap economy and disables all payments and display scaling. Caps are 0.1, 0.2, …, 1.0. For replication r (starting at zero), the PRNG seed is

```
(seed + imul(r + 1, 0x9e3779b9)) modulo 2^32.
```

The same replication seed is used across caps (common random numbers); distinct seeds are used between replications. For each cap the result is the sample mean of final Ginis, sample SD and SE, with an approximate normal interval mean ± 1.96 × SE. With only a few replications this normal approximation is rough. Increase replication count to assess Monte Carlo uncertainty; increase duration separately to investigate settling. Confidence intervals quantify simulation variation under this model, not uncertainty about whether it describes society.

Mulberry32 is used as a deterministic 32-bit PRNG. It is adequate for an educational demonstration, not cryptographic use. The same seed, parameters and order of operations reproduce a run. The engine maintains IEEE-754 double-precision balances without cent rounding; the UI checks the accounting identity with a relative tolerance of 10⁻¹⁰.

## Research references

- Drăgulescu, A. A. & Yakovenko, V. M. (2000). *Statistical mechanics of money*. European Physical Journal B 17, 723–729. https://arxiv.org/abs/cond-mat/0001432
- Chakraborti, A. & Chakrabarti, B. K. (2000). *Statistical mechanics of money: how saving propensity affects its distribution*. European Physical Journal B 17, 167–170. https://arxiv.org/abs/cond-mat/0004256
- Yakovenko, V. M. & Rosser, J. B. Jr. (2009). *Colloquium: Statistical mechanics of money, wealth, and income*. Reviews of Modern Physics 81, 1703–1725. https://doi.org/10.1103/RevModPhys.81.1703
- Tao, Y. et al. (2019). *Exponential structure of income inequality: evidence from 67 countries*. Journal of Economic Interaction and Coordination 14, 345–376. https://arxiv.org/abs/1612.01624

The last study concerns household-income distributions, particularly the low- and middle-income bulk. It does not establish that all countries' complete wealth distributions, or all ancient societies' wealth distributions, are exponential. The application makes no such claim.
