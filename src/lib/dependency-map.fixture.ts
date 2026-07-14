import type { DependencyMap } from "./dependency-map.ts"

export const demoDependencyMap: DependencyMap = {
  map_id: "map-paper-evaluation-demo",
  research_question: "Does this paper's evidence support its main conclusion?",
  interaction_goal: "help_user_build_their_own_answer",
  assumed_user_prior_knowledge: ["Basic reading comprehension"],
  detected_knowledge_gaps: [
    "Study design",
    "Primary outcome",
    "Difference between statistical significance and practical significance",
  ],
  sources: [
    {
      source_id: "source-paper",
      title: "Uploaded academic paper",
      source_type: "paper",
      reliability_note:
        "Primary source for the authors' claims; still needs methodological inspection.",
    },
  ],
  nodes: [
    {
      id: "term-primary-outcome",
      label: "Primary outcome",
      kind: "term",
      summary:
        "The main measurement used to judge whether the study's intervention worked.",
      why_it_matters:
        "If the primary outcome is weak or mismatched, the conclusion is harder to trust.",
      prerequisites: [],
      view_mode: "glossary_card",
      importance: "core",
      misunderstanding_risk: "medium",
      status: "definition",
    },
    {
      id: "topic-study-design",
      label: "Study design",
      kind: "topic",
      summary:
        "The study design determines what kinds of claims the evidence can support.",
      why_it_matters:
        "Some designs support causal claims; others only support associations.",
      prerequisites: [],
      view_mode: "slide",
      importance: "core",
      misunderstanding_risk: "high",
      status: "well_supported",
      verification_focus:
        "Check assignment method, control group, sample, and measurement timing.",
    },
    {
      id: "evidence-results-table",
      label: "Results table",
      kind: "evidence",
      summary:
        "The results table reports the measured change on the primary outcome.",
      why_it_matters:
        "This is the direct evidence behind the main reported result.",
      prerequisites: ["term-primary-outcome"],
      view_mode: "evidence_card",
      importance: "core",
      misunderstanding_risk: "high",
      status: "observed_fact",
      source_refs: ["source-paper"],
      verification_focus:
        "Check whether the reported effect size, sample size, and exclusions match the authors' conclusion.",
    },
    {
      id: "claim-main-result",
      label: "Main reported result",
      kind: "claim",
      summary: "The paper reports an improvement on the primary outcome.",
      why_it_matters:
        "This is the central claim that the final judgment must evaluate.",
      prerequisites: [
        "term-primary-outcome",
        "topic-study-design",
        "evidence-results-table",
      ],
      evidence_node_ids: ["evidence-results-table"],
      view_mode: "claim_inspection",
      importance: "core",
      misunderstanding_risk: "high",
      status: "contested",
      confidence: {
        level: "medium",
        rationale:
          "The result may be reported clearly, but its interpretation depends on design and validity assumptions.",
      },
      verification_focus:
        "Inspect whether the outcome, sample, and study design justify the strength of the conclusion.",
    },
    {
      id: "uncertainty-selection-bias",
      label: "Selection-bias concern",
      kind: "uncertainty",
      summary:
        "The observed result may partly reflect who entered or remained in the study.",
      why_it_matters: "Selection bias can weaken causal interpretation.",
      prerequisites: ["topic-study-design"],
      view_mode: "comparison_view",
      importance: "core",
      misunderstanding_risk: "high",
      status: "contested",
      verification_focus:
        "Check recruitment, exclusions, attrition, and whether groups were comparable.",
    },
    {
      id: "final-user-synthesis",
      label: "Build your judgment",
      kind: "final_synthesis",
      summary:
        "Use inspected evidence, claims, and uncertainties to decide how strongly the paper's conclusion is supported.",
      why_it_matters: "This is where the user forms their own answer.",
      prerequisites: ["claim-main-result", "uncertainty-selection-bias"],
      view_mode: "synthesis_workspace",
      importance: "core",
      misunderstanding_risk: "high",
      status: "unknown",
      verification_focus:
        "Review which inspected nodes are accepted, flagged, or still unresolved before drafting a judgment.",
    },
  ],
  edges: [
    {
      from: "term-primary-outcome",
      to: "evidence-results-table",
      kind: "prerequisite",
      rationale:
        "The user needs to know what the measured outcome means before interpreting the results table.",
      strength: "hard",
    },
    {
      from: "term-primary-outcome",
      to: "claim-main-result",
      kind: "prerequisite",
      rationale:
        "The user needs to know what outcome was measured before interpreting the claim.",
      strength: "hard",
    },
    {
      from: "topic-study-design",
      to: "claim-main-result",
      kind: "prerequisite",
      rationale:
        "The design determines what kind of conclusion the result can support.",
      strength: "hard",
    },
    {
      from: "evidence-results-table",
      to: "claim-main-result",
      kind: "evidence_for",
      rationale: "The claim relies on the reported results.",
      strength: "hard",
    },
    {
      from: "uncertainty-selection-bias",
      to: "claim-main-result",
      kind: "contradicts",
      rationale:
        "Selection bias would weaken the causal interpretation of the reported result.",
      strength: "soft",
    },
    {
      from: "claim-main-result",
      to: "final-user-synthesis",
      kind: "prerequisite",
      rationale: "The final judgment depends on whether the user accepts the main result.",
      strength: "hard",
    },
    {
      from: "uncertainty-selection-bias",
      to: "final-user-synthesis",
      kind: "prerequisite",
      rationale:
        "The final judgment should account for unresolved selection-bias concerns.",
      strength: "hard",
    },
  ],
  entry_node_ids: ["term-primary-outcome", "topic-study-design"],
  recommended_first_node_ids: ["topic-study-design", "term-primary-outcome"],
  final_node_id: "final-user-synthesis",
  global_uncertainties: [
    "The strength of the conclusion depends on whether the study design supports causal interpretation.",
  ],
  map_rendering_hints: {
    suggested_layout: "layered_dag",
  },
}
