# Suspicious Trip Records — Methodology and Findings

## Scope and interpretation

This screen examined **26,997,061** anonymous April 2026 trip records across yellow taxi, green taxi, FHV, and HVFHV. It is a data-quality screen, not an allegation of rider, driver, base, or platform fraud. A balanced hybrid approach was used: hard internal-integrity checks plus conservative, explicitly labeled plausibility-review checks. Statistical rarity alone was not a flag.

The authoritative record reference in `suspicious_trips.csv` is `source_file` plus `source_row`, where `source_row=1` is the first CSV data record after the header (CSV record number, not a physical text line when quoting spans lines). `record_fingerprint` is SHA-256 over a compact JSON array of the source's ordered raw field strings. It supports reproduction but is not a TLC trip ID. One trip appears once per triggered rule, so flag-row totals exceed distinct-record totals when rules overlap.

### Inputs

| Source | Service | Data rows |
|---|---:|---:|
| `fhv_tripdata_2026-04.csv` | FHV | 2,125,630 |
| `fhvhv_tripdata_2026-04.csv` | HVFHV | 20,995,953 |
| `green_tripdata_2026-04.csv` | green | 44,238 |
| `yellow_tripdata_2026-04.csv` | yellow | 3,831,240 |
| **Total** |  | **26,997,061** |

`taxi_zone_lookup.csv` was used as the location reference. IDs 264 (Unknown) and 265 (Outside of NYC) were accepted as valid. Missing FHV pickup/drop-off zones were not flagged because that source legitimately omits them; yellow, green, and HVFHV core zones were required.

## Detection rules

High severity denotes a hard schema, reference, chronology, physical-sign, or internal-accounting inconsistency. Medium severity denotes a conservative manual-review case that can still be genuine.

| Rule | Severity | Category | Exact criterion | Why it may matter |
|---|---|---|---|---|
| `V001_MALFORMED_ROW` | high | Malformed row width | CSV field count must equal header field count | Likely truncation, delimiter, or schema corruption. |
| `V002_MISSING_CORE` | high | Missing core value | All service-specific core fields must be non-null | The record cannot support basic trip interpretation. |
| `V003_INVALID_VALUE` | high | Unparseable value | Dates and numeric measures must parse to their declared types | Likely malformed or unit/type-corrupted input. |
| `V004_NONFINITE` | high | Non-finite numeric value | Numeric measures must be finite | NaN and infinity are not physical trip measurements. |
| `R001_INVALID_LOCATION` | high | Invalid location reference | Every reported zone must exist in taxi_zone_lookup.csv | Likely bad reference coding; 264 and 265 remain valid. |
| `R002_INVALID_CODE` | high | Invalid categorical code | Reported categorical values must be in documented domains | Likely miscoding or schema drift. |
| `R003_INVALID_IDENTIFIER` | high | Invalid base/license identifier | Base=B plus five digits; HV license=HV plus four digits | Likely malformed provider identity. |
| `R004_PASSENGER_COUNT` | high | Invalid passenger count | Passenger count must be an integer from 0 through 6 | Negative/fractional/excess counts are inconsistent with taxi reporting. |
| `T001_PICKUP_MONTH` | medium | Pickup outside file month | 2026-04-01 <= pickup < 2026-05-01 | Likely monthly partition or timestamp corruption. |
| `T002_NEGATIVE_DURATION` | high | Drop-off before pickup | drop-off >= pickup | Chronology is impossible as reported. |
| `T003_ZERO_DURATION_ACTIVITY` | medium | Zero duration with trip activity | Zero elapsed seconds plus recorded activity | Likely timestamp rounding/corruption or a non-trip/cancelled record. |
| `T004_LONG_DURATION` | medium | Excessive trip duration | Elapsed duration > 6 hours | Conservative review threshold for a passenger trip. |
| `T005_EVENT_SEQUENCE` | high | HVFHV event sequence violation | request <= on-scene <= pickup <= drop-off when events exist | Likely event timestamp corruption or swapped fields. |
| `T006_TRIP_TIME_MISMATCH` | high | HVFHV trip-time mismatch | \|trip_time - timestamp elapsed seconds\| <= 1 | Internal time fields disagree. |
| `M001_NEGATIVE_MEASURE` | high | Negative trip measure | Distance and recorded trip time must be >= 0 | Negative physical measures are impossible. |
| `M002_HIGH_SPEED` | medium | Implausible average speed | Distance / timestamp duration <= 80 mph | Likely distance unit/decimal or timestamp error. |
| `M003_EXTREME_DISTANCE` | medium | Extreme trip distance | Distance <= 300 miles | Conservative review threshold; long out-of-city trips remain possible. |
| `M004_ZERO_DISTANCE_CROSS_ZONE` | medium | Zero distance across different zones | Distance=0, zones differ, and duration >= 60 seconds | Likely missing meter/distance output. |
| `M005_ZERO_DISTANCE_MATERIAL` | medium | Material trip with zero distance | Distance=0, duration >= 10 minutes, and \|fare\| >= $20 | Likely missing distance or a negotiated/cancelled-trip artifact. |
| `F001_TOTAL_RECONCILIATION` | high | Taxi total fails reconciliation | Residual > $0.05 from every allowed ancillary-component subset | Likely accounting inconsistency while allowing vendor fee aggregation. |
| `F002_EXTREME_AMOUNT` | medium | Extreme monetary amount | Service-specific conservative dollar ceilings | Possible decimal/unit error, unusual correction, or genuinely exceptional trip. |
| `F003_HIGH_TIP` | medium | Extreme tip-to-fare ratio | Tip > $100 and > 200% of \|fare\| | Possible entry/coding issue; unusually generous tips remain possible. |
| `D001_EXACT_DUPLICATE` | medium | Exact duplicate candidate | SHA-256-identical full records under service eligibility rules | Possible duplicate ingestion; equality is not proof of trip identity. |

### Important implementation details

- Pickup timestamps had to fall in `[2026-04-01 00:00:00, 2026-05-01 00:00:00)`; an April 30 pickup may validly drop off in May.
- Taxi passenger count 0 and null optional categorical values were accepted. Non-null taxi vendor/rate/payment/store flags, green trip type, HVFHV service flags, and base/license formats were validated.
- Average speed uses reported distance divided by pickup-to-drop-off timestamp duration. No route geometry or traffic model was imposed.
- Yellow/green reconciliation always includes fare, tip, tolls, and improvement surcharge, then tests every exact subset of the ancillary columns (extra, MTA, e-hail where present, congestion, airport where present, and CBD). A row is flagged only when no candidate is within $0.05. This deliberately tolerates the source's vendor-specific aggregation conventions. In CSV trigger JSON, `component_values` aligns positionally with `trigger_fields` except its final `total_amount`, and `closest_included_indexes` identifies the closest subset.
- Negative taxi charges are not suspicious by themselves because paired reversals, voids, and corrections occur in the source.
- Exact duplicate screening used disk-partitioned full-row SHA-256 hashes. FHV duplicates require both zones and a non-zero seconds component in at least one trip timestamp. All members of a qualifying hash group are listed; equality is not proof that anonymous records represent the same real-world trip.

## Counts

### By source

| Source | Data rows | Flag rows | Distinct flagged records | Distinct flagged share |
|---|---:|---:|---:|---:|
| `fhv_tripdata_2026-04.csv` | 2,125,630 | 4,460 | 4,459 | 0.2098% |
| `fhvhv_tripdata_2026-04.csv` | 20,995,953 | 364,360 | 363,814 | 1.7328% |
| `green_tripdata_2026-04.csv` | 44,238 | 9,181 | 8,942 | 20.2134% |
| `yellow_tripdata_2026-04.csv` | 3,831,240 | 891,609 | 779,917 | 20.3568% |
| **Total** | **26,997,061** | **1,269,610** | **1,157,132** | **4.2861%** |

### By anomaly category and source

Each rule emits at most once per record, so `Flag rows` also equals distinct records within that rule. Do not sum the final column to obtain overall distinct trips because records can trigger multiple rules.

| Rule / category | FHV | HVFHV | Green | Yellow | Flag rows |
|---|---:|---:|---:|---:|---:|
| `V001_MALFORMED_ROW` — Malformed row width | 0 | 0 | 0 | 0 | **0** |
| `V002_MISSING_CORE` — Missing core value | 0 | 0 | 0 | 0 | **0** |
| `V003_INVALID_VALUE` — Unparseable value | 0 | 0 | 0 | 0 | **0** |
| `V004_NONFINITE` — Non-finite numeric value | 0 | 0 | 0 | 0 | **0** |
| `R001_INVALID_LOCATION` — Invalid location reference | 0 | 0 | 0 | 0 | **0** |
| `R002_INVALID_CODE` — Invalid categorical code | 0 | 0 | 0 | 0 | **0** |
| `R003_INVALID_IDENTIFIER` — Invalid base/license identifier | 2,680 | 0 | 0 | 0 | **2,680** |
| `R004_PASSENGER_COUNT` — Invalid passenger count | 0 | 0 | 9 | 4 | **13** |
| `T001_PICKUP_MONTH` — Pickup outside file month | 0 | 0 | 3 | 12 | **15** |
| `T002_NEGATIVE_DURATION` — Drop-off before pickup | 0 | 0 | 0 | 0 | **0** |
| `T003_ZERO_DURATION_ACTIVITY` — Zero duration with trip activity | 0 | 0 | 38 | 49,511 | **49,549** |
| `T004_LONG_DURATION` — Excessive trip duration | 1,780 | 24 | 175 | 853 | **2,832** |
| `T005_EVENT_SEQUENCE` — HVFHV event sequence violation | 0 | 362,125 | 0 | 0 | **362,125** |
| `T006_TRIP_TIME_MISMATCH` — HVFHV trip-time mismatch | 0 | 2,085 | 0 | 0 | **2,085** |
| `M001_NEGATIVE_MEASURE` — Negative trip measure | 0 | 0 | 0 | 0 | **0** |
| `M002_HIGH_SPEED` — Implausible average speed | 0 | 16 | 156 | 1,146 | **1,318** |
| `M003_EXTREME_DISTANCE` — Extreme trip distance | 0 | 6 | 9 | 73 | **88** |
| `M004_ZERO_DISTANCE_CROSS_ZONE` — Zero distance across different zones | 0 | 45 | 362 | 62,144 | **62,551** |
| `M005_ZERO_DISTANCE_MATERIAL` — Material trip with zero distance | 0 | 58 | 87 | 39,539 | **39,684** |
| `F001_TOTAL_RECONCILIATION` — Taxi total fails reconciliation | 0 | 0 | 8,325 | 738,314 | **746,639** |
| `F002_EXTREME_AMOUNT` — Extreme monetary amount | 0 | 0 | 0 | 5 | **5** |
| `F003_HIGH_TIP` — Extreme tip-to-fare ratio | 0 | 1 | 17 | 8 | **26** |
| `D001_EXACT_DUPLICATE` — Exact duplicate candidate | 0 | 0 | 0 | 0 | **0** |

## Main findings

The populated categories point to the following possible data problems (counts are screening results, not confirmed errors):

- **Taxi total fails reconciliation: 746,639 records.** These may reveal accounting-component inconsistency.
- **HVFHV event sequence violation: 362,125 records.** These may reveal swapped or corrupted dispatch-event timestamps.
- **Zero distance across different zones: 62,551 records.** These may reveal missing meter/distance output.
- **Zero duration with trip activity: 49,549 records.** These may reveal timestamp rounding/corruption or cancelled records.
- **Material trip with zero distance: 39,684 records.** These may reveal missing distance, negotiated fares, or cancelled-trip artifacts.
- **Excessive trip duration: 2,832 records.** These may reveal date/time corruption, meter left running, or genuinely long trips.
- **Invalid base/license identifier: 2,680 records.** These may reveal malformed provider identity.
- **HVFHV trip-time mismatch: 2,085 records.** These may reveal inconsistent duration fields.
- **Implausible average speed: 1,318 records.** These may reveal distance unit/decimal or timestamp errors.
- **Extreme trip distance: 88 records.** These may reveal distance unit/decimal errors or exceptional intercity trips.
- **Extreme tip-to-fare ratio: 26 records.** These may reveal tip entry/coding issues or unusually generous tips.
- **Pickup outside file month: 15 records.** These may reveal monthly partition leakage or date corruption.
- **Invalid passenger count: 13 records.** These may reveal capacity miscoding.
- **Extreme monetary amount: 5 records.** These may reveal decimal/unit errors, corrections, or exceptional charges.

## Manual and reproducibility checks

After the CSV was written, every flagged row reference was streamed from the original source again and its fingerprint was reproduced. Output order, `(source_file, source_row, rule_id)` uniqueness, trigger JSON, source bounds, and category/source counts were also revalidated. The table below records two source re-reads per populated category (or all when fewer than two); these are the first deterministic examples, while the following table records the largest rule-specific score.

| Rule | Re-read examples and trigger values | Check performed |
|---|---|---|
| `R003_INVALID_IDENTIFIER` | `fhv_tripdata_2026-04.csv` row 346: `{"Affiliated_base_number":"b01087"}`<br>`fhv_tripdata_2026-04.csv` row 735: `{"Affiliated_base_number":"BO3404"}` | Re-read the raw code and checked it against the documented domain or zone lookup. |
| `R004_PASSENGER_COUNT` | `green_tripdata_2026-04.csv` row 3,752: `{"passenger_count":"8"}`<br>`green_tripdata_2026-04.csv` row 10,717: `{"passenger_count":"9"}` | Re-read the raw code and checked it against the documented domain or zone lookup. |
| `T001_PICKUP_MONTH` | `green_tripdata_2026-04.csv` row 19: `{"expected_month":"2026-04","lpep_pickup_datetime":"2026-03-31 23:28:50"}`<br>`green_tripdata_2026-04.csv` row 37,293: `{"expected_month":"2026-04","lpep_pickup_datetime":"2026-05-01 07:32:15"}` | Re-read timestamps and independently recomputed elapsed/event ordering. |
| `T003_ZERO_DURATION_ACTIVITY` | `green_tripdata_2026-04.csv` row 43: `{"distance":"0","dropoff_zone":264,"duration_seconds":"0","pickup_zone":244}`<br>`green_tripdata_2026-04.csv` row 122: `{"distance":"0","dropoff_zone":264,"duration_seconds":"0","pickup_zone":244}` | Re-read timestamps and independently recomputed elapsed/event ordering. |
| `T004_LONG_DURATION` | `fhv_tripdata_2026-04.csv` row 860: `{"dropOff_datetime":"2026-04-01 08:44:36","duration_hours":"8.726666666666666666666666667","duration_seconds":"31416.0","pickup_datetime":"2026-04-01 00:01:00"}`<br>`fhv_tripdata_2026-04.csv` row 1,857: `{"dropOff_datetime":"2026-04-01 09:11:31","duration_hours":"8.025277777777777777777777778","duration_seconds":"28891.0","pickup_datetime":"2026-04-01 01:10:00"}` | Re-read timestamps and independently recomputed elapsed/event ordering. |
| `T005_EVENT_SEQUENCE` | `fhvhv_tripdata_2026-04.csv` row 148: `{"on_scene_before_request":"2026-04-01 00:41:04 < 2026-04-01 00:50:00","request_after_pickup":"2026-04-01 00:50:00 > 2026-04-01 00:41:43"}`<br>`fhvhv_tripdata_2026-04.csv` row 836: `{"on_scene_before_request":"2026-04-01 00:21:03 < 2026-04-01 00:25:00","request_after_pickup":"2026-04-01 00:25:00 > 2026-04-01 00:21:22"}` | Re-read timestamps and independently recomputed elapsed/event ordering. |
| `T006_TRIP_TIME_MISMATCH` | `fhvhv_tripdata_2026-04.csv` row 14,536: `{"absolute_difference_seconds":"2.0","timestamp_duration_seconds":"2197.0","trip_time":"2199"}`<br>`fhvhv_tripdata_2026-04.csv` row 34,993: `{"absolute_difference_seconds":"2.0","timestamp_duration_seconds":"1933.0","trip_time":"1935"}` | Re-read timestamps and independently recomputed elapsed/event ordering. |
| `M002_HIGH_SPEED` | `fhvhv_tripdata_2026-04.csv` row 597,175: `{"average_speed_mph":"100.80","distance_miles":"0.028","duration_seconds":"1.0"}`<br>`fhvhv_tripdata_2026-04.csv` row 1,284,115: `{"average_speed_mph":"769.4526315789473684210526316","distance_miles":"40.61","duration_seconds":"190.0"}` | Re-read distance/time/zones and recomputed the physical comparison. |
| `M003_EXTREME_DISTANCE` | `fhvhv_tripdata_2026-04.csv` row 11,329,437: `{"trip_miles":"359.8"}`<br>`fhvhv_tripdata_2026-04.csv` row 12,172,897: `{"trip_miles":"338.48"}` | Re-read distance/time/zones and recomputed the physical comparison. |
| `M004_ZERO_DISTANCE_CROSS_ZONE` | `fhvhv_tripdata_2026-04.csv` row 68,641: `{"distance_miles":"0","dropoff_zone":85,"dropoff_zone_name":"Erasmus","duration_seconds":"678.6","pickup_zone":62,"pickup_zone_name":"Crown Heights South"}`<br>`fhvhv_tripdata_2026-04.csv` row 121,964: `{"distance_miles":"0","dropoff_zone":51,"dropoff_zone_name":"Co-Op City","duration_seconds":"431.403","pickup_zone":81,"pickup_zone_name":"Eastchester"}` | Re-read distance/time/zones and recomputed the physical comparison. |
| `M005_ZERO_DISTANCE_MATERIAL` | `fhvhv_tripdata_2026-04.csv` row 151,937: `{"distance_miles":"0","duration_seconds":"1665.0","fare":"25.25"}`<br>`fhvhv_tripdata_2026-04.csv` row 210,041: `{"distance_miles":"0","duration_seconds":"1364.0","fare":"22.55"}` | Re-read distance/time/zones and recomputed the physical comparison. |
| `F001_TOTAL_RECONCILIATION` | `green_tripdata_2026-04.csv` row 54: `{"closest_candidate_total":"13.3","closest_included_indexes":[0,1,2,3,4,6,7,8],"component_values":["10.0","2.3","0.0","1.0","0.0","1.5","","0.0","0.0"],"reported_total":"13.8","residual":"0.5"}`<br>`green_tripdata_2026-04.csv` row 61: `{"closest_candidate_total":"12.46","closest_included_indexes":[0,1,2,3,4,6,7,8],"component_values":["9.3","2.16","0.0","1.0","0.0","1.5","","0.0","0.0"],"reported_total":"12.96","residual":"0.50"}` | Re-read raw charge components and recomputed threshold/subset arithmetic; adjacent reversals were considered. |
| `F002_EXTREME_AMOUNT` | `yellow_tripdata_2026-04.csv` row 2,670: `{"thresholds":{"fare_amount":"1000","tip_amount":"500","tolls_amount":"500","total_amount":"1500"},"values":{"fare_amount":"1110.4"}}`<br>`yellow_tripdata_2026-04.csv` row 76,128: `{"thresholds":{"fare_amount":"1000","tip_amount":"500","tolls_amount":"500","total_amount":"1500"},"values":{"fare_amount":"-1274.9"}}` | Re-read raw charge components and recomputed threshold/subset arithmetic; adjacent reversals were considered. |
| `F003_HIGH_TIP` | `fhvhv_tripdata_2026-04.csv` row 14,724,386: `{"base_passenger_fare":"32.73","tip_to_absolute_fare_ratio":"4.301863733577757409104796822","tips":"140.8"}`<br>`green_tripdata_2026-04.csv` row 726: `{"fare_amount":"30.3","tip_amount":"250.0","tip_to_absolute_fare_ratio":"8.250825082508250825082508251"}` | Re-read raw charge components and recomputed threshold/subset arithmetic; adjacent reversals were considered. |

### Most extreme re-read per populated rule

| Rule | Source reference | Trigger values |
|---|---|---|
| `R003_INVALID_IDENTIFIER` | `fhv_tripdata_2026-04.csv` row 346 | `{"Affiliated_base_number":"b01087"}` |
| `R004_PASSENGER_COUNT` | `green_tripdata_2026-04.csv` row 10,717 | `{"passenger_count":"9"}` |
| `T001_PICKUP_MONTH` | `yellow_tripdata_2026-04.csv` row 2,577,616 | `{"expected_month":"2026-04","tpep_pickup_datetime":"2001-01-01 09:23:58"}` |
| `T003_ZERO_DURATION_ACTIVITY` | `yellow_tripdata_2026-04.csv` row 1,073,891 | `{"distance":"80.13","dropoff_zone":265,"duration_seconds":"0","pickup_zone":132}` |
| `T004_LONG_DURATION` | `fhv_tripdata_2026-04.csv` row 815,065 | `{"dropOff_datetime":"2028-04-12 15:55:00","duration_hours":"17545.85","duration_seconds":"63165060.0","pickup_datetime":"2026-04-12 14:04:00"}` |
| `T005_EVENT_SEQUENCE` | `fhvhv_tripdata_2026-04.csv` row 69,915 | `{"on_scene_after_pickup":"2026-04-01 06:54:24 > 2026-04-01 06:53:54","on_scene_before_request":"2026-04-01 06:54:24 < 2026-04-01 06:55:53","request_after_pickup":"2026-04-01 06:55:53 > 2026-04-01 06:53:54"}` |
| `T006_TRIP_TIME_MISMATCH` | `fhvhv_tripdata_2026-04.csv` row 7,183,217 | `{"absolute_difference_seconds":"9565.0","timestamp_duration_seconds":"20088.0","trip_time":"10523"}` |
| `M002_HIGH_SPEED` | `yellow_tripdata_2026-04.csv` row 3,645,692 | `{"average_speed_mph":"2063386.4","distance_miles":"206338.64","duration_seconds":"360.0"}` |
| `M003_EXTREME_DISTANCE` | `yellow_tripdata_2026-04.csv` row 3,829,750 | `{"trip_distance":"281576.08"}` |
| `M004_ZERO_DISTANCE_CROSS_ZONE` | `yellow_tripdata_2026-04.csv` row 484,605 | `{"distance_miles":"0","dropoff_zone":264,"dropoff_zone_name":"N/A","duration_seconds":"599036.0","pickup_zone":207,"pickup_zone_name":"Saint Michaels Cemetery/Woodside"}` |
| `M005_ZERO_DISTANCE_MATERIAL` | `yellow_tripdata_2026-04.csv` row 1,800,943 | `{"distance_miles":"0","duration_seconds":"1004.0","fare":"494.82"}` |
| `F001_TOTAL_RECONCILIATION` | `yellow_tripdata_2026-04.csv` row 3,484,671 | `{"closest_candidate_total":"41.42","closest_included_indexes":[0,1,2,3,4,5,6,7,8],"component_values":["39.17","0.0","0.0","1.0","0.0","0.5","","","0.75"],"reported_total":"143.92","residual":"102.50"}` |
| `F002_EXTREME_AMOUNT` | `yellow_tripdata_2026-04.csv` row 212,298 | `{"thresholds":{"fare_amount":"1000","tip_amount":"500","tolls_amount":"500","total_amount":"1500"},"values":{"fare_amount":"1442.2"}}` |
| `F003_HIGH_TIP` | `green_tripdata_2026-04.csv` row 37,044 | `{"fare_amount":"3.0","tip_amount":"460.0","tip_to_absolute_fare_ratio":"153.3333333333333333333333333"}` |

For financial review, raw signs and component sums were retained in `trigger_values`. Negative values alone were intentionally excluded: a same-timestamp negative/positive pair can be a reversal followed by reposting. Duplicate checks compared the complete ordered row rather than a partial trip key. Zone-based examples were checked against lookup names included in the trigger JSON where applicable.

### Manual spot-check conclusions

- FHV row 346 reports affiliated base `b01087`; the surrounding records use valid uppercase `B01087`. This supports a case/identifier-entry problem rather than a new base format. Other invalid-base samples include letter `O` in place of zero.
- HVFHV rows 148 and 836 place the request 8–9 minutes after pickup, and their on-scene events before the reported request. These are material sequence contradictions, not one-second rounding noise. By contrast, the first trip-time mismatch (row 14,536) is only 2 seconds and is a plausible clock/rounding false positive; the maximum mismatch is 9,565 seconds.
- Green row 54 reports total $13.80. The always-included components sum to $13.30, while adding its reported $1.50 MTA field yields $14.80; no reported-component subset gives $13.80. This pattern is consistent with a vendor field that combines/omits a $1 component.
- Yellow row 3,031,455 reports total $27.94, while the largest populated-component subset is $25.44, a $2.50 gap. It appears in a large secondary block with blank rate code/surcharge breakouts and payment type 0, so the dominant financial category is best interpreted as systematic component incompleteness—not hundreds of thousands of independent overcharges.
- Yellow rows 41–42 have identical trip facts and exactly opposite charge signs ($-8.75 then $8.75). They were checked as a reversal/reposting example and are not flagged merely for negative signs.
- Yellow row 2,670 combines a 171.1-mile, 2h55m trip with a $1,110.40 fare. It crosses the monetary review threshold but is internally plausible as an exceptional out-of-city trip, illustrating why medium-severity money flags require review.
- No source produced a qualifying exact full-row duplicate under the stated information rules.

## False-positive caveats and limitations

- **Long, fast, or distant trips:** legitimate out-of-city/interstate trips, sparse timestamp precision, and unusual traffic or waiting can breach broad plausibility cutoffs. The 6-hour, 80-mph, and 300-mile rules are review thresholds, not proof of error.
- **Zero distance:** cancelled rides, negotiated/flat fares, meter non-engagement, same-zone movement, or distance suppression can produce zeros. Cross-zone and material-fare conditions make the flags more focused but not definitive.
- **Financial fields:** credits, disputes, voids, and corrections can be negative. Fee semantics vary by vendor; subset reconciliation avoids assuming every breakout is additive, at the cost of allowing some genuine omissions to reconcile. Cash tips are generally absent, so tip rules only assess recorded electronic tips.
- **Time fields:** FHV timestamps may be rounded. Event times can reflect platform workflow rather than perfectly synchronized clocks. A pickup just outside April can be a partition/late-reporting issue rather than a corrupt trip.
- **Locations:** 264 (Unknown) and 265 (Outside NYC) are valid lookup codes. Missing FHV zones are expected and excluded from missing-location flags, reducing sensitivity for those records.
- **Codes and identifiers:** current documented/observed domains were used. A newly introduced valid code could appear suspicious until the rules are updated.
- **Duplicates:** the files lack a true trip identifier. Even byte-identical high-information rows can be two coincident trips; low-information, minute-rounded FHV records were deliberately suppressed, so duplicate ingestion can also be missed.
- **Scope:** these rules detect selected internal inconsistencies and conservative extremes. They do not establish fraud, rider harm, route inefficiency, geographic impossibility, or every form of data error.

## Reproduction

From `tlc-03/scripts/`:

```bash
uv run scripts --data-dir ../../datasets/nyc_tlc_trip_records --output-dir ..
```

The implementation uses only the Python standard library, streams source records, keeps duplicate memberships in a temporary disk-backed index, and removes all temporary duplicate files on both success and failure.
