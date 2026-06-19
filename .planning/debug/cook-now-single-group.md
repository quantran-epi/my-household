---
status: investigating
trigger: "Cook-now mode: wizard results should show 3 groups (Nấu ngay / Cần mua thêm ít / Dự phòng) but only the middle group (Cần mua thêm ít) renders."
created: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — groupCookNow thresholds, combined with serving-scaling in scoreCookNow and a high additive cookNowScore baseline, collapse nearly every surviving dish into group[1] "Cần mua thêm ít". Render layer ruled out.
test: Traced group[0]/[1]/[2] entry conditions against scoreCookNow output and limitGroups budget behavior.
expecting: group[0] empty (no dish fully stocked at scaled amounts), group[2] empty (cookNowScore baseline > 0.58 keeps low-score dishes in middle).
next_action: Return ROOT CAUSE FOUND (find_root_cause_only mode).

## Symptoms

expected: Cook-now results render up to three groups — "Nấu ngay", "Cần mua thêm ít", "Dự phòng" — populated per scorer, never dead-end on empty ready group.
actual: Only the "Cần mua thêm ít" group renders; the other two groups are missing.
errors: None reported.
reproduction: Test 4 in 06-UAT.md — enable cook-now toggle ("Ưu tiên nấu được ngay") with inventory data, run wizard to results.
started: Discovered during UAT of Phase 6.

## Eliminated

- hypothesis: Render layer (limitGroups / WizardResult map) only renders one group.
  evidence: limitGroups (WizardResult.widget.tsx:245-254) shares one budget (limit=5) across groups left-to-right via slice(0, remaining). It can only starve LATER groups after earlier ones consume the budget — it can never drop group[0] "Nấu ngay" while keeping group[1]. The render map at 463-469 iterates all displayGroups and renders every label. So the render layer cannot produce "only the middle group shows". Symptom originates upstream in grouping/scoring.
  timestamp: 2026-06-19T00:00:00Z

## Evidence

- timestamp: 2026-06-19T00:00:00Z
  checked: DishScorer.groupCookNow + scoreInventoryDishes filter
  found: scoreInventoryDishes filters to score>0 && stockedIngredientIds.length>0. groupCookNow assigns group[0]=Nấu ngay only when missingIngredientIds.length===0; group[1]=Cần mua thêm ít when (score>=0.5 || cookNowScore>=0.58) && missing<=3; else group[2]=Dự phòng.
  implication: group[0] requires fully-stocked dish; group[2] requires missing>3 OR low scores.

- timestamp: 2026-06-19T00:00:00Z
  checked: scoreCookNow serving scaling (getDishServingScale, scoreInventoryDishes amounts)
  found: scoreCookNow uses getScale = getDishServingScale(dish, profile.servingCount) = max(0.25, servingCount/baseServings) with baseServings default 2. Required amounts are multiplied by scale (DishScorer.ts:151). servingCount comes from answers.servingCount (WizardResult:427). With servingCount > baseServings (e.g. 4 people), required amounts inflate beyond stock so dishes that were fully stocked at base servings now compute missing>0. scoreWithInventory/DishScorer.group do NOT scale.
  implication: With realistic servingCount, NO dish reaches missing===0 → group[0] "Nấu ngay" is permanently empty.

- timestamp: 2026-06-19T00:00:00Z
  checked: cookNowScore composition (DishScorer.ts:339-346) vs group[2] threshold 0.58
  found: cookNowScore = score*0.42 + speed*0.18 + preference*0.16 + nutrition*0.14 + budget*0.10 + urgentBoost. Non-inventory terms supply a large fixed baseline (speed up to 0.18, preference default 0.65*0.16≈0.104, nutrition default 0.14, budget ~0.082-0.10) totaling ~0.5+. Even low-inventory-score dishes clear 0.58 cookNowScore.
  implication: The `|| cookNowScore >= 0.58` clause routes low-readiness dishes (missing<=3) into group[1] instead of group[2]. group[2] only reachable via missing>3.

## Resolution

root_cause: |
  Two compounding issues in DishScorer (NOT the render layer) collapse cook-now results into only the middle "Cần mua thêm ít" group:

  1. group[0] "Nấu ngay" is gated on missingIngredientIds.length === 0 (DishScorer.ts:403), but scoreCookNow scales every dish's required ingredient amounts to the household servingCount via getDishServingScale (servingCount/baseServings, baseServings default 2). When servingCount > baseServings (the normal case), scaled requirements exceed stock so no dish computes missing===0. "Nấu ngay" is permanently empty. scoreWithInventory + DishScorer.group do NOT apply this scaling, which is why standard inventory grouping shows a ready group but cook-now never does.

  2. group[2] "Dự phòng" is gated by NOT(score>=0.5 OR cookNowScore>=0.58) OR missing>3 (DishScorer.ts:405-407). The cookNowScore formula has a large fixed baseline (~0.5+) from speed/preference/nutrition/budget weights, so even low-inventory-score dishes clear the 0.58 threshold and, with <=3 missing, get routed into group[1]. Combined with the survivor filter (score>0 && has stock) biasing candidates toward "partial", essentially every surviving dish lands in the middle bucket; only dishes with >3 missing reach group[2].

  The unit test passes because makeScoredDish feeds hand-crafted score/cookNowScore/missing values that deliberately hit each bucket; it never exercises the real scoreCookNow → groupCookNow pipeline with serving scaling, so the collapse is invisible to the test.
fix: |
  (NOT APPLIED — find_root_cause_only mode.) Suggested direction:
  - Decouple the "Nấu ngay" readiness check from serving-scaled amounts: base the missing===0/readiness decision on UNSCALED requirements (or a separate scaled shortfall measure), or relax group[0] to allow a small shortfall tolerance rather than exact zero-missing against scaled amounts.
  - Re-tune group[2] gating so the cookNowScore baseline doesn't swallow low-readiness dishes: drop the `|| cookNowScore >= 0.58` clause for the middle bucket, or base the middle/backup boundary on inventory readiness (score / missing count) rather than the composite cookNowScore.
  - Add a test that runs the real scoreCookNow → groupCookNow pipeline with servingCount > baseServings to pin the three-bucket distribution.
verification:
files_changed: []
