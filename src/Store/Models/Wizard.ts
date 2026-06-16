import type { HouseholdPreferenceProfile } from "@store/Reducers/AppContextReducer";

// Per-step wizard answers persisted under the personal IndexedDB root via the wizard slice.
export type WizardStatus = 'idle' | 'in_progress' | 'completed';

export type WizardStepKey = 'ingredients' | 'servings' | 'time' | 'preferences' | 'result' | (string & {});

export type WizardPreferenceAnswers = Partial<Pick<
    HouseholdPreferenceProfile,
    'servingCount' | 'maxCookMinutes' | 'maxExtraCost' | 'preferredTags' | 'avoidedTags'
>>;

export type WizardAnswers = WizardPreferenceAnswers & {
    selectedIngredientIds?: string[];
    extras?: Record<string, unknown>;
}

export interface WizardState {
    status: WizardStatus;
    currentStep: WizardStepKey;
    answers: WizardAnswers;
}

export const WIZARD_FIRST_STEP: WizardStepKey = 'ingredients';

export const DEFAULT_WIZARD_STATE: WizardState = {
    status: 'idle',
    currentStep: WIZARD_FIRST_STEP,
    answers: {},
};
