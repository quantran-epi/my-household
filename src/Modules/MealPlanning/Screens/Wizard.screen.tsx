import { Box } from "@components/Layout/Box";
import { useModal } from "@components/Modal/ModalProvider";
import { WizardProgress } from "@modules/MealPlanning/Components/WizardProgress";
import { WizardIngredientStep } from "@modules/MealPlanning/Screens/WizardIngredientStep.widget";
import { WizardPreferenceStep } from "@modules/MealPlanning/Screens/WizardPreferenceStep.widget";
import { WizardResult } from "@modules/MealPlanning/Screens/WizardResult.widget";
import { WizardServingsStep } from "@modules/MealPlanning/Screens/WizardServingsStep.widget";
import { WizardAnswers, WizardStepKey } from "@store/Models/Wizard";
import { advanceWizardStep, clearWizardDefaults, commitWizardAnswer, goBackWizardStep, restartWizard, startFreshWizard } from "@store/Reducers/WizardReducer";
import { selectWizardDefaults, selectWizardStatus, selectWizardStep } from "@store/Selectors";
import { AppCopy } from "@common/Copy";
import { Button } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Lean flow for this phase (planner D-03/D-05): the `servings`/`time` keys exist
// in the WizardStepKey union but are not steps yet. The persisted slice is the
// sole source of truth for the current step, so a forced reload resumes mid-flow.
const WIZARD_STEPS: WizardStepKey[] = ['ingredients', 'servings', 'preferences', 'result'];

export const WizardScreen: React.FC = () => {
    const dispatch = useDispatch();
    const modal = useModal();
    const step = useSelector(selectWizardStep);
    const status = useSelector(selectWizardStatus);
    const defaults = useSelector(selectWizardDefaults);

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

    const hasDefaults = defaults !== undefined && Object.keys(defaults).length > 0;

    // Destructive: clearing remembered defaults removes them for good, so gate it
    // behind a confirm (UI-SPEC destructive-confirmation rule) — never silent.
    const confirmClearDefaults = () => {
        modal.confirm({
            title: AppCopy.wizard.clearDefaultsConfirmTitle,
            content: AppCopy.wizard.clearDefaultsConfirmBody,
            okText: AppCopy.wizard.clearDefaultsAction,
            cancelText: AppCopy.common.cancel,
            okButtonProps: { danger: true },
            centered: true,
            onOk: () => dispatch(clearWizardDefaults()),
        });
    };

    return (
        <Box data-testid="wizard-screen" style={{ background: "#ffffff" }}>
            {hasDefaults && currentStep !== 'result' && (
                <Box
                    data-testid="wizard-defaults-hint"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#f5f5f5",
                        borderBottom: "1px solid #ece6f8",
                    }}
                >
                    <span style={{ fontSize: 13, color: "#595959", fontWeight: 600 }}>
                        {AppCopy.wizard.usingLastChoices}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Button
                            type="link"
                            size="small"
                            data-testid="wizard-start-fresh"
                            onClick={() => dispatch(startFreshWizard())}
                            style={{ paddingInline: 4, fontWeight: 600 }}
                        >
                            {AppCopy.wizard.startFreshAction}
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            data-testid="wizard-clear-defaults"
                            onClick={confirmClearDefaults}
                            style={{ paddingInline: 4, fontWeight: 600 }}
                        >
                            {AppCopy.wizard.clearDefaultsAction}
                        </Button>
                    </div>
                </Box>
            )}
            <WizardProgress
                current={idx}
                total={WIZARD_STEPS.length}
                onBack={idx > 0 ? goBack : undefined}
            />

            {currentStep === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
            {currentStep === 'servings' && <WizardServingsStep onNext={goNext} onBack={goBack} />}
            {currentStep === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
            {currentStep === 'result' && <WizardResult />}
        </Box>
    );
};
