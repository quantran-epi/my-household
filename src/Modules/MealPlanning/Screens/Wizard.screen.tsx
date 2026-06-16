import { Box } from "@components/Layout/Box";
import { WizardProgress } from "@modules/MealPlanning/Components/WizardProgress";
import { WizardIngredientStep } from "@modules/MealPlanning/Screens/WizardIngredientStep.widget";
import { WizardPreferenceStep } from "@modules/MealPlanning/Screens/WizardPreferenceStep.widget";
import { WizardResult } from "@modules/MealPlanning/Screens/WizardResult.widget";
import { WizardAnswers, WizardStepKey } from "@store/Models/Wizard";
import { advanceWizardStep, commitWizardAnswer, goBackWizardStep, restartWizard } from "@store/Reducers/WizardReducer";
import { selectWizardStatus, selectWizardStep } from "@store/Selectors";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Lean flow for this phase (planner D-03/D-05): the `servings`/`time` keys exist
// in the WizardStepKey union but are not steps yet. The persisted slice is the
// sole source of truth for the current step, so a forced reload resumes mid-flow.
const WIZARD_STEPS: WizardStepKey[] = ['ingredients', 'preferences', 'result'];

export const WizardScreen: React.FC = () => {
    const dispatch = useDispatch();
    const step = useSelector(selectWizardStep);
    const status = useSelector(selectWizardStatus);

    // Re-entering the flow after finishing must start fresh, not resume on the
    // stale completed result (UAT gap 2). restartWizard flips status to
    // 'in_progress' and resets to the ingredients step, so this fires once on
    // mount and cannot loop.
    useEffect(() => {
        if (status === 'completed') dispatch(restartWizard());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Clamp unknown/tampered persisted step keys to the first step rather than
    // rendering nothing (threat T-04-06). The body renders off `currentStep`
    // (the clamped key), so a corrupted or not-yet-built key can never produce
    // a contentless dead-end.
    const idx = Math.max(0, WIZARD_STEPS.indexOf(step));
    const currentStep = WIZARD_STEPS[idx];

    const goNext = (answer: Partial<WizardAnswers>) => {
        dispatch(commitWizardAnswer(answer));
        const next = WIZARD_STEPS[idx + 1];
        if (next) dispatch(advanceWizardStep(next));
    };

    const goBack = () => {
        const prev = WIZARD_STEPS[idx - 1];
        if (prev) dispatch(goBackWizardStep(prev));
    };

    return (
        <Box data-testid="wizard-screen" style={{ background: "#ffffff" }}>
            <WizardProgress
                current={idx}
                total={WIZARD_STEPS.length}
                onBack={idx > 0 ? goBack : undefined}
            />

            {currentStep === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
            {currentStep === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
            {currentStep === 'result' && <WizardResult />}
        </Box>
    );
};
