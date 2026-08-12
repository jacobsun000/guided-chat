# Evaluation Metrics

Compare three conditions: **agent alone**, **human + regular chat**, and **human + scaffolding**.

## Artifact quality (all conditions)

Score each metric **0–4** using blinded review.

| Metric | Weight | Measure |
|---|---:|---|
| Correctness | 30% | Accuracy of claims, calculations, and conclusions |
| Completeness | 20% | Coverage of required deliverables and questions |
| Process validity | 20% | Valid filters, mappings, formulas, assumptions, and checks |
| Evidence & traceability | 15% | Claims traceable to source facts and intermediate results |
| Uncertainty & limitations | 15% | Claim strength matches evidence; material caveats addressed |

**Overall quality:** weighted mean, rescaled to 0–100. Missing ratings remain missing.

## Objective study measures

| Metric | Applies to | Measure |
|---|---|---|
| Task success | All | Required deliverables present and quality ≥ 60/100 |
| Completion time | All | Wall-clock seconds; separate agent runtime and human active time |
| Resource cost | All | Tokens, tool calls, compute, and estimated USD |
| Confidence calibration | Human conditions | Predicted success versus blinded task success |
| Verification coverage | Human conditions | Proportion of critical claims or steps checked |
| Meaningful steering | Human conditions | Material interventions divided by all interventions |
| Errors caught | Human conditions | Agent errors corrected before submission |
| Learning gain | Human conditions | Post-task quiz minus pre-task quiz |

## Subjective measures (human conditions)

| Metric | Instrument |
|---|---|
| Confidence in final answer | 1–7 |
| Process understanding | 1–7 |
| Appropriate reliance | 1–7 plus behavioral measure |
| Agency and ownership | 1–7 |
| Cognitive load | NASA-TLX, 0–100 |
| Usability | SUS, 0–100 |

Report quality separately from time and cost. Report per-task results, paired condition differences, confidence intervals, and effect sizes. Use two blinded raters for interpretive tasks and adjudicate disagreements greater than one point.
