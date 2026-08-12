# Revenue Comparability Methodology

## Answer in brief

The reported figures are technically comparable after enforcing the same annual, current-period, monetary, and consolidated context, but semantic comparability is materially weaker. A common XBRL tag does not guarantee identical economic scope, while broad, tax-inclusive, financial, insurance, regulated, and custom concepts introduce additional differences. This analysis therefore preserves the raw fact and assigns a family and comparability tier rather than treating all values as interchangeable.

## Data and cohort

The analysis uses the supplied `2026 Q1 Financial Statement Data` and `2026 June Financial Statement and Notes Data` CSV releases. It found 4,262 and 130 exact `10-K` submission rows, respectively (4,262 and 130 unique accessions after source attribution). The union contains **4,392 unique exact 10-K accessions**. It does not represent filings from omitted months.

The output is fact-level: one selected current-year top-line fact per eligible filing. It is not a pairwise table. The comparison reference is consolidated annual USD general-company revenue, especially `RevenueFromContractWithCustomerExcludingAssessedTax`.

## Joins and eligibility

1. `sub.csv` identifies exact `10-K` filings and supplies filer and fiscal metadata. Amendments and other forms are excluded.
2. `pre.csv` is restricted to non-parenthetical income-statement (`stmt=IS`, `inpth=0`) lines. Revenue candidates come from an explicit standard-tag table or a potential company-extension revenue/sales line.
3. `tag.csv` must identify the selected concept as monetary and duration (`datatype=monetary`, `iord=D`). Standard tags are mapped only by the code's explicit table. Company extensions are mapped only by an accession-and-tag override reviewed against label, definition, position, and value.
4. `num.csv` must match the submission period end, have `qtrs=4`, and have no co-registrant. Q1 `segments` must be blank. June `dimh`/`dimn` must identify no dimensions. Dimensional components are never summed to construct a total.
5. For duplicate June numeric occurrences, occurrence `iprx=1` is preferred when available, otherwise the lowest occurrence is used. `iprx` distinguishes otherwise identical context keys; it is not a direct presentation-line foreign key.
6. Candidate ranking favors an explicit total label, then broad revenue/sales wording, a complete income-statement report, position before the first cost/gross-profit line, later placement within the opening revenue block, and finally semantic breadth. Equal top-ranked candidates with different values/families are rejected. Multiple units for the same candidate concept are also rejected.

SEC amounts are preserved as filed. They are not scaled and no currency conversion is performed. `ddate` and `qtrs` are rounded SEC data-set fields, so the exact start date is unavailable.

## Selection funnel

| Selection stage / outcome | Filings |
|---|---:|
| Exact 10-K rows in Q1 source | 4,262 |
| Exact 10-K rows in June source | 130 |
| Unique exact 10-K accessions after union | 4,392 |
| Eligible selected facts | 3,114 |
| Excluded — No recognized revenue/sales presentation candidate | 954 |
| Excluded — Only unreviewed or unsupported concepts | 42 |
| Excluded — No current annual consolidated fact for a recognized concept | 175 |
| Excluded — Multiple-unit tie | 0 |
| Excluded — Insufficient evidence that candidate is the total top line | 107 |
| Excluded — Unresolved equally ranked candidate facts | 0 |

Excluded filings remain outside `revenue_comparability.csv`; the funnel makes the eligibility boundary explicit.

## Mapping and comparability rubric

- **High:** current annual, USD, consolidated facts on a directly aligned standardized general revenue concept, principally contract revenue excluding assessed tax.
- **Moderate:** technically aligned broad standardized revenue, legacy net sales, a clearly reviewed custom total, a tax-inclusive concept, or an adjacent regulated/industry concept whose scope needs caution.
- **Low / not directly comparable:** net-interest or other materially netted financial measures, insurance-specific bases, narrow lease/rental bases, non-USD facts without conversion, or other material scope differences.

`mapping_confidence` concerns confidence in assigning a raw tag to a family; it is separate from economic comparability. A specialized standard tag can have a High-confidence mapping and still receive a Low comparability tier. Comparisons within the same `normalized_semantic_family` are generally stronger than comparisons across families, but accounting-policy and business-model differences remain.

## Findings

- Only **1,586 of 3,114 (50.9%)** selected facts meet the strict High benchmark. The remaining facts are Moderate (1,483, 47.6%) or Low/not directly comparable (45, 1.4%) because concept scope or unit differs.
- Standard taxonomy concepts account for **3,095 (99.4%)** rows; **19 (0.6%)** use filing-specific reviewed extensions.
- **3,109 (99.8%)** facts are USD. The 5 non-USD facts remain as filed and are rated Low without FX conversion.
- Fiscal period ends span **10 calendar months**. All facts are four-quarter annual observations, but they are not calendar-aligned across filers.
- Every output row is explicitly dimensionless and has no co-registrant by construction. This improves technical comparability but does not harmonize underlying business economics.

### Overall comparability

| Tier | Rows | Share |
|---|---:|---:|
| High | 1,586 | 50.9% |
| Moderate | 1,483 | 47.6% |
| Low | 45 | 1.4% |

### Semantic families

| Normalized semantic family | Rows | Share |
|---|---:|---:|
| contract_revenue_excluding_assessed_tax | 1,589 | 51.0% |
| broad_general_total_revenue | 1,229 | 39.5% |
| contract_revenue_including_assessed_tax | 226 | 7.3% |
| regulated_or_industry_specific_revenue | 34 | 1.1% |
| net_interest_or_financial_revenue | 22 | 0.7% |
| other_specialized_revenue | 13 | 0.4% |
| insurance_revenue | 1 | 0.0% |

### Most-used raw taxonomy tags

| Taxonomy tag | Rows | Share |
|---|---:|---:|
| RevenueFromContractWithCustomerExcludingAssessedTax | 1,588 | 51.0% |
| Revenues | 1,225 | 39.3% |
| RevenueFromContractWithCustomerIncludingAssessedTax | 225 | 7.2% |
| RevenuesNetOfInterestExpense | 19 | 0.6% |
| RegulatedAndUnregulatedOperatingRevenue | 14 | 0.4% |
| OperatingLeaseLeaseIncome | 11 | 0.4% |
| RegulatedOperatingRevenue | 4 | 0.1% |
| RevenuesAndOtherIncome | 3 | 0.1% |
| RevenueFromCollaborativeArrangementExcludingRevenueFromContractWithCustomer | 3 | 0.1% |
| LeaseIncome | 2 | 0.1% |
| RevenuesAndOtherIncomeNet | 1 | 0.0% |
| PremiumsEarnedNet | 1 | 0.0% |

### Standard versus custom

| Mapping source | Rows | Share |
|---|---:|---:|
| Standard | 3,095 | 99.4% |
| Custom | 19 | 0.6% |

### Units

| Unit | Rows | Share |
|---|---:|---:|
| USD | 3,109 | 99.8% |
| CAD | 4 | 0.1% |
| EUR | 1 | 0.0% |

### Source coverage

| Source release | Rows | Share |
|---|---:|---:|
| 2026 Q1 Financial Statement Data | 3,012 | 96.7% |
| 2026 June Financial Statement and Notes Data | 102 | 3.3% |

### Fiscal period-end months

| Month (MM) | Rows | Share |
|---|---:|---:|
| 12 | 2,884 | 92.6% |
| 01 | 92 | 3.0% |
| 03 | 53 | 1.7% |
| 11 | 25 | 0.8% |
| 10 | 22 | 0.7% |
| 04 | 22 | 0.7% |
| 09 | 10 | 0.3% |
| 02 | 3 | 0.1% |
| 05 | 2 | 0.1% |
| 07 | 1 | 0.0% |

## Traceable validation examples

- **Canonical standardized concept.** **ABBOTT LABORATORIES** (`0001628280-26-010185`): `RevenueFromContractWithCustomerExcludingAssessedTax` / “Net Sales”, 44328000000.0000 USD for 20251231; mapped to `contract_revenue_excluding_assessed_tax` and rated **High**.
- **Broad alternative standard concept.** **ACME UNITED CORP** (`0001193125-26-102079`): `Revenues` / “Net sales”, 196541816.0000 USD for 20251231; mapped to `broad_general_total_revenue` and rated **Moderate**.
- **Specialized reporting basis.** **AMERICAN EXPRESS CO** (`0000004962-26-000080`): `RevenuesNetOfInterestExpense` / “Total revenues net of interest expense”, 72229000000.0000 USD for 20251231; mapped to `net_interest_or_financial_revenue` and rated **Low**.
- **Reviewed company extension.** **VALHI INC /DE/** (`0001104659-26-025847`): `RevenuesAndOtherIncomeNet` / “Total revenues and other income”, 2136100000.0000 USD for 20251231; mapped to `other_specialized_revenue` and rated **Moderate**.
- **Rejected dimensional fact.** **ADVANCED MICRO DEVICES INC** (`0000002488-26-000018`) also reported `RevenueFromContractWithCustomerExcludingAssessedTax` = 14550000000.0000 USD with dimensions `BusinessSegments=ClientAndGaming;ConsolidationItems=OperatingSegments;`. The row was rejected rather than summed; only its independently reported consolidated fact could qualify.

The pipeline also reparses the final CSV and checks every selected row against the in-memory submission, presentation, fact, and taxonomy records. It asserts exact form, current period, four quarters, monetary duration metadata, no dimensions/co-registrant, valid numeric values, unique accessions, approved standard rules, and explicit custom overrides.

## Limitations

- The supplied releases cover Q1 and June 2026, not a continuous annual filing population; results should not be generalized to all 2026 filers.
- `qtrs=4` and `ddate` are rounded SEC data-set fields and do not provide exact period starts or 52/53-week duration details. Fiscal year ends vary.
- Taxonomy alignment cannot resolve business-model differences, gross-versus-net presentation, principal-versus-agent judgments, assessed-tax treatment, revenue-recognition policies, or what management includes in “other income.”
- Absolute revenue is a size measure, not a performance-normalized comparison. No inflation, exchange-rate, or industry normalization is applied.
- Non-USD facts are retained as filed but are not converted and are rated Low.
- Company-extension mappings are filing-specific, manually controlled overrides; they should not be generalized to similarly named tags in other filings.
- Excluding filings without an unambiguous consolidated total introduces selection bias, particularly for financial institutions that present interest and noninterest components without one tagged total.
- The source data are filer-supplied, as-filed XBRL. This analysis validates internal joins and context, not the underlying filing's accounting accuracy.
