# When Riders Tip More

## Answer

This analysis covers **2,600,251 eligible card-paid yellow and green taxi trips** picked up in April 2026. “More generous” primarily means a larger tip relative to the pre-tip bill; dollar tips and the probability of leaving any recorded tip are separate outcomes.

- **Late evening is the clearest high-tip period; morning is the low.** Both have a 20.00% median because preset-like values are common, but 93.81% of late-evening trips have a positive tip versus 83.90% in the morning. After removing only the top 0.1% of tip ratios, mean tip percentage is 17.34% versus 15.58%. Standardizing to the same taxi-type/bill mix leaves the pattern intact (17.51% versus 15.41%).
- **Weekend tipping is only modestly higher.** For day of week, median tip rates tie at about 20.00%; the clearer separation is tipping frequency: **Saturday** has 91.50% positive tips versus 88.83% for **Monday** (2.67 percentage points). The standardized weekend-versus-weekday mean-rate difference is small, so the broader late-evening pattern is more practically important than the exact day ranking.
- **Smaller/shorter trips have the highest relative tipping; medium-long trips have the weakest.** The `<$15` bill band has a 20.00% median and 95.32% positive-tip share, compared with 19.26% and 73.27% for `$40–<70`. Similarly, `(0,1]`-mile trips have a 20.00% median/94.36% positive share versus 19.19%/70.34% for `(7,15]` miles. The pattern is not monotone: the `$70+` and `>15`-mile groups rebound somewhat.
- **Pickup market is strongly associated with recorded tipping.** Manhattan trips have a 20.00% median and 93.51% positive-tip share; Bronx trips have 0.00% and 2.65%, and Brooklyn trips have 0.00% and 17.67%. Such large differences likely mix rider behavior with service, market, vendor, and payment-recording differences and should not be read as a neighborhood quality judgment.
- **Airport trips tip more often and much more in dollars, but not at a higher median percentage.** Airport-related trips have a 94.47% positive-tip share and $12.30 median tip, versus 89.60% and $3.09 otherwise. Their median tip rate is 19.48% versus 20.00% (-0.52 points), although their mean rate is slightly higher.
- **Taxi types differ modestly overall.** Green taxis have a 20.00% median, 91.86% positive-tip share, and 18.35% mean rate; yellow taxis have 20.00%, 90.02%, and 16.88%. Green trips are only 1.08% of the eligible sample.
- Tip **dollars** rise strongly with bill size: the median is $15.80 in the $70+ band versus $2.40 in the <$15 band. That is not by itself greater generosity, because the bills differ.

The robust medians and IQRs below should receive more weight than raw means. Card interfaces often produce common percentage values, which can make medians tie; in those cases tipping frequency and the tail sensitivity provide additional context. These are descriptive associations, not causal effects.

## Scope and method

### Included services

The source is the TLC monthly trip-record dataset supplied for April 2026. The analysis combines `yellow_tripdata_2026-04.csv` and `green_tripdata_2026-04.csv`. It deliberately does **not** use FHV records (no tip field) or HVFHV/app-based records (no comparable taxi `payment_type` field). Pickup local clock time is used as recorded.

### Eligibility

The filters are sequential. An eligible record must have an April pickup and parseable dropoff; `payment_type = 1`; finite fare, total, tip, and distance plus nonmissing pickup/dropoff zone IDs; duration in (0, 6 hours]; distance in (0, 100 miles]; positive fare and pre-tip bill; and a nonnegative tip. Upper duration and distance limits are broad plausibility screens, not assertions that every excluded record is fraudulent.

| Funnel stage | All | Yellow | Green | Excluded at stage | Retained from source |
| --- | --- | --- | --- | --- | --- |
| All source rows | 3,875,478 | 3,831,240 | 44,238 | — | 100.00% |
| Valid April pickup and parseable dropoff | 3,875,463 | 3,831,228 | 44,235 | 15 | 100.00% |
| Credit card (`payment_type = 1`) | 2,664,818 | 2,635,740 | 29,078 | 1,210,645 | 68.76% |
| Finite required values and nonmissing zone IDs | 2,664,818 | 2,635,740 | 29,078 | 0 | 68.76% |
| Duration in (0, 6h] and distance in (0, 100 mi] | 2,600,382 | 2,572,423 | 27,959 | 64,436 | 67.10% |
| Positive fare/pre-tip bill and nonnegative tip (eligible) | 2,600,251 | 2,572,293 | 27,958 | 131 | 67.09% |

The funnel reconciles to 3,875,478 source rows, and counts are monotone. “Excluded at stage” is relative to the immediately preceding row; yellow and green columns sum to “All.”

### Payment type

The payment table uses date-valid April records (the second funnel row), before other quality filters.

| Taxi type | Payment type | Trips | Within taxi type |
| --- | --- | --- | --- |
| Yellow | 0 — outside standard code list | 799,786 | 20.88% |
| Yellow | 1 — credit card | 2,635,740 | 68.80% |
| Yellow | 2 — cash | 360,992 | 9.42% |
| Yellow | 3 — no charge | 11,792 | 0.31% |
| Yellow | 4 — dispute | 22,918 | 0.60% |
| Green | Missing | 6,290 | 14.22% |
| Green | 1 — credit card | 29,078 | 65.74% |
| Green | 2 — cash | 8,530 | 19.28% |
| Green | 3 — no charge | 241 | 0.54% |
| Green | 4 — dispute | 96 | 0.22% |

TLC states that `tip_amount` is populated automatically for credit-card tips and does not include cash tips. Cash rows therefore cannot be treated as zero-tip observations. Restricting to card trips makes the tip measure observable but selects a nonrandom rider/trip population. Code `0` and missing payment values are shown rather than assigned a meaning from the standard 1–6 code list; they are excluded from the card analysis.

### Tip measures

- **Pre-tip bill** = `total_amount - tip_amount`.
- **Tip percentage** = `100 × tip_amount / pre-tip bill`, with zero-tip card trips retained. This is the primary relative-generosity measure.
- **Positive tip** = `tip_amount > 0`.
- **Bill-weighted tip rate** = `100 × sum(tips) / sum(pre-tip bills)`; it gives more weight to expensive trips.
- Means, medians, and the 25th–75th percentile range (IQR) are reported. Dollar and percent measures answer different questions.

A source-row spot check verifies that a zero tip produces 0%, and that $4.25 on a $21.35 pre-tip bill produces 19.91%.

## Overall eligible-trip summary

| Scope | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All eligible | 2,600,251 | 90.04% | $4.19 | $3.26 | 16.89% | 20.00% | 12.74%–20.00% | 16.22% |

## Time comparisons

### Taxi type

| Taxi type | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Yellow | 2,572,293 | 90.02% | $4.19 | $3.28 | 16.88% | 20.00% | 12.70%–20.00% | 16.20% |
| Green | 27,958 | 91.86% | $3.82 | $3.09 | 18.35% | 20.00% | 14.96%–20.00% | 17.66% |

### Weekday versus weekend

| Day type | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Weekday | 1,966,713 | 89.62% | $4.21 | $3.31 | 16.82% | 20.00% | 12.48%–20.00% | 16.11% |
| Weekend | 633,538 | 91.38% | $4.12 | $3.10 | 17.13% | 20.00% | 13.56%–20.00% | 16.56% |

### Day of week

| Pickup day | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Monday | 311,014 | 88.83% | $4.34 | $3.29 | 16.68% | 20.00% | 12.06%–20.00% | 15.88% |
| Tuesday | 358,588 | 89.97% | $4.15 | $3.31 | 16.86% | 20.00% | 12.70%–20.00% | 16.12% |
| Wednesday | 460,821 | 89.93% | $4.19 | $3.31 | 16.91% | 20.00% | 12.82%–20.00% | 16.20% |
| Thursday | 482,192 | 90.05% | $4.27 | $3.37 | 16.90% | 20.00% | 12.79%–20.00% | 16.26% |
| Friday | 354,098 | 88.95% | $4.10 | $3.23 | 16.67% | 20.00% | 11.97%–20.00% | 15.98% |
| Saturday | 349,660 | 91.50% | $3.92 | $3.09 | 17.13% | 20.00% | 13.56%–20.00% | 16.58% |
| Sunday | 283,878 | 91.23% | $4.36 | $3.10 | 17.13% | 20.00% | 13.61%–20.00% | 16.55% |

### Time of day

| Pickup period | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Overnight (00:00–05:59) | 159,856 | 86.56% | $4.01 | $3.10 | 16.08% | 20.00% | 9.99%–20.00% | 15.34% |
| Morning (06:00–09:59) | 325,562 | 83.90% | $3.53 | $2.80 | 15.69% | 20.00% | 9.97%–20.00% | 14.36% |
| Midday (10:00–15:59) | 859,749 | 88.89% | $4.20 | $3.16 | 16.99% | 20.00% | 13.36%–20.00% | 16.16% |
| Evening commute (16:00–19:59) | 709,453 | 92.15% | $4.39 | $3.51 | 17.06% | 20.00% | 13.36%–20.00% | 16.61% |
| Late evening (20:00–23:59) | 545,631 | 93.81% | $4.36 | $3.43 | 17.49% | 20.00% | 14.98%–20.00% | 17.09% |

### Weekday/weekend × time of day

Each cell shows median tip percentage, positive-tip share, and trip count.

| Day type | Overnight (00:00–05:59) | Morning (06:00–09:59) | Midday (10:00–15:59) | Evening commute (16:00–19:59) | Late evening (20:00–23:59) |
| --- | --- | --- | --- | --- | --- |
| Weekday | 20.00% median; 84.11% positive; n=69,948 | 20.00% median; 83.58% positive; n=281,732 | 20.00% median; 87.94% positive; n=645,912 | 20.00% median; 91.94% positive; n=548,110 | 20.00% median; 94.11% positive; n=421,011 |
| Weekend | 20.00% median; 88.47% positive; n=89,908 | 20.00% median; 85.93% positive; n=43,830 | 20.00% median; 91.75% positive; n=213,837 | 20.00% median; 92.88% positive; n=161,343 | 20.00% median; 92.80% positive; n=124,620 |

### Composition-standardized temporal check

For each temporal group, cell means were calculated within the joint 10-cell mix of taxi type (yellow/green) and pre-tip-bill band, then averaged using the **overall eligible-sample** stratum weights. This direct standardization asks whether raw temporal patterns are explained by a different service/bill mix. It is a descriptive composition adjustment, not a causal model. Weight coverage is 100% when every joint stratum is observed in the temporal group.

| Comparison | Group | Trips | Raw positive tip | Standardized positive tip | Raw mean tip % | Standardized mean tip % | Stratum-weight coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Weekday/weekend | Weekday | 1,966,713 | 89.62% | 89.81% | 16.82% | 16.87% | 100.00% |
| Weekday/weekend | Weekend | 633,538 | 91.38% | 91.05% | 17.13% | 17.01% | 100.00% |
| Day of week | Monday | 311,014 | 88.83% | 89.09% | 16.68% | 16.74% | 100.00% |
| Day of week | Tuesday | 358,588 | 89.97% | 90.13% | 16.86% | 16.91% | 100.00% |
| Day of week | Wednesday | 460,821 | 89.93% | 90.11% | 16.91% | 16.96% | 100.00% |
| Day of week | Thursday | 482,192 | 90.05% | 90.32% | 16.90% | 16.98% | 100.00% |
| Day of week | Friday | 354,098 | 88.95% | 88.95% | 16.67% | 16.68% | 100.00% |
| Day of week | Saturday | 349,660 | 91.50% | 91.07% | 17.13% | 16.99% | 100.00% |
| Day of week | Sunday | 283,878 | 91.23% | 90.87% | 17.13% | 17.02% | 100.00% |
| Time of day | Overnight (00:00–05:59) | 159,856 | 86.56% | 86.78% | 16.08% | 16.13% | 100.00% |
| Time of day | Morning (06:00–09:59) | 325,562 | 83.90% | 82.91% | 15.69% | 15.41% | 100.00% |
| Time of day | Midday (10:00–15:59) | 859,749 | 88.89% | 88.65% | 16.99% | 16.91% | 100.00% |
| Time of day | Evening commute (16:00–19:59) | 709,453 | 92.15% | 92.16% | 17.06% | 17.11% | 100.00% |
| Time of day | Late evening (20:00–23:59) | 545,631 | 93.81% | 93.81% | 17.49% | 17.51% | 100.00% |

## Trip-context comparisons

### Pre-tip bill

| Pre-tip bill | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <$15 | 680,588 | 95.32% | $2.29 | $2.40 | 18.58% | 20.00% | 15.44%–20.00% | 18.48% |
| $15–<25 | 1,115,315 | 92.75% | $3.30 | $3.50 | 17.22% | 20.00% | 13.33%–20.00% | 17.15% |
| $25–<40 | 448,677 | 82.98% | $4.64 | $5.35 | 15.22% | 20.00% | 8.14%–20.00% | 15.14% |
| $40–<70 | 219,784 | 73.27% | $7.37 | $8.77 | 13.65% | 19.26% | 0.00%–20.00% | 13.90% |
| $70+ | 135,887 | 91.87% | $14.37 | $15.80 | 16.57% | 19.52% | 12.35%–20.00% | 16.42% |

### Trip distance

| Trip miles | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| (0,1] | 632,692 | 94.36% | $2.47 | $2.44 | 18.36% | 20.00% | 15.07%–20.00% | 18.04% |
| (1,3] | 1,228,938 | 94.28% | $3.38 | $3.43 | 17.54% | 20.00% | 14.98%–20.00% | 17.46% |
| (3,7] | 382,701 | 84.89% | $4.87 | $5.26 | 15.57% | 20.00% | 9.73%–20.00% | 15.74% |
| (7,15] | 232,620 | 70.34% | $7.62 | $9.02 | 13.12% | 19.19% | 0.00%–20.00% | 14.16% |
| >15 | 123,300 | 78.88% | $12.43 | $15.00 | 14.14% | 19.49% | 5.94%–20.00% | 14.85% |

### Pickup borough

Zones coded by TLC as `Unknown` or `N/A`, as well as IDs absent from the lookup, are grouped as “Unknown/outside/unmapped.”

| Pickup borough | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manhattan | 2,275,866 | 93.51% | $3.67 | $3.17 | 17.56% | 20.00% | 14.98%–20.00% | 17.16% |
| Bronx | 23,346 | 2.65% | $0.24 | $0.00 | 0.54% | 0.00% | 0.00%–0.00% | 0.60% |
| Brooklyn | 64,897 | 17.67% | $0.98 | $0.00 | 3.67% | 0.00% | 0.00%–0.00% | 3.01% |
| Queens | 231,820 | 85.13% | $10.55 | $11.10 | 15.67% | 19.36% | 10.41%–20.00% | 16.02% |
| Staten Island | 69 | 13.04% | $5.18 | $0.00 | 12.43% | 0.00% | 0.00%–0.00% | 9.50% |
| EWR | 103 | 68.93% | $12.21 | $10.00 | 11.07% | 9.41% | 0.00%–20.00% | 12.13% |
| Unknown/outside/unmapped | 4,150 | 90.39% | $6.23 | $3.95 | 17.59% | 20.00% | 12.38%–20.00% | 15.66% |

### Airport-related trips

“Any airport” means either endpoint is JFK (zone 132), LaGuardia (138), or EWR (1).

| Airport status | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No airport | 2,364,281 | 89.60% | $3.39 | $3.09 | 16.84% | 20.00% | 12.42%–20.00% | 15.88% |
| Any airport | 235,970 | 94.47% | $12.24 | $12.30 | 17.41% | 19.48% | 15.00%–20.00% | 17.21% |

The detail categories are mutually exclusive; a rare trip touching more than one named airport is labeled “Multiple airports.”

| Airport detail | Trips | Positive tip | Mean tip | Median tip | Mean tip % | Median tip % | Tip % IQR | Bill-weighted tip rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No airport | 2,364,281 | 89.60% | $3.39 | $3.09 | 16.84% | 20.00% | 12.42%–20.00% | 15.88% |
| JFK | 118,280 | 93.01% | $13.12 | $14.95 | 16.93% | 19.52% | 13.03%–20.00% | 16.77% |
| LaGuardia | 110,503 | 96.26% | $11.00 | $11.38 | 18.01% | 19.42% | 17.14%–20.00% | 17.93% |
| EWR | 5,439 | 91.47% | $18.88 | $21.41 | 16.27% | 20.00% | 10.07%–20.00% | 16.23% |
| Multiple airports | 1,748 | 89.24% | $10.54 | $10.35 | 16.03% | 19.26% | 9.61%–19.98% | 15.51% |

## Tail sensitivity and data quality

The largest observed eligible tip percentage is 2,659.57%, while the 99th percentile is 30.06%. Large ratios can result from a large tip, a very small denominator, or a reporting problem. They are retained in the main analysis because a high tip is not invalid merely for being generous. As a sensitivity check, the following results exclude the 2,597 rows above the global 99.9th-percentile cutoff of 77.07% (actual excluded share: 0.100%). Medians are essentially tail-resistant, so this check focuses on means.

### Temporal mean sensitivity

| Comparison | Group | Full trips | Full mean tip % | Tail-excluded mean tip % | Change |
| --- | --- | --- | --- | --- | --- |
| Weekday/weekend | Weekday | 1,966,713 | 16.82% | 16.70% | -0.11 pp |
| Weekday/weekend | Weekend | 633,538 | 17.13% | 16.98% | -0.15 pp |
| Day of week | Monday | 311,014 | 16.68% | 16.56% | -0.12 pp |
| Day of week | Tuesday | 358,588 | 16.86% | 16.76% | -0.10 pp |
| Day of week | Wednesday | 460,821 | 16.91% | 16.79% | -0.11 pp |
| Day of week | Thursday | 482,192 | 16.90% | 16.80% | -0.10 pp |
| Day of week | Friday | 354,098 | 16.67% | 16.53% | -0.14 pp |
| Day of week | Saturday | 349,660 | 17.13% | 16.99% | -0.14 pp |
| Day of week | Sunday | 283,878 | 17.13% | 16.98% | -0.16 pp |
| Time of day | Overnight (00:00–05:59) | 159,856 | 16.08% | 15.81% | -0.27 pp |
| Time of day | Morning (06:00–09:59) | 325,562 | 15.69% | 15.58% | -0.12 pp |
| Time of day | Midday (10:00–15:59) | 859,749 | 16.99% | 16.88% | -0.11 pp |
| Time of day | Evening commute (16:00–19:59) | 709,453 | 17.06% | 16.97% | -0.09 pp |
| Time of day | Late evening (20:00–23:59) | 545,631 | 17.49% | 17.34% | -0.15 pp |

### Highest/lowest mean ranking sensitivity

| Dimension | Full-data highest mean | Tail-excluded highest mean | Full-data lowest mean | Tail-excluded lowest mean | Both rankings stable? |
| --- | --- | --- | --- | --- | --- |
| Taxi type | Green (18.35%) | Green (17.73%) | Yellow (16.88%) | Yellow (16.76%) | Yes |
| Weekday/weekend | Weekend (17.13%) | Weekend (16.98%) | Weekday (16.82%) | Weekday (16.70%) | Yes |
| Day of week | Sunday (17.13%) | Saturday (16.99%) | Friday (16.67%) | Friday (16.53%) | No |
| Time of day | Late evening (20:00–23:59) (17.49%) | Late evening (20:00–23:59) (17.34%) | Morning (06:00–09:59) (15.69%) | Morning (06:00–09:59) (15.58%) | Yes |
| Pre-tip bill | <$15 (18.58%) | <$15 (18.35%) | $40–<70 (13.65%) | $40–<70 (13.56%) | Yes |
| Distance | (0,1] (18.36%) | (0,1] (18.12%) | (7,15] (13.12%) | (7,15] (13.03%) | Yes |
| Pickup borough | Unknown/outside/unmapped (17.59%) | Manhattan (17.45%) | Bronx (0.54%) | Bronx (0.48%) | No |
| Airport detail | LaGuardia (18.01%) | LaGuardia (17.94%) | Multiple airports (16.03%) | Multiple airports (15.84%) | Yes |

### Data-quality diagnostics

These diagnostics overlap and therefore should not be added together. Sequential exclusions are reported in the funnel.

| Diagnostic | Rows | Reference population |
| --- | --- | --- |
| Unparseable pickup timestamp | 0 | All source rows |
| Unparseable dropoff timestamp | 0 | All source rows |
| Parsed pickup outside April 2026 | 15 | All source rows |
| Missing/nonfinite required numeric or missing zone ID | 0 | Date-valid card candidates |
| Nonpositive duration | 42,961 | Complete card candidates |
| Duration over 6 hours | 711 | Complete card candidates |
| Nonpositive distance | 21,314 | Complete card candidates |
| Distance over 100 miles | 27 | Complete card candidates |
| Nonpositive fare | 131 | Time/distance-valid card candidates |
| Negative tip | 17 | Time/distance-valid card candidates |
| Nonpositive pre-tip bill | 128 | Time/distance-valid card candidates |
| Pickup zone absent from lookup | 0 | Eligible trips |
| Dropoff zone absent from lookup | 0 | Eligible trips |
| Pickup zone coded Unknown/N/A | 4,150 | Eligible trips |
| Dropoff zone coded Unknown/N/A | 13,353 | Eligible trips |
| Tip percentage over 100% | 1,478 | Eligible trips |
| Tip percentage over 200% | 302 | Eligible trips |

## Limitations

1. **Cash tips are unobserved.** The TLC tip field generally excludes cash tips. Cash trips are excluded rather than coded as zero, so findings apply only to card-recorded taxi tipping. Card use and tipping behavior may differ systematically.
2. **Payment and vendor reporting can differ.** `payment_type = 1` is treated as comparable across yellow and green records, but vendor systems, suggested-tip interfaces, rounding, and corrections can affect the recorded values.
3. **Services are not interchangeable.** Yellow and green taxis operate in different markets. FHV and app-based riders are out of scope, and even the standardized check does not erase all service-selection differences.
4. **Data quality is imperfect.** The files include out-of-month timestamps, invalid durations/distances, nonpositive monetary values, `Unknown`/`N/A` zone codes, and extreme tip ratios. The eligibility rules reduce obvious problems but cannot prove each retained trip is accurate.
5. **Associations are not causes.** The records contain no rider or driver identity and do not measure service quality, weather, traffic conditions, trip purpose, or the card screen shown. Differences by time or place may reflect who travels and what trips they take.
6. **One month is not seasonality.** April 2026 may not represent other months, years, holidays, or policy regimes. With millions of records, tiny differences can be precisely estimated but still be practically unimportant; this report emphasizes effect sizes rather than significance tests.

## Reproducibility

From `tlc-01/scripts/`, run:

```bash
uv run scripts
```

The program reads only the yellow, green, and zone-lookup CSVs named above and rewrites `tlc-01/report.md`. Group totals and eligibility constraints are asserted during generation.
