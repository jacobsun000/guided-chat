# Methodology: Financial Statements That Do Not Add Up

## Scope

This analysis audits primary financial statements in the SEC **June 2026 Financial Statement and Notes Data Set**. It uses filer-supplied XBRL calculation relationships. The 2026 Q1 Financial Statement Data Set is intentionally excluded: its supplied files contain facts and presentation order but no filing-specific calculation relationships, so including it would require unreliable label/order heuristics.

All filing forms are eligible. A report is tested only when `ren.menucat = S`, `pre.inpth = 0`, and `pre.stmt` is one of `BS`, `IS`, `CF`, `CI`, or `EQ`.

## Sources and joins

- `fsnds_2026_06_sub.csv`: filer name and accession (`adsh`).
- `fsnds_2026_06_ren.csv`: rendered report category and name.
- `fsnds_2026_06_pre.csv`: primary-statement code, report, concept/version, line label, and parenthetical flag.
- `fsnds_2026_06_cal.csv`: parent/child calculation arcs and signed weights (the source column is named `negative`).
- `fsnds_2026_06_num.csv`: values, periods, units, dimensional contexts, co-registrants, and decimal precision.
- `fsnds_2026_06_dim.csv`: readable dimension members for nonzero dimension hashes.

Submission data join on `adsh`. Presentation and rendering join on `(adsh, report)`. Calculation concepts and facts match on exact `(adsh, tag, version)`. Calculation `grp` is used to keep each filer-defined calculation network separate; it is not assumed to equal presentation `report`.

## Calculation rules

1. Arcs are grouped by `(adsh, grp, ptag, pversion)`. The numeric `negative` field is used as the signed weight.
2. A relationship must have at least two distinct child concepts. Duplicate arcs with the same child and weight collapse; conflicting child weights exclude the relationship.
3. The parent and **every** child concept/version must occur together in exactly one eligible primary presentation report. No match and multiple matches are both excluded.
4. Parent and children must have the same complete available numeric context: period end (`ddate`), duration (`qtrs`), unit (`uom`), dimension hash (`dimh`), and co-registrant (`coreg`). Missing children are unknown, not zero. Dimension-member rollups are not inferred.
5. Identical duplicate fact values collapse. If duplicate occurrences disagree, or a value/precision is unusable, that context is excluded.
6. The reconstructed total is `sum(weight × child value)`. **Difference is reported total minus reconstructed total.** Arithmetic uses Python `Decimal` with 60-digit precision.

## Tolerance

Tolerance follows XBRL decimal precision rather than a fixed dollar or percentage threshold. For a fact with `dcml = d`, rounding uncertainty is:

`0.5 × 10^(-d)`

`INF`/exact precision has zero uncertainty. A relationship's combined tolerance is the parent uncertainty plus `sum(abs(weight) × child uncertainty)`. A row is flagged only when `abs(difference)` is strictly greater than this bound. This permits all rounding outcomes supported by the reported precisions while avoiding a subjective materiality threshold.

## Coverage and outcomes

| Measure | Count |
|---|---:|
| June submissions | 7,292 |
| Rendering reports categorized as statements | 5,166 |
| Eligible primary reports with calculation concepts | 4,076 |
| Calculation arcs | 85,333 |
| Parent relationships in source | 24,200 |
| Relationships with at least two children | 22,923 |
| Relationships associated uniquely to a primary report | 14,768 |
| Relationships not fully present on one primary report | 8,054 |
| Relationships ambiguous across primary reports | 101 |
| Candidate parent contexts | 72,961 |
| Skipped: missing child fact | 34,731 |
| Skipped: conflicting parent/child facts | 785 |
| Skipped: unusable value/precision | 8,081 |
| Complete eligible checks | 29,364 |
| Checks within tolerance | 28,919 |
| Issues in `statement_issues.csv` | 439 |

Additional exclusions: 1,277 one-child relationships, 0 relationships with conflicting arc weights, and 7 associated relationships without a parent numeric fact.

## Validation checks

The generator enforces the exact requested CSV schema and deterministic sorting. Before a check is eligible, it verifies exact concept versions, common context and units, full child coverage, finite decimal values, usable precision, a unique primary-report association, and submission metadata. Output rows are reconstructed directly from the retained source facts and must exceed their computed precision tolerance. Synthetic tests cover signed weights, tolerance boundaries, missing/context-mismatched children, duplicate handling, duration/instant periods, and dimensions.

Representative flagged and passing checks were also inspected after generation. For example, PYXIS TANKERS INC.'s 2024-12-31 `Assets` fact reported USD 188,881,000 versus reconstructed USD 186,317,000 (difference USD 2,564,000; tolerance USD 1,500). A duration example for PERCEPTIVE CAPITAL SOLUTIONS CORP reconstructed the three-quarter cash change as USD -86,603,623 versus reported USD 1,129,684 (difference USD 87,733,307; tolerance USD 1.50). As a nearby passing control, LIVEONE, INC.'s 2025-03-31 `LiabilitiesCurrent` fact and components both reconstructed to USD 36,384,000 (difference zero; tolerance USD 17,000).

## Caveats

- A flag is an inconsistency among reported XBRL facts under a filer-supplied calculation link; it does **not** by itself prove an accounting error or audited-statement misstatement.
- Calculation linkbases can themselves be incomplete or incorrectly modeled. Conversely, relationships with missing children are skipped, so this is a conservative screen and not a completeness audit.
- Requiring every calculation concept to appear in one unambiguous primary presentation reduces false associations between calculation groups and presentation reports but can omit valid checks.
- `qtrs` and `ddate` are the normalized period fields supplied by the SEC extract; a period start date is not available in this numeric table.
- Dimension contexts are compared only for equality. The analysis does not infer sums across members, classes, segments, or co-registrants.
- Results cover only filings represented in the June 2026 release and should not be generalized to other periods.
