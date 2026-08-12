# Methodology: Unexpectedly Slow or Expensive Route Groups

## Main findings

The analysis produced **10,603 flagged daily route groups**: 5,361 slow, 6,722 expensive, and 1,480 meeting both definitions. Counts for slow and expensive overlap when a group meets both rules.

Among 5,701,727 retained service/route/date/time groups, 559,149 met the 10-trip time candidate minimum and 542,590 also had a sufficient leave-one-date-out time baseline. For cost, 557,841 groups met the candidate minimum and 541,342 had sufficient baselines.

### Flags by service

| Service | Any flag | Slow | Expensive | Both |
|---|---:|---:|---:|---:|
| yellow | 1,819 | 1,315 | 1,028 | 524 |
| green | 2 | 1 | 1 | 0 |
| fhv | 1 | 1 | 0 | 0 |
| fhvhv | 8,781 | 4,044 | 5,693 | 956 |

### Most severe flagged groups

| Service/detail | Date and period | Route | Reason | Severity z | Time observed / expected (min) | Cost observed / expected ($) |
|---|---|---|---|---:|---:|---:|
| yellow / metered_taxi | 2026-04-25 · Midday (10:00-15:59) | Penn Station/Madison Sq West → Kips Bay | slow_and_expensive | 37.500 | 53.94 / 11.32 | 46.25 / 16.15 |
| fhvhv / HV0003 | 2026-04-25 · Midday (10:00-15:59) | East Chelsea → Kips Bay | slow_and_expensive | 32.871 | 58.18 / 15.68 | 71.11 / 23.35 |
| fhvhv / HV0003 | 2026-04-25 · Midday (10:00-15:59) | Midtown East → Union Sq | slow_and_expensive | 29.750 | 41.87 / 12.12 | 48.16 / 25.44 |
| fhvhv / HV0003 | 2026-04-18 · PM peak (16:00-19:59) | Upper East Side South → JFK Airport | expensive | 29.591 | 61.50 / 58.93 | 168.66 / 124.35 |
| fhvhv / HV0003 | 2026-04-25 · Midday (10:00-15:59) | Penn Station/Madison Sq West → Murray Hill | slow_and_expensive | 28.970 | 36.36 / 10.33 | 48.74 / 19.77 |
| yellow / metered_taxi | 2026-04-25 · Midday (10:00-15:59) | Midtown Center → Union Sq | slow_and_expensive | 28.924 | 40.87 / 10.49 | 38.89 / 15.45 |
| fhvhv / HV0003 | 2026-04-25 · Midday (10:00-15:59) | Penn Station/Madison Sq West → Gramercy | slow_and_expensive | 28.745 | 36.60 / 11.07 | 48.38 / 19.64 |
| yellow / metered_taxi | 2026-04-25 · Midday (10:00-15:59) | Kips Bay → East Chelsea | slow_and_expensive | 28.092 | 40.88 / 12.78 | 32.88 / 19.65 |
| fhvhv / HV0003 | 2026-04-26 · Midday (10:00-15:59) | Boerum Hill → LaGuardia Airport | slow_and_expensive | 27.786 | 55.45 / 27.30 | 104.73 / 64.08 |
| yellow / metered_taxi | 2026-04-25 · Midday (10:00-15:59) | Midtown South → Union Sq | slow_and_expensive | 26.725 | 31.49 / 4.77 | 29.80 / 11.25 |

These are screening flags, not findings of overcharging or service failure. A high robust z-score can occur when the comparison-date medians are very stable; the separate absolute and relative thresholds ensure that small but statistically unusual differences are not flagged.

## Data scope and normalized measures

The source is the official NYC TLC April 2026 monthly trip-record extract supplied with this task. Time was analyzed for yellow taxi, green taxi, traditional FHV, and high-volume FHV (HVFHV). Cost was analyzed for yellow, green, and HVFHV only because traditional FHV records have no fare fields.

All sources were normalized to pickup/drop-off timestamps, directional pickup and drop-off taxi zones, service, service detail, ride category, elapsed minutes, distance where available, and optional rider cost. HVFHV groups were split by `hvfhs_license_num`; FHV records were combined as `all_bases`. Yellow/green ride category is `standard`. HVFHV distinguishes `exclusive`, `shared_requested_unmatched`, and `shared_matched`; FHV can only identify `shared_matched` versus `exclusive` from `SR_Flag`.

Elapsed minutes are computed from recorded drop-off minus pickup timestamps. Mandatory rider cost excludes tips:

- Yellow/green: `total_amount - tip_amount`.
- HVFHV: `base_passenger_fare + tolls + bcf + sales_tax + congestion_surcharge + airport_fee + cbd_congestion_fee`.
- FHV: unavailable.

Tips are excluded because they are discretionary and cash tips are incompletely recorded. Tolls, taxes, and mandatory fees remain included. Missing components are not imputed; a missing computed cost fails cost eligibility but can still contribute to time if all time filters pass.

## Filters and count reconciliation

Filters were applied sequentially, so each time exclusion below is assigned to its first failing rule. A trip was retained for time only when:

1. Pickup was in `[2026-04-01 00:00:00, 2026-05-01 00:00:00)`.
2. Drop-off followed pickup and elapsed time was from 1 through 180 minutes, inclusive.
3. Both location IDs resolved to nonblank named lookup zones and neither ID was 264 (`Unknown`) nor 265 (`Outside of NYC`).
4. For yellow, green, and HVFHV, distance was greater than 0 and no more than 100 miles. FHV has no distance field.

For the cost metric, a time-retained record additionally needed a nonmissing rider cost greater than $0 and no more than $500. Records failing only the cost rule remain in time aggregates.

| Service | Source rows | Pickup month excluded | Duration excluded | Route excluded | Distance excluded | Time retained | Cost invalid among time | Cost retained |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| fhv | 2,125,630 | 0 | 11,385 | 1,780,664 | 0 | 333,581 | N/A | N/A |
| fhvhv | 20,995,953 | 0 | 1,862 | 931,341 | 1,713 | 20,061,037 | 21,477 | 20,039,560 |
| green | 44,238 | 3 | 1,699 | 386 | 536 | 41,614 | 98 | 41,516 |
| yellow | 3,831,240 | 12 | 89,425 | 21,894 | 65,794 | 3,654,115 | 12,350 | 3,641,765 |

For every service, source rows equal the four mutually exclusive time-exclusion counts plus time-retained rows. For each fare-bearing service, time-retained rows equal cost-invalid plus cost-retained rows.

## Grouping and expected-value baseline

A row in the output is a daily recurring group keyed by service, service detail, ride category, directional taxi-zone pair, pickup date, weekday/weekend class, and pickup period:

- Overnight: 00:00–05:59
- AM peak: 06:00–09:59
- Midday: 10:00–15:59
- PM peak: 16:00–19:59
- Evening: 20:00–23:59

The observed measure is the within-group median. A candidate metric requires at least 10 contributing trips. Its expected value is the unweighted median of other dates' daily medians with the same service/provider, ride category, directional route, weekday/weekend class, and period. Each comparison date must have at least 5 metric-eligible trips; the baseline must include at least 4 other dates and 40 total trips. The candidate date is always excluded. Equal weighting of daily medians prevents unusually high-volume dates from dominating.

For comparison-date medians `x_i`, the baseline center and scale are:

- `expected = median(x_i)`
- `scale = max(1, 1.4826 × median(|x_i - expected|))`
- `robust_z = (observed - expected) / scale`

The floor is 1 minute for time and $1 for cost. It prevents zero or tiny MAD values from creating infinite or misleadingly large standardized differences.

## Flag thresholds

A group is **slow** only if all three conditions hold: robust z ≥ 3, observed median ≥ 1.25 × expected, and observed minus expected ≥ 5 minutes.

A group is **expensive** only if all three conditions hold: robust z ≥ 3, observed median ≥ 1.20 × expected, and observed minus expected ≥ $5.

`severity_score` is the maximum robust z-score among metrics that actually pass all their flag conditions; it is not the maximum of nonqualifying metric scores. Full precision is used for decisions. CSV display values are rounded to two decimals for minutes/dollars and three decimals for ratios/z-scores.

## Verification

The pipeline reconciled all filter counts, checked time-period boundaries and synthetic threshold edge cases, recomputed both available metric baselines for 3 of the most severe rows directly from daily aggregates, asserted unique group keys and valid zone joins, and confirmed every output row has at least one flag. It also asserted baseline/candidate minimums, confirmed FHV cost cells are blank and `expensive_flag` is false, checked descending severity order, and produced a byte-identical deterministic export replay. During deliverable production, a second full end-to-end run also produced byte-identical CSV and Markdown files. CSV SHA-256: `57e7aea209579bc641bdb6030fdc290b781eddece7e22133e0cfad87ecd1acb2`.

## Limitations

- One month provides only a short expectation history and does not capture seasonality; weekend baselines have especially few possible comparison dates.
- Taxi zones and broad time periods are coarse. Pickups/drop-offs at different points within the same zones can change distance, duration, tolls, and fare.
- Recorded charges are not pre-trip quoted prices. The analysis cannot test whether a quote was honored or whether each fee was contractually expected.
- Traffic, weather, road closures, transit disruptions, holidays, and special events are unobserved and may explain flags.
- Traditional FHV data omit fares and distance; only elapsed time is analyzed for FHV, and many FHV records lack usable taxi-zone routes.
- FHV dispatch bases are pooled, while HVFHV is split only by license code; operational heterogeneity can remain within a group.
- Group medians reduce sensitivity to isolated bad records but can still shift when the within-zone trip mix changes by date.
- Results are observational screening signals. They do not establish overcharging, inefficient routing, provider fault, or causality.
