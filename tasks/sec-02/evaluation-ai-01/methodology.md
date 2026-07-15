# Companies Improving Profitability

## Answer at a glance

The output contains 2,558 companies with one comparable annual filing per company. The year-over-year classification is:

| Classification | Companies | Share |
| --- | ---: | ---: |
| Improving | 1,041 | 40.7% |
| Declining | 930 | 36.4% |
| Mixed or flat | 587 | 22.9% |

For a more apples-to-apples scale check, I also examined the 1,054 USD-reporting companies with revenue of at least $1 billion in both periods. That cohort has 340 improving, 384 declining, and 330 mixed/flat companies. Its median net-margin change is **-0.27 percentage points** and its median revenue growth is **+4.41%**. Within the three classifications, median net-margin changes are +3.23 pp (improving), -3.61 pp (declining), and -0.19 pp (mixed/flat).

Examples in the large-USD cohort that appear to be improving are AT&T (+8.52 pp net margin, +3.66 pp operating margin), Reddit (+61.30 pp, +63.18 pp), Vertex Pharmaceuticals (+37.80 pp, +36.89 pp), and Intel (+34.82 pp, +17.80 pp). Examples moving the other way are Meta (-7.82 pp, -0.74 pp), Ford (-7.54 pp, -7.72 pp), General Motors (-1.90 pp, -5.72 pp), Kraft Heinz (-34.06 pp, -25.23 pp), and Tesla (-3.26 pp, -2.65 pp). These are examples, not a ranking of every company; the CSV contains the complete classified population.

## Data and scope

The analysis uses the SEC financial statement data release in `datasets/sec_financial_statement_notes`:

- `fsds_2026q1_sub.csv` for filing and company identifiers;
- `fsds_2026q1_pre.csv` for income-statement presentation lines and labels; and
- `fsds_2026q1_num.csv` for numeric XBRL facts.

The June notes files in the same directory are not needed for revenue or profitability measures, so they are not used. The release is described in `metadata.json` as the 2026 Q1 financial-statement set. The latest annual filing available for each CIK was selected from `10-K`, `10-K/A`, `10-KT`, `20-F`, `20-F/A`, `40-F`, or `40-F/A` records with `fp = FY`. A filing is selected by the latest fiscal period, then filing/acceptance date. This produces one filing per CIK and avoids mixing multiple filings for the same company.

Only annual duration facts (`qtrs = 4`) are used. The current period is the filing's fiscal-period end date. The prior period is the latest earlier annual date present in the same filing, so the two measures come from the same XBRL filing and are aligned to that filer’s own fiscal year. Rows are retained only when the period gap is 330–400 days; 2,557 rows are 365 or 366 days apart and one is 395 days apart. The retained filing periods range from 2023-12-31 through 2026-01-31 because the release contains filings with different fiscal year-ends.

Additional inclusion rules:

- consolidated facts only (`segments` and `coreg` blank/null);
- revenue and net-income facts must use the same reported unit/currency;
- both current and prior revenue and net-income values must be present and revenue must be positive in both periods; and
- SIC 6000–6799 companies are excluded because their primary statements generally do not provide a comparable revenue line; inventing a revenue proxy for banks would make the margin comparison less consistent.

The final file has 2,558 unique CIKs. Operating income is available for 2,309 rows; the remaining 249 rows use net-income margin only.

## Tag mappings

The tag used for each row is preserved in the CSV so that a reader can audit the mapping.

| Measure | Mapping used | Fallback/notes |
| --- | --- | --- |
| Revenue | Priority order: `RevenueFromContractWithCustomerExcludingAssessedTax`, `RevenueFromContractWithCustomerIncludingAssessedTax`, `Revenues`, `SalesRevenueNet`, `SalesRevenue` | If none of those has both annual observations, a primary income-statement tag containing revenue/premium is accepted when its presentation label contains revenue, sales, premium, or turnover. Tags labelled as loss, comprehensive income, securities, expense, or cost are excluded. |
| Net income | Priority order: `NetIncomeLoss`, `ProfitLoss`, `NetIncome`, `NetLoss` | If needed, a primary income-statement tag containing net income, net loss, or profit/loss is used. `NetIncomeLoss` is attributable to the parent; `ProfitLoss` can include noncontrolling interests, so the selected tag is exposed in `net_income_tag`. |
| Operating income | `OperatingIncomeLoss` only | The measure is optional. Other operating/non-operating tags are not substituted because their economics differ; missing values are shown as null and the classification falls back to net margin. |

## Measures and classification

Amounts retain the scale and currency reported by the filer (`revenue_unit`). For each company:

- `revenue_change = revenue_current - revenue_prior`;
- `revenue_change_pct = 100 × (current - prior) / abs(prior)`;
- the same absolute change and absolute-prior percentage convention is used for net and operating income changes;
- `net_margin_current_pct = 100 × net_income_current / revenue_current`, with the analogous prior-period value; and
- `net_margin_change_pp` is current net margin minus prior net margin. Operating-margin fields are calculated the same way when operating income exists.

Income-change percentages can be unstable when the prior income is close to zero or negative; the margin change in percentage points is the primary profitability signal.

The `trend_classification` rule is deliberately conservative:

- **improving**: when operating income exists, both net-margin and operating-margin changes are at least +0.5 pp; when it does not, net-margin change is at least +0.5 pp;
- **declining**: the corresponding available measure(s) are at most -0.5 pp; and
- **mixed_or_flat**: the two margins disagree, or the available change is within ±0.5 pp.

This identifies apparent accounting-margin movement rather than proving a recurring or causal improvement in the underlying business.

## Main findings

The full included population is slightly more positive than negative because small or early-stage issuers are well represented: 1,041 improve and 930 decline. The large-USD sensitivity cohort reverses that balance: 36.4% decline versus 32.3% improve, with a slightly negative median net-margin change. Revenue growth alone is not enough to establish improving profitability: for example, Meta grew revenue 22.2% but both profitability margins weakened, while AT&T grew revenue 2.7% and expanded both margins.

The rule also prevents a one-metric result from being overstated. Amazon is mixed/flat (+1.55 pp net margin, +0.40 pp operating margin), Alphabet is mixed/flat (+4.21 pp net, -0.08 pp operating), and NVIDIA is mixed/flat (-0.25 pp net, -2.04 pp operating) under the ±0.5 pp threshold.

## Validation checks

The generated CSV was independently checked after writing:

- 2,558 rows, 2,558 distinct filings, and 2,558 distinct CIKs (no duplicate company rows);
- no null current/prior revenue or net-income values;
- no non-positive revenue values;
- every `current_period` equals the filing period and every prior period precedes it;
- revenue and net-income units match on every row; and
- an independent recomputation of the classification rule produced zero mismatches.

## Comparability limitations

1. XBRL tagging and presentation vary across issuers and across US GAAP/IFRS. The fallback revenue mapping increases coverage but cannot make all business-model definitions identical; inspect `revenue_tag`, `net_income_tag`, and `operating_income_tag` before using a row for detailed diligence.
2. Results are within-company changes in each filer’s reported currency. Revenue levels are not comparable across currencies, and no FX conversion is performed. The $1 billion sensitivity results intentionally use USD rows only.
3. Net income and operating income can contain impairments, restructuring, tax settlements, divestiture gains, fair-value movements, and other one-time items. A large margin swing is therefore not evidence of a durable operating improvement without reading the filing notes.
4. Fiscal years are not all calendar years; one retained comparison spans 395 days. Companies with gaps outside 330–400 days were excluded. Fiscal year-end changes and 52/53-week calendars can still affect comparisons.
5. Operating income is unavailable for some issuers, so their classification is based on net margin alone. `ProfitLoss` versus `NetIncomeLoss` also differs in treatment of noncontrolling interests.
6. The population is limited to issuers with an eligible annual filing, both annual observations, a mapped revenue line, and positive revenue. It is not a survivorship-neutral view of every public company or a causal estimate.

## Reproducibility and file contents

The SQL used to build the output is [scripts/profitability.sql](/home/jacob/Projects/evaluation/scripts/profitability.sql). From the repository root, rerun it with `duckdb < scripts/profitability.sql`; it rewrites [profitability_trends.csv](/home/jacob/Projects/evaluation/task/profitability_trends.csv).

The CSV includes identifiers and filing metadata (`adsh`, `cik`, `company_name`, `sic`, `form`, fiscal/filed dates), aligned periods (`current_period`, `prior_period`, `period_gap_days`), reported revenue and both income measures with their reported units and changes, net and operating margins with percentage-point changes, the measure-coverage flag, and `trend_classification`.
