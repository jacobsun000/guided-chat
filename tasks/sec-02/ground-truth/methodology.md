# Methodology: Companies Improving Profitability

## Main findings

The final comparable set contains **2,638 companies**: **1,186 improving**, **1,081 worsening**, **248 mixed**, and **123 stable**. These labels describe within-company margin direction, not an investment ranking. The composite change is only the arithmetic mean of available margin changes and is used to order examples; it does not replace the signal rule.

### Strongest improving classifications by composite margin change

| Company | CIK | Period end | Unit | Prior revenue | Current revenue | Revenue change % | Operating margin Δ (pp) | Net margin Δ (pp) | Composite Δ (pp) |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| HEALTHIER CHOICES MANAGEMENT CORP. | 844856 | 2025-12-31 | USD | 501 | 2979 | 494.610778 | 1461267.141648 | 2137841.192539 | 1799554.167094 |
| 4D MOLECULAR THERAPEUTICS, INC. | 1650648 | 2025-12-31 | USD | 37000 | 85209000 | 230194.594595 | 507491.136420 | 434613.948564 | 471052.542492 |
| JOBY AVIATION, INC. | 1819848 | 2025-12-31 | USD | 136000 | 53425000 | 39183.088235 | 437442.787773 | 445343.361199 | 441393.074486 |
| ALTIMMUNE, INC. | 1326190 | 2025-12-31 | USD | 20000 | 41000 | 105.000000 | 285399.024390 | 260434.024390 | 272916.524390 |
| INMUNE BIO, INC. | 1711754 | 2025-12-31 | USD | 14000 | 50000 | 257.142857 | 209769.714286 | 208719.714286 | 209244.714286 |

### Strongest worsening classifications by composite margin change

| Company | CIK | Period end | Unit | Prior revenue | Current revenue | Revenue change % | Operating margin Δ (pp) | Net margin Δ (pp) | Composite Δ (pp) |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| ADITXT, INC. | 1726711 | 2025-12-31 | USD | 133985 | 3195 | -97.615405 | -591746.089819 | -1318910.278904 | -955328.184362 |
| LYELL IMMUNOPHARMA, INC. | 1806952 | 2025-12-31 | USD | 61000 | 36000 | -40.983607 | -160221.493624 | -200070.309654 | -180145.901639 |
| AXE COMPUTE INC. | 1446159 | 2025-12-31 | USD | 84812 | 125284 | 47.719662 | -132255.343379 | -171121.142215 | -151688.242797 |
| NEONC TECHNOLOGIES HOLDINGS, INC. | 1979414 | 2025-12-31 | USD | 83000 | 39990 | -51.819277 | -137032.073687 | -141068.877299 | -139050.475493 |
| INFLARX N.V. | 1708688 | 2025-12-31 | EUR | 165789 | 29331 | -82.308235 | — | -127797.123611 | -127797.123611 |

### Representative mixed cases

| Company | CIK | Period end | Unit | Prior revenue | Current revenue | Revenue change % | Operating margin Δ (pp) | Net margin Δ (pp) | Composite Δ (pp) |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| INHIBRX BIOSCIENCES, INC. | 2007919 | 2025-12-31 | USD | 200000 | 1300000 | 550.000000 | 155337.461538 | -854559.461538 | -349611.000000 |
| MYSEUM, INC. | 1648960 | 2025-12-31 | USD | 436 | 550 | 26.146789 | -260310.024186 | 498234.949125 | 118962.462470 |
| SCIENTURE HOLDINGS, INC. | 1382574 | 2025-12-31 | USD | 136643 | 431609 | 215.866162 | 890.780749 | -16252.685235 | -7680.952243 |
| QUANTUM COMPUTING INC. | 1758009 | 2025-12-31 | USD | 373000 | 682000 | 82.841823 | -535.676885 | 15637.748147 | 7551.035631 |
| FREE FLOW USA, INC. | 1543652 | 2025-12-31 | USD | 9148 | 30000 | 227.940533 | 5713.461072 | -7683.173839 | -984.856384 |

These tables are mechanical margin-change sorts, not assessments of economic strength. Very small revenue denominators can produce extreme margins: **231 included companies have at least one absolute reported margin above 1,000%**. The raw revenue columns make that denominator effect visible; extreme values are screening flags, not evidence that profitability is already strong.

A mixed label means the operating- and net-margin signals crossed the materiality thresholds in opposite directions. It can arise from taxes, interest, non-operating gains or losses, discontinued operations, or different attribution bases; it should not be read as “unchanged.” Stable means every available margin moved by less than 0.5 percentage points in absolute value.

## Source and scope

The analysis uses the complete SEC primary-statement release in:

- `fsds_2026q1_sub.csv` (submission and company metadata),
- `fsds_2026q1_pre.csv` (statement presentation),
- `fsds_2026q1_num.csv` (numeric facts), and
- `fsds_2026q1_tag.csv` (taxonomy definitions).

The June financial-statement-notes release (`fsnds_2026_06_*`) is intentionally excluded. It is a different monthly sampling window, contains many note and 8-K facts, and is not needed for a coherent Q1 annual-filing universe.

“Annual filing” is defined as an original `10-K`, `20-F`, or `40-F` with `detail=1`; amendment and transition-form names are not in the allowed set. For each CIK, the latest accepted eligible filing is retained. SIC 6000–6999 is excluded because banks, insurers, and similar financial firms use sector-specific revenue and profit structures. A blank or nonnumeric SIC is not presumed to be financial; those filings are counted separately, and **0** such companies survive into the final CSV.

### Coverage and exclusions

| Stage or mutually exclusive result | Count |
|---|---:|
| All Q1 submissions | 6,169 |
| Original annual forms | 4,746 |
| Original annual forms with detailed statements | 4,742 |
| Financial-sector filings excluded | 1,331 |
| Eligible filings after SIC 6000–6999 exclusion, before one-per-CIK selection | 3,411 |
| Of those filings: SIC blank or nonnumeric | 155 |
| Latest eligible company filings selected | 3,410 |
| Of selected filings: SIC blank or nonnumeric | 155 |
| Excluded: no mapped standard revenue presented on an income statement | 580 |
| Excluded: no aligned consecutive annual revenue pair | 103 |
| Excluded: nonpositive revenue in either aligned year | 86 |
| Excluded: no aligned operating- or net-profit pair | 3 |
| **Included companies** | **2,638** |

Of included companies, **2,498 use US-GAAP mappings** and **140 use IFRS mappings**. **2,416 have both margins**, **181 are net-only**, and **41 are operating-only**.

## Tag mappings

Only standard, nonabstract, duration, monetary definitions (`custom=0`, `abstract=0`, `datatype=monetary`, `iord=D`) from the tag catalog are accepted. A tag also must be presented on an income statement (`pre.stmt=IS`). Priorities are deterministic:

| Measure | Taxonomy | Priority (first valid pair wins) |
|---|---|---|
| Revenue | US-GAAP | `RevenueFromContractWithCustomerExcludingAssessedTax`; `RevenueFromContractWithCustomerIncludingAssessedTax`; `Revenues`; `RegulatedAndUnregulatedOperatingRevenue` |
| Revenue | IFRS | `Revenue` |
| Operating profit | US-GAAP | `OperatingIncomeLoss` |
| Operating profit | IFRS | `ProfitLossFromOperatingActivities` |
| Net profit | US-GAAP | `NetIncomeLoss`; then `ProfitLoss` |
| Net profit | IFRS | `ProfitLossAttributableToOwnersOfParent`; then `ProfitLoss` |

No custom extension is inferred, and component revenue tags are not summed. `NetIncomeLoss` and `ProfitLossAttributableToOwnersOfParent` are preferred because they are attributable to the parent; `ProfitLoss` is a fallback and can include noncontrolling interests. The chosen tag and taxonomy version are exported so this distinction remains visible.

## Inclusion, alignment, and duplicate rules

1. Numeric facts must have `qtrs=4`, blank `segments`, blank `coreg`, a finite value, and a nonblank unit.
2. The latest revenue end date must be within 14 days of the submission's period. The preceding end date must be 330–400 days earlier.
3. Revenue and each profit measure use the same tag, taxonomy version, and unit in both years. Profit facts must occur on the exact two selected revenue dates and use the revenue unit.
4. Exact duplicate fact values collapse. A tag/date/unit context with conflicting values is not accepted for that metric.
5. Both revenue values must be positive. At least one complete operating- or net-profit pair is required. Unavailable metric fields are blank, never imputed as zero.
6. If a mapped revenue tag has more than one valid unit series, the tie-break is the end date closest to the filing period, latest end date, taxonomy version, then unit code.

## Calculations and trend rule

For prior year 0 and current year 1:

- revenue change = `revenue_1 - revenue_0`;
- revenue change % = `(revenue_1 - revenue_0) / revenue_0 × 100`;
- operating margin % = `operating profit / revenue × 100`;
- net margin % = `net profit / revenue × 100`;
- margin change in percentage points = `current margin - prior margin`;
- composite margin change = mean of the available operating- and net-margin changes.

Percentage fields are computed with decimal arithmetic and exported to six decimal places. Monetary values remain in raw filing units. Each available margin change is improving at **≥ +0.500000 pp**, worsening at **≤ −0.500000 pp**, and neutral between those boundaries. “Improving” requires at least one improving and no worsening signal; “worsening” is the reverse; “mixed” has both; “stable” has only neutral signals. A one-metric company is classified from that metric alone and identified by `metrics_used`.

## Validation and reproducibility

Generation asserts one row per CIK, allowed forms, nonfinancial SICs, positive revenue, exact date and unit alignment, annual spacing, accepted presented tags, finite arithmetic, and classification consistency. The written CSV is read back and every change, growth rate, margin, composite, missing-value block, and classification is recomputed. Exact source facts for the following nonoverlapping examples were also checked against the retained `sub`, `pre`, and `num` records:

| Check type | Company | Filing | Taxonomy | Revenue tag | Profit tag(s) | Periods |
|---|---|---|---|---|---|---|
| US-GAAP | HEALTHIER CHOICES MANAGEMENT CORP. | `0001493152-26-013232` | us-gaap | `RevenueFromContractWithCustomerExcludingAssessedTax` | `OperatingIncomeLoss, NetIncomeLoss` | 2024-12-31 → 2025-12-31 |
| IFRS | POET TECHNOLOGIES INC. | `0001493152-26-014253` | ifrs | `Revenue` | `ProfitLoss` | 2024-12-31 → 2025-12-31 |
| improving | 4D MOLECULAR THERAPEUTICS, INC. | `0001193125-26-114075` | us-gaap | `RevenueFromContractWithCustomerExcludingAssessedTax` | `OperatingIncomeLoss, NetIncomeLoss` | 2024-12-31 → 2025-12-31 |
| worsening | ADITXT, INC. | `0001213900-26-037529` | us-gaap | `Revenues` | `OperatingIncomeLoss, NetIncomeLoss` | 2024-12-31 → 2025-12-31 |
| mixed | INHIBRX BIOSCIENCES, INC. | `0002007919-26-000006` | us-gaap | `Revenues` | `OperatingIncomeLoss, NetIncomeLoss` | 2024-12-31 → 2025-12-31 |
| stable | TJX COMPANIES INC /DE/ | `0000109198-26-000008` | us-gaap | `RevenueFromContractWithCustomerIncludingAssessedTax` | `NetIncomeLoss` | 2025-01-31 → 2026-01-31 |
| net-only | AST SPACEMOBILE, INC. | `0001780312-26-000006` | us-gaap | `RevenueFromContractWithCustomerIncludingAssessedTax` | `NetIncomeLoss` | 2024-12-31 → 2025-12-31 |
| operating-only | RENOVORX, INC. | `0001193125-26-131928` | us-gaap | `Revenues` | `OperatingIncomeLoss` | 2024-12-31 → 2025-12-31 |

The analysis is implemented with Python's standard library in `scripts/src/scripts/analysis.py`. From `sec-02/scripts`, run `uv run scripts`. Paths are resolved from the installed source location, so the command does not depend on the caller's working directory.

## Comparability limitations

- This is a within-company trend screen, not a cross-company profitability ranking. Fiscal year ends, business models, currencies, and units differ.
- No currency conversion is performed. Same-unit alignment makes each company's change internally coherent but does not make raw monetary values comparable across companies.
- Annual facts can reflect 52- or 53-week years; `qtrs=4` and the 330–400 day rule allow those calendars but do not normalize week counts.
- Taxonomy tags improve consistency but do not eliminate accounting-policy differences. `Revenues` can be broader than contract revenue, and the fallback `ProfitLoss` can include noncontrolling interests.
- Operating profit is unavailable for some IFRS or custom-extension filers. One-metric classifications are less corroborated than two-metric classifications.
- Acquisitions, divestitures, discontinued operations, impairments, tax effects, and one-time gains or losses can cause large margin changes without indicating a persistent operating trend.
- Requiring positive mapped revenue and standard tags favors established filers with conventional statements and excludes pre-revenue entities and companies using unmapped custom totals.
- The data are filing facts, not a restatement-adjusted longitudinal database assembled across later filings. Comparing two periods reported together improves consistency but does not remove all recast or tagging risk.
