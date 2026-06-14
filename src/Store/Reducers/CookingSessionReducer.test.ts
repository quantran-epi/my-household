jest.mock('nanoid', () => ({
    nanoid: () => 'test-id',
}));

import reducer, { clearCookingHistory } from './CookingSessionReducer';
import type { CookingSessionState } from './CookingSessionReducer';

describe('CookingSessionReducer', () => {
    it('keeps durable feedback and cook-time data when clearing cooking history', () => {
        const initialState: CookingSessionState = {
            sessions: [
                {
                    id: 'active-session',
                    dishId: 'dish-1',
                    dishName: 'Bun bo',
                    startedAt: '2026-06-14T08:00:00.000Z',
                    status: 'cooking',
                    steps: ['Cook'],
                    currentStepIndex: 0,
                },
                {
                    id: 'finished-session',
                    dishId: 'dish-2',
                    dishName: 'Pho',
                    startedAt: '2026-06-13T08:00:00.000Z',
                    finishedAt: '2026-06-13T08:30:00.000Z',
                    status: 'finished',
                    steps: ['Cook'],
                    currentStepIndex: 0,
                    memberFeedback: {
                        'member-1': 'liked',
                    },
                },
                {
                    id: 'cancelled-session',
                    dishId: 'dish-3',
                    dishName: 'Chao',
                    startedAt: '2026-06-12T08:00:00.000Z',
                    finishedAt: '2026-06-12T08:10:00.000Z',
                    status: 'cancelled',
                    steps: ['Cook'],
                    currentStepIndex: 0,
                },
            ],
            cookTimeStats: {
                'dish-2': {
                    dishId: 'dish-2',
                    samples: 3,
                    avgTotalMinutes: 28,
                    lastTotalMinutes: 30,
                    updatedAt: '2026-06-13T08:30:00.000Z',
                },
            },
            dishFeedback: {
                'dish-2': {
                    dishId: 'dish-2',
                    members: {
                        'member-1': { liked: 2, neutral: 0, disliked: 0 },
                    },
                    updatedAt: '2026-06-13T08:30:00.000Z',
                },
            },
            dishFeedbackHistory: [
                {
                    id: 'feedback-history-1',
                    dishId: 'dish-2',
                    dishName: 'Pho',
                    mealSlot: 'breakfast',
                    mealDate: '2026-06-13',
                    memberFeedback: {
                        'member-1': 'liked',
                    },
                    createdAt: '2026-06-13T08:30:00.000Z',
                    updatedAt: '2026-06-13T08:30:00.000Z',
                },
            ],
        };

        const nextState = reducer(initialState, clearCookingHistory());

        expect(nextState.sessions).toHaveLength(1);
        expect(nextState.sessions[0].id).toBe('active-session');
        expect(nextState.cookTimeStats).toEqual(initialState.cookTimeStats);
        expect(nextState.dishFeedback).toEqual(initialState.dishFeedback);
        expect(nextState.dishFeedbackHistory).toEqual(initialState.dishFeedbackHistory);
    });
});
