# Financial resilience of four U.S. retailers

## Executive answer

**Dillard's and TJX look best prepared to withstand financial stress in this peer set.** Dillard's ranks first because it combines the strongest liquidity, the lowest fixed-obligation burden, and the highest free-cash-flow margin. TJX ranks second on strong cash generation and a net-cash position before operating leases. The top-two conclusion survives both a leverage-heavy reweighting and a severe cash-flow stress.

| Rank | Company | Baseline score / 100 | Main reason | Overall assessment |
|---:|---|---:|---|---|
| 1 | Dillard's | **94.4** | 2.65x current ratio, net liquid resources after fixed obligations, 9.6% FCF margin | Strongest balance-sheet headroom in the model |
| 2 | TJX | **66.7** | Peer-leading 11.4% CFO margin and 8.1% FCF margin; cash exceeds borrowings | Strong, though store leases materially raise fixed obligations |
| 3 | Target | **22.2** | Better liquidity and cash-flow margins than Walmart, but the heaviest relative fixed-obligation burden | Mixed; positive headroom is thin under stress |
| 4 | Walmart | **16.7** | Lower fixed obligations relative to assets than Target, but weakest liquidity and cash-flow margins | Scale is substantial, but ratio-based near-term headroom ranks lowest |

Scores are relative percentiles within four companies, **not probabilities of default**. The gap between the top two and bottom two is more informative than the precise lower-rank ordering: Walmart moves above Target when fixed-obligation burden receives more weight.

## Peer set and observation date

The peer set is Dillard's, TJX, Target, and Walmart: U.S. public retailers with general-merchandise, department-store, or off-price formats and annual 10-K periods ending **January 31, 2026** in the SEC Financial Statement Data Set. The common period improves balance-sheet comparability. Issuer fiscal-year labels differ—Dillard's and Target label the filing FY2025, while TJX and Walmart label it FY2026—so the analysis keys on the reported period rather than the fiscal-year label.

The businesses are not identical. Walmart has a large grocery mix, TJX is an off-price retailer, Target is a mass merchant, and Dillard's is a smaller department-store operator with a small construction segment. The ranking is therefore a focused retail comparison, not a claim that these are the only relevant competitors or a ranking of every issuer in the dataset.

## Criteria and method

### Raw inputs and derived metrics

All monetary inputs are consolidated, unsegmented USD facts for `ddate=20260131`. Balance-sheet facts use `qtrs=0`; annual revenue and cash-flow facts use `qtrs=4`.

- **Liquid resources:** cash and cash equivalents plus separately presented short-term investments. Target reports a combined cash/short-term-investment tag; Dillard's includes $0.211 billion of short-term held-to-maturity debt securities.
- **Borrowings:** presented short-term borrowings, current and noncurrent long-term debt, and finance/capital lease debt.
- **Fixed obligations:** borrowings plus **noncurrent operating lease liabilities**. Current operating lease pressure remains in current liabilities; it is not separately added to fixed obligations because Target does not present that amount as a separate primary-statement tag.
- **Free cash flow (FCF):** operating cash flow (CFO) minus property/equipment capital expenditures. This is an analytical measure, not a standardized SEC metric.

The baseline score uses six metrics in three equally weighted categories:

| Category | Weight | Metrics | Preferred direction |
|---|---:|---|---|
| Liquidity | 33⅓% | Current assets / current liabilities; liquid resources / current liabilities | Higher |
| Fixed-obligation burden | 33⅓% | Fixed obligations / total assets; (fixed obligations − liquid resources) / CFO | Lower |
| Cash generation | 33⅓% | CFO / revenue; FCF / revenue | Higher |

Each metric receives a relative score from 0 to 100 using `100 × (rank − 1) / (n − 1)`, where rank 1 is the worst result and rank 4 is the best after orienting the metric. Ties receive average ranks. The two metric scores are averaged within each category and the category scores are weighted. Calculations use unrounded filed values; tables below are rounded only for display.

## Filing metrics

### Raw values

USD billions; source IDs resolve to the filing appendix.

| Company | Liquid resources | Current assets | Current liabilities | Total assets | Borrowings | Noncurrent operating leases | Fixed obligations | Revenue | CFO | Capex | FCF | Source |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Dillard's | 1.073 | 2.387 | 0.902 | 3.505 | 0.322 | 0.026 | 0.348 | 6.474 | 0.717 | 0.093 | 0.624 | [DDS-10K] |
| TJX | 6.230 | 15.202 | 13.361 | 35.767 | 2.869 | 8.894 | 11.763 | 60.372 | 6.874 | 1.957 | 4.917 | [TJX-10K] |
| Target | 5.488 | 20.005 | 21.230 | 59.490 | 16.456 | 3.462 | 19.918 | 104.780 | 6.562 | 3.727 | 2.835 | [TGT-10K] |
| Walmart | 10.727 | 84.874 | 107.469 | 284.668 | 51.523 | 13.941 | 65.464 | 706.413 | 41.565 | 26.642 | 14.923 | [WMT-10K] |

### Ratios and category scores

| Company | Current ratio | Liquid coverage | Fixed obligations / assets | Net fixed obligations / CFO | CFO margin | FCF margin | Liquidity score | Obligation score | Cash-generation score | Baseline score |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dillard's | **2.65x** | **1.19x** | **9.9%** | **−1.01x** | 11.1% | **9.6%** | 100.0 | 100.0 | 83.3 | **94.4** |
| TJX | 1.14x | 0.47x | 32.9% | 0.80x | **11.4%** | 8.1% | 66.7 | 50.0 | 83.3 | **66.7** |
| Target | 0.94x | 0.26x | 33.5% | 2.20x | 6.3% | 2.7% | 33.3 | 0.0 | 33.3 | **22.2** |
| Walmart | 0.79x | 0.10x | 23.0% | 1.32x | 5.9% | 2.1% | 0.0 | 50.0 | 0.0 | **16.7** |

A negative net-fixed-obligations/CFO ratio means liquid resources exceed fixed obligations; it does not mean the company has negative liabilities.

## Company conclusions

### 1. Dillard's — strongest modeled headroom

Dillard's is the only peer whose liquid resources ($1.073 billion) exceed both current liabilities ($0.902 billion) and fixed obligations ($0.348 billion). That produces the best current ratio (2.65x), liquid coverage (1.19x), and net-fixed-obligations/CFO ratio (−1.01x). Its $0.624 billion of FCF is 9.6% of revenue, also the peer high. These filed metrics support the first-place ranking [DDS-10K].

The conclusion is ratio-based: the model does not penalize Dillard's for its much smaller scale, department-store concentration, or the volatility that concentration could create.

### 2. TJX — strong cash engine, lease-heavy footprint

TJX leads on CFO margin at 11.4% and generates $4.917 billion of FCF, or 8.1% of revenue. Its $6.230 billion of liquid resources also exceeds $2.869 billion of borrowings. Those are strong shock absorbers [TJX-10K]. The main offset is $8.894 billion of noncurrent operating lease liabilities; after leases, fixed obligations rise to $11.763 billion and 32.9% of assets. TJX consequently receives only a 50.0 obligation score despite excellent cash generation.

### 3. Target — modest liquidity, highest relative burden

Target's current ratio is below one (0.94x), and liquid resources cover only 0.26x current liabilities. Fixed obligations equal 33.5% of assets—the highest share in the peer set—and net fixed obligations are 2.20x annual CFO [TGT-10K]. Target ranks above Walmart in the baseline because its 6.3% CFO margin and 2.7% FCF margin, while modest, exceed Walmart's, and its liquidity ratios are also better. That advantage does not survive a leverage-heavy weighting.

### 4. Walmart — strong absolute cash flow, weaker ratio headroom

Walmart reports the largest absolute CFO ($41.565 billion) and FCF ($14.923 billion), but scale alone does not determine resilience here. Its 0.79x current ratio, 0.10x liquid coverage, 5.9% CFO margin, and 2.1% FCF margin are the peer lows [WMT-10K]. Its fixed obligations/assets ratio of 23.0% is, however, materially better than Target's and TJX's. That balance-sheet advantage moves Walmart to third under the leverage-heavy sensitivity.

## Sensitivity tests

### Alternative weighting: emphasize fixed obligations

The alternative assigns 25% to liquidity, 50% to fixed-obligation burden, and 25% to cash generation. Equal weights remain within each category.

| Company | Baseline rank | Baseline score | Leverage-heavy rank | Leverage-heavy score | Change |
|---|---:|---:|---:|---:|---|
| Dillard's | 1 | 94.4 | **1** | **95.8** | None |
| TJX | 2 | 66.7 | **2** | **62.5** | None |
| Target | 3 | 22.2 | **4** | **16.7** | Down one |
| Walmart | 4 | 16.7 | **3** | **25.0** | Up one |

The top-two conclusion is stable. The Target/Walmart ordering is not: Walmart's lower fixed-obligations/assets ratio and better net-fixed-obligations/CFO ratio outweigh Target's liquidity and margin advantage when obligations receive half the score.

### Severe cash-flow stress

The deterministic stress reduces each company's filed CFO by **40%**, while holding revenue and capex fixed. Holding capex fixed is deliberately conservative because management could defer some investment; the scenario is a sensitivity, not a forecast.

| Company | Stressed CFO ($bn) | Stressed FCF ($bn) | Stressed FCF margin | Stress rank | Interpretation |
|---|---:|---:|---:|---:|---|
| Dillard's | 0.430 | **0.337** | **5.20%** | 1 | Meaningful positive headroom |
| TJX | 4.124 | **2.167** | **3.59%** | 2 | Meaningful positive headroom |
| Target | 3.937 | **0.210** | **0.20%** | 3 | Barely positive after fixed capex |
| Walmart | 24.939 | **−1.703** | **−0.24%** | 4 | Capex exceeds stressed CFO |

The ordinal ranking and percentile scores do not change because the shock leaves all six metric orderings intact. This stability is partly mechanical: a uniform CFO multiplier preserves the ordering of CFO margin and net-fixed-obligations/CFO, while the three balance-sheet measures do not change. Only stressed FCF margin could reorder the peers here, and it does not. The scenario is therefore more informative about **absolute headroom**: Dillard's and TJX retain substantial positive FCF, Target approaches break-even, and Walmart turns negative. This result reflects Walmart's high filed capex, not an inability to reduce capex in a real downturn.

## Uncertainty and interpretation limits

1. **Small, relative sample.** Four-company percentiles create coarse 33.3-point steps. A company can score zero while still being financially viable; it is merely last among these peers on that metric.
2. **Different retail models and scale.** Grocery, mass merchandise, off-price, and department-store economics differ. Dillard's first-place ratio score does not capture its smaller absolute resources or concentration risk.
3. **Single-period snapshot.** The model uses one balance-sheet date and one annual flow period. It does not score multi-year volatility, cyclicality, seasonality, or post-filing events.
4. **Correlated cash measures.** CFO margin and FCF margin both begin with CFO, intentionally emphasizing cash generation but partly double-counting the same signal. Working-capital timing can also move annual CFO.
5. **Lease granularity.** Noncurrent operating leases are included because retail stores create fixed commitments. Current operating leases are represented through current liabilities but are not separately added to fixed obligations, ensuring consistent treatment where Target lacks a separate primary-statement fact. Current debt remains in fixed obligations, however, so this treatment is asymmetric and understates total lease-adjusted obligations—particularly for lease-heavy retailers.
6. **Tag heterogeneity.** Issuers use different standard tags and aggregation choices. Target's cash tag is a combined taxonomy concept but is presented as “Cash and cash equivalents”; TJX reports revenue with assessed tax while the others use the excluding-assessed-tax concept. Presentation labels were checked, but perfect accounting-policy comparability is not guaranteed.
7. **Simple FCF definition.** CFO minus property/equipment capex excludes acquisitions, dividends, buybacks, debt maturities, and some lease cash flows. It is useful for a transparent stress test, not a complete sources-and-uses forecast.
8. **Missing financing context.** The primary-statement dataset does not provide a consistently scored view of revolver availability, debt maturity ladders, covenant headroom, collateral, credit ratings, supplier terms, or access to capital markets. These could materially change resilience judgments.
9. **Stress is non-probabilistic.** A uniform 40% CFO shock with unchanged capex and revenue is intentionally severe but stylized. It does not estimate the probability, timing, or operating path of a downturn.
10. **Dataset timing.** The June financial-statement-notes files contain a later monthly filing population and were not mixed with these Q1 annual 10-K facts. Consequently, this analysis traces to annual primary-statement metrics rather than later narrative disclosures.

## Filing traceability appendix

### Filing identifiers

| Source ID | Company | Form | Period | Issuer FY label | Filed | SEC accession number |
|---|---|---|---:|---:|---:|---|
| DDS-10K | Dillard's, Inc. | 10-K | 2026-01-31 | 2025 | 2026-03-27 | `0000028917-26-000006` |
| TJX-10K | TJX Companies Inc. | 10-K | 2026-01-31 | 2026 | 2026-03-31 | `0000109198-26-000008` |
| TGT-10K | Target Corp. | 10-K | 2026-01-31 | 2025 | 2026-03-11 | `0000027419-26-000016` |
| WMT-10K | Walmart Inc. | 10-K | 2026-01-31 | 2026 | 2026-03-13 | `0000104169-26-000055` |

### Dataset files and filters

- Filing metadata: `datasets/sec_financial_statement_notes/fsds_2026q1_sub.csv`.
- Numeric facts: `datasets/sec_financial_statement_notes/fsds_2026q1_num.csv`.
- Primary-statement labels and tag validation: `datasets/sec_financial_statement_notes/fsds_2026q1_pre.csv`.
- Reproducible output with unrounded values and source tags: [`metrics.csv`](metrics.csv).
- Numeric filter: matching accession, `ddate=20260131`, `uom=USD`, empty `segments` and `coreg`; `qtrs=0` for stock facts and `qtrs=4` for flow facts.

### XBRL tag mapping

Common tags are `AssetsCurrent`, `LiabilitiesCurrent`, `Assets`, `OperatingLeaseLiabilityNoncurrent`, `NetCashProvidedByUsedInOperatingActivities`, and `PaymentsToAcquirePropertyPlantAndEquipment`.

| Source ID | Liquid-resource tags | Borrowing tags | Revenue tag |
|---|---|---|---|
| DDS-10K | `CashAndCashEquivalentsAtCarryingValue`; `DebtSecuritiesHeldToMaturityAmortizedCostAfterAllowanceForCreditLossCurrent` | `UnsecuredDebtCurrent`; `OtherLongTermDebtNoncurrent` | `RevenueFromContractWithCustomerExcludingAssessedTax` |
| TJX-10K | `CashAndCashEquivalentsAtCarryingValue` | `LongTermDebtCurrent`; `LongTermDebtNoncurrent` | `RevenueFromContractWithCustomerIncludingAssessedTax` |
| TGT-10K | `CashCashEquivalentsAndShortTermInvestments` | `LongTermDebtAndCapitalLeaseObligationsCurrent`; `LongTermDebtAndCapitalLeaseObligations` | `RevenueFromContractWithCustomerExcludingAssessedTax` |
| WMT-10K | `CashAndCashEquivalentsAtCarryingValue` | `ShortTermBorrowings`; `LongTermDebtCurrent`; `LongTermDebtNoncurrent`; `FinanceLeaseLiabilityCurrent`; `FinanceLeaseLiabilityNoncurrent` | `RevenueFromContractWithCustomerExcludingAssessedTax` |

The analysis script is in `scripts/src/scripts/analysis.py`. It filters to the stated period, unit, duration, and consolidation scope, then fails if a required valid fact is missing, if valid unsegmented facts conflict, if a tag is absent from the primary-statement presentation, or if a spot-checked source value changes.
