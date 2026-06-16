import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    DEFAULT_WIZARD_STATE,
    WIZARD_FIRST_STEP,
    WizardAnswers,
    WizardState,
    WizardStepKey,
} from '@store/Models/Wizard';

const initialState: WizardState = DEFAULT_WIZARD_STATE;

const normalizeExtras = (extras?: WizardAnswers['extras'] | null): Record<string, unknown> | null => {
    if (!extras || typeof extras !== 'object' || Array.isArray(extras)) return null;
    return extras;
};

export const wizardSlice = createSlice({
    name: 'wizard',
    initialState,
    reducers: {
        commitWizardAnswer: (state, action: PayloadAction<Partial<WizardAnswers>>) => {
            const nextAnswers = action.payload;
            if (!nextAnswers) return;

            const { extras, ...answers } = nextAnswers;
            state.answers = {
                ...state.answers,
                ...answers,
            };

            const nextExtras = normalizeExtras(extras);
            if (nextExtras) {
                state.answers.extras = {
                    ...(state.answers.extras ?? {}),
                    ...nextExtras,
                };
            }

            if (state.status === 'idle') state.status = 'in_progress';
        },
        advanceWizardStep: (state, action: PayloadAction<WizardStepKey>) => {
            state.currentStep = action.payload;
            state.status = 'in_progress';
        },
        goBackWizardStep: (state, action: PayloadAction<WizardStepKey>) => {
            state.currentStep = action.payload;
        },
        resumeWizard: state => {
            // Rehydrated in-progress wizard state is already the source of truth; resume must not reset.
            return state;
        },
        restartWizard: state => {
            state.answers = {};
            state.currentStep = WIZARD_FIRST_STEP;
            state.status = 'in_progress';
        },
        completeWizard: state => {
            state.status = 'completed';
        },
    },
});

export const {
    commitWizardAnswer,
    advanceWizardStep,
    goBackWizardStep,
    resumeWizard,
    restartWizard,
    completeWizard,
} = wizardSlice.actions;

export default wizardSlice.reducer;
