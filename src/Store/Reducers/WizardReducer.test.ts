import reducer, {
    advanceWizardStep,
    commitWizardAnswer,
    completeWizard,
    goBackWizardStep,
    restartWizard,
    resumeWizard,
} from './WizardReducer';
import type { WizardState } from '@store/Models/Wizard';

describe('WizardReducer', () => {
    it('initializes to the default wizard state', () => {
        const nextState = reducer(undefined, { type: '@@INIT' } as any);

        expect(nextState).toEqual({
            status: 'idle',
            currentStep: 'ingredients',
            answers: {},
        });
    });

    it('commits per-step answers into serializable wizard state', () => {
        const initialState: WizardState = {
            status: 'idle',
            currentStep: 'ingredients',
            answers: {},
        };

        const withServingCount = reducer(initialState, commitWizardAnswer({ servingCount: 4 }));
        const withIngredients = reducer(withServingCount, commitWizardAnswer({ selectedIngredientIds: ['ing-1'] }));

        expect(withServingCount.answers.servingCount).toBe(4);
        expect(withServingCount.status).toBe('in_progress');
        expect(withIngredients.answers.servingCount).toBe(4);
        expect(withIngredients.answers.selectedIngredientIds).toEqual(['ing-1']);
    });

    it('deep-merges extras answers without clobbering previous extras keys', () => {
        const initialState: WizardState = {
            status: 'in_progress',
            currentStep: 'preferences',
            answers: {
                extras: { a: 1 },
            },
        };

        const nextState = reducer(initialState, commitWizardAnswer({ extras: { b: 2 } }));

        expect(nextState.answers.extras).toEqual({ a: 1, b: 2 });
    });

    it('advances to a target step and marks the session in progress', () => {
        const initialState: WizardState = {
            status: 'idle',
            currentStep: 'ingredients',
            answers: {},
        };

        const nextState = reducer(initialState, advanceWizardStep('servings'));

        expect(nextState.currentStep).toBe('servings');
        expect(nextState.status).toBe('in_progress');
    });

    it('goes back to a target step without dropping committed answers', () => {
        const initialState: WizardState = {
            status: 'in_progress',
            currentStep: 'servings',
            answers: {
                servingCount: 4,
                selectedIngredientIds: ['ing-1'],
            },
        };

        const nextState = reducer(initialState, goBackWizardStep('ingredients'));

        expect(nextState.currentStep).toBe('ingredients');
        expect(nextState.answers).toEqual(initialState.answers);
    });

    it('resumes an in-progress session without resetting current step or answers', () => {
        const initialState: WizardState = {
            status: 'in_progress',
            currentStep: 'time',
            answers: {
                selectedIngredientIds: ['ing-1'],
                maxCookMinutes: 30,
            },
        };

        const nextState = reducer(initialState, resumeWizard());

        expect(nextState).toEqual(initialState);
    });

    it('restarts a completed session as a fresh in-progress wizard', () => {
        const initialState: WizardState = {
            status: 'completed',
            currentStep: 'result',
            answers: {
                servingCount: 4,
                selectedIngredientIds: ['ing-1'],
            },
        };

        const nextState = reducer(initialState, restartWizard());

        expect(nextState.answers).toEqual({});
        expect(nextState.currentStep).toBe('ingredients');
        expect(nextState.status).toBe('in_progress');
    });

    it('completes the wizard while preserving answers and current step', () => {
        const initialState: WizardState = {
            status: 'in_progress',
            currentStep: 'result',
            answers: {
                servingCount: 4,
                selectedIngredientIds: ['ing-1'],
            },
        };

        const nextState = reducer(initialState, completeWizard());

        expect(nextState.status).toBe('completed');
        expect(nextState.currentStep).toBe(initialState.currentStep);
        expect(nextState.answers).toEqual(initialState.answers);
    });

    it('ignores null or undefined commit payloads defensively', () => {
        const initialState: WizardState = {
            status: 'in_progress',
            currentStep: 'preferences',
            answers: {
                servingCount: 4,
            },
        };

        expect(() => reducer(initialState, commitWizardAnswer(null as any))).not.toThrow();

        const afterNull = reducer(initialState, commitWizardAnswer(null as any));
        const afterUndefined = reducer(initialState, commitWizardAnswer(undefined as any));

        expect(afterNull.answers).toEqual(initialState.answers);
        expect(afterUndefined.answers).toEqual(initialState.answers);
    });
});
