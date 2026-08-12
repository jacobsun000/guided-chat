# Where Ride Availability Falls Short

## Executive answer

April 2026 HVFHV records show four recurring concern patterns. These are **signals of poor effective availability among completed trips**, not direct measurements of unserved demand or idle fleet supply.

1. **Airports in the evening and around midnight were the largest combined volume-and-wait concern.** At LaGuardia on weekdays at 21:00, 1,051 completed requests occurred per weekday hour; median request-to-pickup time was 10.3 minutes versus a matched citywide 4.0 minutes, and 51.8% exceeded 10 minutes. The pattern was stronger on weekend nights. JFK also had persistently elevated waits from the evening through about 01:00.
2. **Weekend nightlife demand outran effective availability in Bushwick North, the Lower East Side, and North Williamsburg.** The most acute cell was Bushwick North at 02:00: 697 completed requests per weekend occurrence, a 7.3-minute median versus 4.7 citywide, and 197 completed requests per occurrence waiting over 10 minutes. Adjacent late-night hours were also elevated.
3. **The weekday morning peak was repeatedly worse in eastern/central Brooklyn.** East New York, Canarsie, and Crown Heights North at 07:00 all exceeded the same-hour citywide median on all 22 weekdays. Median waits were 6.1–6.9 minutes versus 4.7 citywide, with 19.0%–24.8% over 10 minutes.
4. **Lower-volume access gaps were most severe in City Island, the Rockaways, and parts of Staten Island.** City Island’s weekend 23:00–02:59 cells had median waits around 11–13 minutes and roughly 61%–72% over 10 minutes. Hammels/Arverne was persistently elevated through the weekday pre-dawn/morning period, while Saint George/New Brighton and Bloomfield/Emerson Hill stood out overnight.

## Scope and method

### Data and cleaning

The primary source is `fhvhv_tripdata_2026-04.csv`; it is the only supplied mode with both request and pickup timestamps. Timestamps are treated as TLC local clock time. April 2026 has 22 weekdays and 8 weekend days.

| Audit stage | Rows |
|---|---:|
| Source HVFHV records | 20,995,953 |
| Request timestamp outside April | 1,703 |
| April request records | 20,994,250 |
| Excluded non-NYC pickup zones | 1,022 |
| April records with a mapped NYC pickup zone | 20,993,228 |
| Excluded negative request-to-pickup time | 268,905 |
| Excluded wait over 120 minutes | 27 |
| **Primary valid records** | **20,724,296** |

The 1,022 non-NYC rows comprise 1,020 pickup IDs marked “Outside of NYC” and 2 EWR pickups; no April pickup was unmapped or assigned to unknown zone 264. No NYC April row had a missing pickup timestamp. Negative waits occurred under both provider codes (171,456 for HV0003 and 97,449 for HV0005), so they were treated as timestamp-order errors rather than valid service waits. Only 665 primary records had waits over 60 minutes; a 60-minute sensitivity cutoff therefore retained 20,723,631 rows.

JFK (zone 132) and LaGuardia (138) are excluded from neighborhood rankings and analyzed separately. EWR is outside the NYC scope. Neighborhood cells require at least 100 valid records across the month.

### Proxy definitions

- **Need proxy — completed requests.** The count of recorded HVFHV trips by pickup zone and request hour. Counts are divided by 22 weekdays or 8 weekend days to give completed requests per occurrence. This is realized, fulfilled demand—not all searches, requests, cancellations, or latent travel need.
- **Effective availability outcome — request-to-pickup wait.** The report uses median wait, p90 wait, and the share exceeding 10 minutes. Ten minutes is a transparent burden threshold, **not** a claimed service-level standard.
- **Supply-flow proxy — recent local drop-offs.** For each actual zone-hour, HVFHV drop-offs in that zone during the prior clock hour represent vehicles that may have become locally free. “Local pressure” is current completed requests divided by those prior-hour drop-offs, pooled over like days. April 1 at 00:00 is omitted from this calculation because March drop-offs are unavailable. This ratio is not an available-driver count: it misses idle cars, drivers entering or leaving service, and cross-zone repositioning.
- **Other-mode context.** Yellow, green, and basic-FHV completed pickups are counted in matching cells, but are not combined with HVFHV wait. A recorded pickup does not reveal taxi wait or whether the mode was a practical substitute.

City comparisons match the same weekday/weekend class and request hour. The **impact ranking** sorts eligible cells by completed requests per occurrence with waits over 10 minutes, after requiring the zone median to exceed the matched city median. The **severity ranking** sorts by the share over 10 minutes, with p90 as a secondary indicator.

## Observed findings

### High traveler-impact neighborhood cells

Each row is a representative hour from a broader pattern. “City med.” is the contemporaneous citywide HVFHV median. Persistence is the number of constituent dates on which the zone-hour median exceeded that date-hour’s citywide median.

| Place and request time | Month n | Requests / occurrence | Median (city med.) | p90 | Over 10 min | Over-10 requests / occurrence | Persistence | Local pressure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Bushwick North, weekend 02:00 | 5,574 | 696.8 | 7.3 (4.7) min | 15.3 | 28.3% | 196.9 | 8/8 | 1.30 |
| Lower East Side, weekend 01:00 | 9,177 | 1,147.1 | 5.5 (4.5) | 12.0 | 15.8% | 181.4 | 8/8 | 2.04 |
| Williamsburg (North Side), weekend 23:00 | 5,237 | 654.6 | 7.1 (5.3) | 14.2 | 27.2% | 177.8 | 5/8 | 1.36 |
| Midtown Center, weekday 21:00 | 19,812 | 900.5 | 5.0 (4.0) | 11.4 | 14.3% | 128.9 | 15/22 | 3.94 |
| Times Sq/Theatre District, weekday 21:00 | 16,864 | 766.5 | 5.2 (4.0) | 12.0 | 16.0% | 123.0 | 19/22 | 2.25 |
| East New York, weekday 07:00 | 12,557 | 570.8 | 6.1 (4.7) | 12.9 | 19.0% | 108.6 | 22/22 | 2.03 |
| Canarsie, weekday 07:00 | 7,999 | 363.6 | 6.9 (4.7) | 14.3 | 24.8% | 90.1 | 22/22 | 2.55 |
| Crown Heights North, weekday 07:00 | 8,113 | 368.8 | 6.6 (4.7) | 14.3 | 23.5% | 86.7 | 22/22 | 2.03 |

The late-night signals form windows rather than isolated hours. Bushwick North was above the matched city median from weekend 01:00 through 04:59, peaking at 02:00–03:59; the share over 10 minutes reached 32.8% at 03:00. The Lower East Side remained elevated from 00:00 through 03:59. North Williamsburg was elevated from 22:00 through at least 03:59, though its 23:00 persistence (5 of 8 dates) is weaker than Bushwick North’s and should not be described as universal.

The weekday morning pattern also extends beyond one cell: at 06:00–08:59, Canarsie and Crown Heights North remained above the matched median, while East New York’s clearest peak was 07:00. This spatial cluster and 22-of-22 persistence make the morning finding more compelling than a one-day event explanation.

### Severe lower-volume cells

These cells affect fewer recorded travelers but have much deeper wait distributions.

| Place and request time | Month n | Requests / occurrence | Median (city med.) | p90 | Over 10 min | Persistence | Local pressure |
|---|---:|---:|---:|---:|---:|---:|---:|
| City Island, weekend 01:00 | 100 | 12.5 | 13.3 (4.5) min | 23.2 | 72.0% | 8/8 | 1.96 |
| Hammels/Arverne, weekday 05:00 | 659 | 30.0 | 10.3 (4.7) | 19.2 | 51.7% | 22/22 | 3.33 |
| Saint George/New Brighton, weekend 01:00 | 351 | 43.9 | 8.9 (4.5) | 16.6 | 41.9% | 8/8 | 0.80 |
| Bloomfield/Emerson Hill, weekday 03:00 | 173 | 7.9 | 9.2 (4.7) | 19.3 | 46.2% | 20/22 | 0.92 |
| Far Rockaway, weekday 04:00 | 473 | 21.5 | 8.6 (5.0) | 18.3 | 43.1% | 22/22 | 1.59 |
| Brooklyn Navy Yard, weekend 03:00 | 1,553 | 194.1 | 8.4 (5.0) | 17.7 | 38.4% | 6/8 | 10.78 |

City Island’s monthly sample is exactly the 100-record eligibility boundary, so its percentages are less precise than the high-volume results. The pattern is nevertheless consistent across the eight weekend dates and neighboring hours: from 21:00 through 02:59, its median was about 9.9–13.3 minutes and 49.7%–72.0% exceeded 10 minutes.

Hammels/Arverne presents a more strongly supported access gap. Every weekday 02:00–08:59 cell was materially above its matched baseline; at 07:00, it handled 71.2 completed requests per weekday, had an 8.8-minute median, and 43.1% exceeded 10 minutes. Far Rockaway showed a similar but somewhat less severe pre-dawn pattern. Brooklyn Navy Yard is different: relatively high request volume, a high local-pressure ratio, and elevated waits align at 03:00–05:59, but access geometry or event/work-shift timing may also matter.

### Airports: analyze separately

| Airport and request time | Month n | Requests / occurrence | Median (city med.) | p90 | Over 10 min | Over-10 requests / occurrence | Persistence | Local pressure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| LaGuardia, weekday 21:00 | 23,124 | 1,051.1 | 10.3 (4.0) min | 18.8 | 51.8% | 544.6 | 22/22 | 7.18 |
| LaGuardia, weekend 22:00 | 5,964 | 745.5 | 11.9 (5.0) | 23.9 | 61.1% | 455.5 | 8/8 | 13.77 |
| JFK, weekday 00:00 | 13,768 | 625.8 | 9.3 (4.0) | 19.4 | 43.7% | 273.6 | 22/22 | 4.92 |
| JFK, weekend 21:00 | 7,195 | 899.4 | 8.8 (4.5) | 15.5 | 40.2% | 361.1 | 8/8 | 3.55 |

LaGuardia’s concern window begins around 18:00 and becomes pronounced from 20:00 through midnight. On weekends, 57%–61% of completed requests exceeded 10 minutes at 21:00–23:59. JFK was elevated on weekdays from roughly 18:00 through 01:59 and on weekend evenings. Airport staging rules, terminal access, and pickup-location coding make these results non-comparable to ordinary neighborhoods; they are operational signals, not proof that citywide fleet supply should simply be moved to terminals.

### Robustness, contradictory cases, and proxy failures

**Provider mix.** The main neighborhood findings appear under both provider codes. At Hammels/Arverne weekday 05:00, provider medians were 10.2 and 10.7 minutes, with 51.3% and 52.8% over 10 minutes. City Island weekend 01:00 was 13.6 and 12.4 minutes; Canarsie weekday 07:00 was 7.1 and 6.5. Airport severity is more provider-sensitive: at LaGuardia weekday 21:00, HV0003’s median was 11.2 minutes and 61.4% exceeded 10, versus 5.1 minutes and 26.5% for HV0005. Both exceed the matched city long-wait rate (9.1%), but the pooled magnitude is partly provider composition.

**Approach versus boarding.** In cells with ordered on-scene timestamps, scene-to-pickup medians were generally about 0.4–1.1 minutes. At City Island weekend 01:00, provider-specific request-to-scene medians were 12.6 and 11.7 minutes while scene-to-pickup medians were 1.1 and 1.0. At Hammels/Arverne weekday 05:00, the corresponding approach medians were 9.0 and 9.9 minutes. Recorded boarding delay therefore does not explain most headline waits; vehicle approach, dispatch, or approach traffic is more plausible. On-scene timestamps remain provider-reported and are not an independent location trace.

**Ordinary-trip and cutoff checks.** Removing shared and WAV-request records barely changed headline metrics. Bushwick North weekend 02:00 moved from a 7.27-minute median and 28.3% over 10 to 7.21 minutes and 27.5%; Hammels/Arverne weekday 05:00 remained 10.3 minutes and 51.8%. Replacing the 120-minute limit with 60 minutes removed only 665 records citywide and left the displayed headline medians unchanged to one decimal place. This check does not imply that shared or WAV travelers are unimportant; they remain in the primary analysis.

**High need can coexist with good performance.** These counterexamples argue against treating request volume itself as evidence of undersupply:

| Place and request time | Requests / occurrence | Median (city med.) | Over 10 min | Local pressure |
|---|---:|---:|---:|---:|
| Bushwick South, weekend 01:00 | 840.9 | 4.15 (4.47) min | 8.3% | 0.83 |
| East Village, weekend 21:00 | 752.0 | 3.10 (4.50) | 2.2% | 1.05 |
| Midtown Center, weekday 19:00 | 679.3 | 2.83 (3.48) | 1.7% | 1.72 |

Midtown Center itself flips from better-than-city performance at 19:00 to worse at 21:00, emphasizing the importance of narrow time windows. Bushwick South at 01:00 also performs better than adjacent Bushwick North later at night, so a borough-wide “weekend shortage” interpretation would be too coarse.

**The drop-off proxy often disagrees with wait.** City Island weekend 23:00 had local pressure near 1.0 but a 12.7-minute median; Saint George weekend 01:00 had pressure 0.80 but an 8.9-minute median. Conversely, Washington Heights North weekday 07:00 had high pressure (4.49) but a 4.69-minute median, essentially the 4.72-minute city baseline. These contradictions are consistent with cross-zone dispatch and repositioning and show why local pressure is corroborating evidence only. Brooklyn Navy Yard and late-night LaGuardia are cases where high pressure and long waits do align.

### Other completed ride activity

Recorded pickups per matching occurrence provide context, not a combined availability measure:

| Cell | HVFHV completed requests | Yellow pickups | Green pickups | Basic-FHV pickups with known zone |
|---|---:|---:|---:|---:|
| Bushwick North, weekend 02:00 | 696.8 | 27.9 | 0.5 | 0.0 |
| East New York, weekday 07:00 | 570.8 | 20.0 | 0.1 | 16.7 |
| Hammels/Arverne, weekday 05:00 | 30.0 | 3.6 | 0.0 | 4.0 |
| City Island, weekend 01:00 | 12.5 | 0.0 | 0.0 | 0.0 |
| Lower East Side, weekend 01:00 | 1,147.1 | 466.5 | 0.0 | 0.0 |
| LaGuardia, weekday 21:00 | 1,051.1 | 217.3 | 0.0 | 2.9 |
| JFK, weekend 21:00 | 899.4 | 416.9 | 0.0 | 3.0 |

This suggests much more recorded alternative ride activity in Manhattan and at airports than in the outer-zone severity cases. It does **not** establish comparable price, accessibility, booking method, or wait. Basic-FHV context is especially incomplete: only 340,033 of 2,125,630 April records (16.0%) have a known NYC pickup zone; 1,783,421 have no pickup location.

## What cannot be inferred

- The dataset contains completed trips, not rejected searches, cancellations, quote waits, or travelers deterred by price or expected delay. Poor availability may therefore be understated, while selection into completed rides can also distort comparisons.
- No driver identifier, online/idle status, dispatch offer, surge price, or repositioning trace is supplied. Neither completed-request volume nor prior-hour drop-offs is actual supply.
- Request-to-pickup time includes dispatch, vehicle approach, and rider loading. The on-scene check reduces—but does not eliminate—traffic, terminal access, curb design, and timestamp-definition explanations.
- Zone-level results can hide within-zone distance and barriers. This is especially important for airports, parks/industrial areas, islands, and waterfront zones.
- Yellow and green pickups are fulfilled trips, not observations of street-hail wait. Basic-FHV location coverage is poor.
- The analysis covers one month. Weather, concerts, flight disruptions, school schedules, construction, or provider incidents could recur on several same-type days and still create a nonstructural pattern.
- The 100-record eligibility rule controls obvious small-cell noise but omits the sparsest places; City Island remains near that boundary. Exact wait quantiles and date persistence are descriptive, not causal estimates.

## Recommendations (not observations)

1. **Validate before reallocating service.** Obtain all request attempts, cancellations, dispatch offers/acceptances, quoted waits and prices, and online/idle vehicle minutes by zone. Test whether the listed cells still rank poorly when unmet requests are included.
2. **Prioritize multi-month operational review of four windows:** airport evenings/late nights; weekend 00:00–04:59 nightlife zones; weekday 06:00–08:59 in eastern/central Brooklyn and the Rockaways; and overnight low-density zones in City Island and Staten Island. Join weather, events, road conditions, and flight operations before labeling any pattern structural.
3. **Only after validation, pilot narrowly targeted actions.** Potential tests include time-limited driver-repositioning incentives, dispatch-radius changes, or airport staging adjustments. Use randomized or phased rollouts and monitor cancellations, p90 waits, prices, deadheading, and spillovers to neighboring zones—not completed pickups alone.
4. **Audit provider-specific airport operations.** LaGuardia’s pooled result masks a large provider gap; terminal geofences, queue rules, dispatch logic, and timestamp definitions should be compared before a fleet-wide response.
5. **Protect accessibility and geographic coverage.** Report WAV and shared-request outcomes separately alongside all-trip metrics, and evaluate whether an intervention improves service in low-volume outer zones without reducing it elsewhere.

## Reproducibility

Run `uv run scripts` from `tlc-04/scripts/`. The DuckDB pipeline uses exact medians/quantiles, checks row reconciliation and ranking eligibility, and regenerates the supporting tables in `tlc-04/analysis/`. Principal evidence files are `cell_metrics.csv`, `ranked_impact.csv`, `ranked_severity.csv`, `persistence_checks.csv`, `airport_results.csv`, `provider_checks.csv`, `on_scene_checks.csv`, `sensitivity_checks.csv`, and `cross_mode_context.csv`.
