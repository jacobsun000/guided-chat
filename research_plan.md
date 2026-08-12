#  When AI Knows More: Scaffolding Human-Agent Collaboration under Expertise Asymmetry

Support users in working with agents that may outsmart them, in the sense that the agents have more context or domain knowledge, but may still make mistakes.

[Github](http://github.com/jacobsun000/guided-chat), [Demo](http://chat.jacobsun.xyz), Access Token: guided-chat-access-token

## Meeting Notes

### 7/29:

- ~~Evaluation & Execution environment setup~~  
- ~~Dataset selection \- LongDS & DSGym gives low-level instructions~~  
- ~~Experiment:~~   
  - ~~Agent Only: Codex~~  
  - ~~Agent \+ Human: Codex app~~  
- Socratic questioning  
- A Wizard of Oz user study

### 7/23:

- ~~Dataset selection~~  
- ~~Evaluation strategy~~  
    
- Too much information on the interface. Scaffolding that   
- P~~ossible dataset selection from the two paper~~  
  - [~~https://arxiv.org/html/2605.30434v1~~](https://arxiv.org/html/2605.30434v1)  
  - ~~https://arxiv.org/pdf/2601.16344~~

### 7/8:

- ~~Define tasks: One modality but with multiple levels of expertise. Clear goal and evaluation measurements. DDL Jul 13~~  
- ~~Run workflows against datasets and the findings may support design~~  
- ~~Interactive demos~~  
- ~~Related works: filter relevant studies and summarize~~  
- ~~http://ccr.sigcomm.org/online/files/p83-keshavA.pdf~~

### 7/1:

- https://arxiv.org/html/2605.30434v1  
    
1. ~~Expand the related work lists, find more papers for each aspect.~~ This might be useful: [https://asta.allen.ai](https://asta.allen.ai)  
2. ~~List dataset for both general and domain specific~~  
3. Clarify agent workflow, techniques to design the scaffolding to meet the three conditions

## TODOs

- ~~Define several tasks for Human-AI collaboration~~  
- ~~Narrow down visualization to a specific design space and improve the visualization rendering~~  
- ~~Embed quizzes into the session~~  
- ~~Enable ongoing support to help user identify & reason about potential issues, like /btw in claude code~~ 

## Related Works

### Expertise Asymmetry: AI+Human collab are valuable when roles and tasks create complementarity

* [When Combinations of Humans and AI Are Useful: A Systematic Review and Meta-Analysis](https://www.nature.com/articles/s41562-024-02024-1) — Human–AI teams often fail to beat the stronger partner, showing that tasks and roles must be chosen for real complementary strengths.  
* [Three Challenges for AI-Assisted Decision-Making](https://journals.sagepub.com/doi/10.1177/17456916231181102) — Identifies complementarity, accurate mental models, and interaction design as challenges, helpful for designing agenda for calibrated teamwork.  
* [Human-AI Collaboration Is Not Very Collaborative Yet: A Taxonomy of Interaction Patterns in AI-Assisted Decision Making](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2024.1521066/full) — This maps common interaction patterns, shows that most systems offer shallow teamwork  
* [Scaffolding Human-AI Collaboration: A Field Experiment on Behavioral Protocols and Cognitive Reframing](https://arxiv.org/abs/2604.08678) — Rigid joint-use rules mislead output, while framing AI as a thought partner can help. scaffolds should guide without adding friction.  
* [Evaluating Human-AI Collaboration: A Review and Methodological Framework](https://arxiv.org/abs/2407.19098) — Proposes metrics for human-led, AI-led, and shared work, helpful when evaluating groups' results and the quality of collaboration.  
* [Human-AI Collaboration in Decision-Making: Beyond Learning to Defer](https://arxiv.org/abs/2206.13202) — Explains why simple deferral methods doesn't work under limits such as missing labels, workload, and change  
* [Predict Responsibly: Improving Fairness and Accuracy by Learning to Defer](https://arxiv.org/abs/1711.06664) — Trains an AI to pass cases to a human when that improves accuracy or fairness, could be a basic model for assigning work by complementary ability.  
* [Who Should Predict? Exact Algorithms for Learning to Defer to Humans](https://proceedings.mlr.press/v206/mozannar23a.html) — Develops methods for choosing whether AI or human should decide each case, reliable task routing could be hard to optimize.  
* [Forming Effective Human-AI Teams: Building Machine Learning Models that Complement Multiple Experts](https://arxiv.org/abs/2206.07948) — Routes each case to the AI or the best-matched human expert, showing how to allocate work across unequal skills.  
* [Towards Human-AI Complementarity with Prediction Sets](https://arxiv.org/abs/2405.17544) — Designs sets of possible answers that help people make better final choices, showing how AI output can support human judgment instead of replacing it.

### Appropriate reliance and trust calibration

* [Fine-Grained Appropriate Reliance: Human-AI Collaboration with a Multi-Step Transparent Decision Workflow for Complex Task Decomposition](https://arxiv.org/abs/2501.10909) — Visible intermediate steps can reduce reliance on bad AI advice when people inspect them  
* [Effect of Confidence and Explanation on Accuracy and Trust Calibration in AI-Assisted Decision Making](https://arxiv.org/abs/2001.02114) — AI confidence can improve trust calibration, but not team results without human knowledge  
* [To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-Assisted Decision-Making](https://arxiv.org/abs/2102.09692) — Prompts that make people think before accepting AI advice reduce over-reliance, though they lower user satisfaction.  
* [Explanations Can Reduce Overreliance on AI Systems During Decision-Making](https://arxiv.org/abs/2212.06823) — Explanations reduce over-reliance when they make checking AI advice worths, verification costs should shape the scaffold.  
* [Not All Uncertainty Is Equal: How Uncertainty Granularity Shapes Human Verification in LLM-Assisted Decision Making](https://arxiv.org/abs/2605.28571) —word-level uncertainty change trust and fact-checking in different ways, some uncertainty displays can discourage verification.  
* [Designing for Appropriate Reliance: The Roles of AI Uncertainty Presentation, Initial User Decision, and User Demographics in AI-Assisted Decision-Making](https://arxiv.org/abs/2401.05612) — Calibrated uncertainty works better in frequency form, reliance varies by user and prior judgment. Personalized scaffolds might be helpful.  
* [Who Should I Trust: AI or Myself? Leveraging Human and AI Correctness Likelihood to Promote Appropriate Trust in AI-Assisted Decision-Making](https://arxiv.org/abs/2301.05809) — Compares the human and AI’s chance of being right for each case  
* [“Are You Really Sure?” Understanding the Effects of Human Self-Confidence Calibration in AI-Assisted Decision Making](https://arxiv.org/abs/2403.09552) — Calibrating users’ confidence improves team results and reliance. should check human confidence before deciding who should act.  
* [Fostering Appropriate Reliance on Large Language Models: The Role of Explanations, Sources, and Inconsistencies](https://arxiv.org/abs/2502.08554) — Explanations could increase blind reliance, sources and visible conflicts help users reject errors  
* [Knowing About Knowing: An Illusion of Human Competence Can Hinder Appropriate Reliance on AI Systems](https://arxiv.org/abs/2301.11333) — Wrong indivivual beliefs breaks reliance and the same tutorial can help or hurt different users

### Scaffolding and steering for LLM collaboration

* [Improving Steering and Verification in AI-Assisted Data Analysis with Interactive Task Decomposition](https://arxiv.org/abs/2407.02651) — Splitting analysis into editable assumptions, plans, and code makes AI results easier to steer and verify  
* [AI Chains: Transparent and Controllable Human-AI Interaction by Chaining Large Language Model Prompts](https://arxiv.org/abs/2110.01691) — Editable steps expose intermediate work and help users test, compare, and fix  
* [PromptChainer: Chaining Large Language Model Prompts through Visual Programming](https://arxiv.org/abs/2203.06566) — A visual chain editor helps non-experts build and debug multi-step LLM workflows  
* [Sensecape: Enabling Multilevel Exploration and Sensemaking with Large Language Models](https://arxiv.org/abs/2305.11483) — Multilevel views let users move between broad ideas and details during LLM-assisted research  
* [Shaping Human-AI Collaboration: Varied Scaffolding Levels in Co-writing with Language Models](https://arxiv.org/abs/2402.11723) — Stronger writing support helps less experienced users but can reduce ownership  
* [ChainForge: A Visual Toolkit for Prompt Engineering and LLM Hypothesis Testing](https://arxiv.org/abs/2309.09128) — Side-by-side testing of prompts and models helps users inspect AI behavior. costs much more

### Traceable visual agent workflows and process understanding

* [WaitGPT: Monitoring and Steering Conversational LLM Agent in Data Analysis with On-the-Fly Code Visualization](https://arxiv.org/abs/2408.01703) — Turning agent code into editable step-by-step views improves checking and steering  
* [Interactive Debugging and Steering of Multi-Agent AI Systems](https://arxiv.org/abs/2503.02068) — Browsing, editing, and resetting agent messages helps people find failures and redirect agent teams  
* [PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows](https://arxiv.org/abs/2508.02866) — Recording prompts, decisions, and downstream effects could cause audit trail  
* [Agentic Visualization: Extracting Agent-Based Design Patterns from Visualization Systems](https://arxiv.org/abs/2505.19101) — patterns for agent roles, communication, and coordination. could learn design patterns from it  
* [LightVA: Lightweight Visual Analytics with LLM Agent-Based Task Planning and Execution](https://arxiv.org/abs/2411.05651) — planner, executor, and controller split analysis into visible tasks that users can guide  
* [DiLLS: Interactive Diagnosis of LLM-based Multi-Agent Systems via Layered Summary of Agent Behaviors](https://arxiv.org/abs/2602.05446) — Layered summaries turn long agent logs into inspectable steps  
* [TRAIL: Trace Reasoning and Agentic Issue Localization](https://arxiv.org/abs/2505.08638) — Mainly researching errors in agent traces, shows that automated debugging is weak. Paper is slightly out-of-date  
* [Seeing the Whole Elephant: A Benchmark for Failure Attribution in LLM-based Multi-Agent Systems](https://arxiv.org/abs/2604.22708) — benchmark shows that full inputs, context, and outputs make failures easier to trace  
* [DataTone: Managing Ambiguity in Natural Language Interfaces for Data Visualization](https://doi.org/10.1145/2807442.2807478) — lets users resolve unclear system choices as they arise, pattern for resolving intents. Like coding agents' plan mode.  
* [Characterizing Users' Visual Analytic Activity for Insight Provenance](https://doi.org/10.1057/ivs.2008.31) — turns low-level user events into meaningful actions, could help scaffold presenting clear and reviewable history

### Evaluation

* [Galaxy Zoo: Morphologies Derived from Visual Inspection of Galaxies from the Sloan Digital Sky Survey](https://arxiv.org/abs/0804.4483)  
* [DSGym: A Holistic Framework for Evaluating and Training Data Science Agents](https://arxiv.org/abs/2601.16344)  
* [On the Failure of Long-Horizon Agentic Data Analysis](https://arxiv.org/abs/2605.30434)  
* [A Realistic Benchmark for Data Science Code Generation](https://arxiv.org/abs/2505.15621)  
* [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770)  
* [WebGen-Bench: Evaluating LLMs on Generating Interactive and Functional Websites from Scratch](https://arxiv.org/abs/2505.03733)  
* [WebUIBench: A Comprehensive Benchmark for Evaluating Multimodal Large Language Models in WebUI-to-Code](https://arxiv.org/abs/2506.07818)  
* [BIRD: A Big Bench for Large-Scale Database Grounded Text-to-SQL Evaluation](https://arxiv.org/abs/2305.03111)  
* [nvBench: A Large-Scale Synthesized Dataset for Cross-Domain Natural Language to Visualization Task](https://arxiv.org/abs/2112.12926)  
* [QASPER: A Dataset of Information-Seeking Questions and Answers Anchored in Research Papers](https://arxiv.org/abs/2105.03011)  
* [DeepSWE](https://deepswe.datacurve.ai/)

## Goal

I envision scaffolding as expertise-bounded parts that are:  
	1\.	**Answerable by the user**  
	2\.	**Scientifically meaningful**  
3\.	**Useful for checking the AI**

Testing among three conditions: (1) just AI; (2) human \+ AI \+ Scaffold; (3) human \+ AI

Measurements: (1) task accuracy, (2) time, (3) user confidence, (4) user skills (do they know more about the subject after the study) 

Within-subject design, the order of condition and dataset/task will be counterbalanced.

Platform: haven’t decided, we can either use zooniverse, in-lab studies, or prolific

### Human-AI collab net return

**Net Value**  
\= Agent Production Capability  
\+ Process Understanding Value  
\- Human Verification Cost  
\- Error Cost

This project may help in increasing **process understanding value**, and decrease **human verification cost**.

### Human-AI collab task classification

|  | Black-box process acceptable | Process needs to be auditable |
| :---- | :---- | :---- |
| **Output is verifiable** | Tasks that AI could produce an artifact and humans can easily verify. E.g. entry-level programming, aka vibe coding | Tasks where output is testable, but the process matters. E.g. data analysis |
| **Output hard to verify** | Tasks without a single correct answer, generation-focused tasks. E.g. design, brainstorming | Tasks where conclusions depend on evidence or domain expertise. E.g. galaxyzoo, paper interpretation |

Collaboration task difficulty increases from top-left to bottom-right, as it requires cognitive alignment between humans and AI. To resolve tasks efficiently, scaffolding could provide more reasoning details for the right column, and direct more control to humans for the bottom row.

In this project we’ll design an adjustable scaffolding and pick tasks from each of the 4 categories to evaluate the effectiveness of the scaffolding.

## Implementation

### Task Sets

- **Verifiable output & process important**  
- **Non-verifiable output & process important**

### Datasets & Tasks

- [NYC Taxi Trip Dataset](https://chat.jacobsun.xyz/datasets/nyc_tlc_trip_records) (General dataset)  
  - [When Riders Tip More](https://chat.jacobsun.xyz/tasks/tlc-01) (Verifiable)  
  - [Where Ride Availability Fall Short](https://chat.jacobsun.xyz/tasks/tlc-04) (Intermediate)  
  - [How Well Specialized Ride Option Works](https://chat.jacobsun.xyz/tasks/tlc-05) (Non-verifiable)  
      
- [SEC Financial Statements](https://chat.jacobsun.xyz/datasets/sec_financial_statement_notes) (Domain specific dataset)  
  - [Financially Resilient Companies](https://chat.jacobsun.xyz/tasks/sec-05) (Non-verifiable)  
  - [Risks Companies Are Emphasizing](https://chat.jacobsun.xyz/tasks/sec-03) (Non-verifiable)  
  - [Companies Improving Profitability](https://chat.jacobsun.xyz/tasks/sec-05) (Verifiable)

Concrete examples for two categories. 3 conditions, general/domain-specific dataset,   
Each participant will go through human+scaffolding condition OR normal human (existing chat interface) condition and go through all tasks. Should be comparable.  
Task coverage: 

- **all tabular data: but different levels of domain expertise**

### Evaluation Metrics

| Metric | Verifiable Tasks | Hard-to-Verify Tasks |
| :---- | :---- | :---- |
| Correctness | Exact match or numerical error | Human/LLM eval |
| Process validity | Correct filters, formulas, and transformations | Logical coherence and valid assumptions |
| Evidence use | Correct source / formula cited | \- |
| Calibration | Confidence vs. correctness | \- |
| Efficiency | Time, tool calls, cost | \- |

### Hypothesis

- For non-verifiable output tasks, it’s harder to design a reinforcement learning process for LLM, so that the model is likely to have lower performance  
- Human performs better at making high-level decisions and they know what they need —- LLM may not  
- Not all users prefer and know how to efficiently collaborate with agents. A scaffolding helps and enforces effective collaboration

### Scaffolding

- Traceable agentic steps backed by evidence, domain expertise, and consistent reasoning  
- Tutorial-like walkthrough that guides humans to reason about the detailed steps, with adjustable level-of-detail exposure.  
- Progressive output reduces cost to identify errors  
- On-going support that allows human zoom into a specific term/knowledge  
- Quizzes that encourage thoughts and deepens understanding  
- Visual elements that reduces understanding cost

### Workflow

1. Users pick a topic. Agent runs background research on the topic, and ask clarifying questions if needed  
2. Agent completes the background research and sorts out its research steps to a high-level outline. The dependent map of the steps needs to be drawn for later use.  
3. Agent follows the outline and generates a “slide” for each step. The slide consists of summarized raw findings with optional visualization to help understanding. Slides should follow the dependency resolution, where prerequisites must be shown prior to steps dependent on it.  
4.  After each slide, user could select the next exploratory step. Steps that have prerequisites incomplete will not be an exploration option. After each slide with core concept, terms, or inferences, there could be quizzes to test the user's understanding.  
5. After all steps are explored, user should be able to conclude their own thoughts on the topic.

Extra: Inspired by the 6/29 Zooniverse meeting and the initial zooniverse agent demo, a game-like map may help users navigate between detailed steps. After workflow step 2 the dependency tree is resolved, we could easily draw a tree/map to give the user a high-level overview of the steps. 

## Gaps

- Map gets overwhelming when the topic itself depends on many prerequisites  
- 

## Evaluation

The pre-registered metric definitions live in [`evaluation/baseline-metrics.json`](evaluation/baseline-metrics.json). The three conditions use the same blinded artifact-quality rubric (correctness, completeness, process validity, evidence/traceability, and uncertainty/limitations) and the same wall-clock/resource telemetry. Human conditions additionally collect active human time, confidence calibration, verification and steering behavior, pre/post learning, confidence, understanding, appropriate reliance, agency, NASA-TLX, and SUS. Agent-only subjective values are marked not applicable rather than zero.

Report per-task outcomes and participant-clustered paired comparisons with confidence intervals and effect sizes. Keep quality separate from time/cost and show their trade-off. Interpretive tasks should receive two blinded ratings with adjudication for disagreements greater than one 0–4 rubric point.

## Current Progress

- Basic research agent  
- User-guided page by page progressive exposure  
- Visualization using HTML blocks  
- Quizzes after session