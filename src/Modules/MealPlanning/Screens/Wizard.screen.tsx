import { Box } from "@components/Layout/Box";
import { WizardProgress } from "@modules/MealPlanning/Components/WizardProgress";
import { WizardIngredientStep } from "@modules/MealPlanning/Screens/WizardIngredientStep.widget";
import { WizardPreferenceStep } from "@modules/MealPlanning/Screens/WizardPreferenceStep.widget";
import { WizardResult } from "@modules/MealPlanning/Screens/WizardResult.widget";
import { WizardAnswers, WizardStepKey } from "@store/Models/Wizard";
import { advanceWizardStep, commitWizardAnswer, goBackWizardStep } from "@store/Reducers/WizardReducer";
import { selectWizardStep } from "@store/Selectors";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

// Lean flow for this phase (planner D-03/D-05): the `servings`/`time` keys exist
// in the WizardStepKey union but are not steps yet. The persisted slice is the
// sole source of truth for the current step, so a forced reload resumes mid-flow.
const WIZARD_STEPS: WizardStepKey[] = ['ingredients', 'preferences', 'result'];

export const WizardScreen: React.FC = () => {
    const dispatch = useDispatch();
    const step = useSelector(selectWizardStep);
    // Clamp unknown/tampered persisted step keys to the first step rather than
    // rendering nothing (threat T-04-06).
    const idx = Math.max(0, WIZARD_STEPS.indexOf(step));

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

            {step === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
            {step === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
            {step === 'result' && <WizardResult />}
        </Box>
    );
};
