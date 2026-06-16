import { DishScorer, ScoredDish } from './DishScorer';
import type { Dishes, DishesIngredientAmount } from '@store/Models/Dishes';

const emptyDuration = {
    unfreeze: null,
    prepare: null,
    cooking: null,
    serve: null,
    cooldown: null,
};

const ingredient = (ingredientId: string, amount = '100'): DishesIngredientAmount => ({
    ingredientId,
    unit: 'g',
    amount,
    dishesId: 'fixture-dish',
    required: true,
});

const makeDish = (partial: Partial<Dishes> & Pick<Dishes, 'id' | 'name'>): Dishes => ({
    ingredients: [],
    note: '',
    includeDishes: [],
    steps: [],
    isCompleted: true,
    duration: emptyDuration,
    ...partial,
});

const scoreFixtureDishes = [
    makeDish({
        id: 'complete-dish',
        name: 'Complete dish',
        ingredients: [ingredient('ing-1'), ingredient('ing-2')],
    }),
    makeDish({
        id: 'partial-dish',
        name: 'Partial dish',
        ingredients: [ingredient('ing-1'), ingredient('ing-4')],
    }),
    makeDish({
        id: 'included-dish',
        name: 'Included dish',
        ingredients: [ingredient('ing-5')],
    }),
    makeDish({
        id: 'nested-dish',
        name: 'Nested dish',
        ingredients: [ingredient('ing-1'), ingredient('ing-2')],
        includeDishes: ['included-dish'],
    }),
    makeDish({
        id: 'side-dish',
        name: 'Side dish',
        ingredients: [ingredient('ing-1')],
        isAccompaniment: true,
    }),
];

const makeScoredDish = (id: string, score: number, missingIngredientIds: string[], cookNowScore?: number): ScoredDish => ({
    dish: makeDish({ id, name: id, ingredients: [ingredient(`${id}-ingredient`)] }),
    score,
    matchedIngredientIds: [],
    missingIngredientIds,
    ...(cookNowScore === undefined ? {} : { cookNowScore }),
});

describe('DishScorer', () => {
    describe('score', () => {
        it('pins selected-ingredient scoring, ordering, and accompaniment filtering', () => {
            const scored = DishScorer.score(scoreFixtureDishes, ['ing-1', 'ing-2'], scoreFixtureDishes);

            expect(scored.map(item => ({
                id: item.dish.id,
                score: item.score,
                matchedIngredientIds: item.matchedIngredientIds,
                missingIngredientIds: item.missingIngredientIds,
            }))).toEqual([
                {
                    id: 'complete-dish',
                    score: 1,
                    matchedIngredientIds: ['ing-1', 'ing-2'],
                    missingIngredientIds: [],
                },
                {
                    id: 'nested-dish',
                    score: 2 / 3,
                    matchedIngredientIds: ['ing-1', 'ing-2'],
                    missingIngredientIds: ['ing-5'],
                },
                {
                    id: 'partial-dish',
                    score: 0.5,
                    matchedIngredientIds: ['ing-1'],
                    missingIngredientIds: ['ing-4'],
                },
            ]);
            expect(scored.some(item => item.dish.id === 'side-dish')).toBe(false);
        });

        it('pins empty selected-ingredient guards', () => {
            expect(DishScorer.score([], [], scoreFixtureDishes)).toEqual([]);
            expect(DishScorer.score(scoreFixtureDishes, [], scoreFixtureDishes)).toEqual([]);
        });
    });

    describe('group', () => {
        it('pins score bucket labels and drops empty buckets', () => {
            const groups = DishScorer.group([
                makeScoredDish('full-match', 1, []),
                makeScoredDish('near-match', 0.6, ['ing-2']),
                makeScoredDish('fallback', 0.3, ['ing-2', 'ing-3']),
            ]);

            expect(groups.map(group => ({
                label: group.label,
                minScore: group.minScore,
                maxScore: group.maxScore,
                color: group.color,
                dishIds: group.dishes.map(item => item.dish.id),
            }))).toEqual([
                { label: 'Nấu được ngay 🟢', minScore: 1, maxScore: 1, color: '#52c41a', dishIds: ['full-match'] },
                { label: 'Gần đủ nguyên liệu 🟡', minScore: 0.5, maxScore: 1, color: '#faad14', dishIds: ['near-match'] },
                { label: 'Có thể gợi ý 🟠', minScore: 0, maxScore: 0.5, color: '#fa8c16', dishIds: ['fallback'] },
            ]);

            expect(DishScorer.group([makeScoredDish('only-full-match', 1, [])]).map(group => group.label))
                .toEqual(['Nấu được ngay 🟢']);
        });
    });

    describe('groupCookNow', () => {
        it('pins cook-now bucket rules, ordering, and empty-bucket filtering', () => {
            const groups = DishScorer.groupCookNow([
                makeScoredDish('ready-lower-score', 1, [], 0.7),
                makeScoredDish('ready-higher-score', 1, [], 0.9),
                makeScoredDish('near-by-score', 0.6, ['ing-2', 'ing-3'], 0.52),
                makeScoredDish('near-by-cook-now', 0.4, ['ing-4'], 0.6),
                makeScoredDish('fallback', 0.2, ['ing-5', 'ing-6', 'ing-7', 'ing-8'], 0.4),
            ]);

            expect(groups.map(group => ({
                label: group.label,
                minScore: group.minScore,
                maxScore: group.maxScore,
                color: group.color,
                dishIds: group.dishes.map(item => item.dish.id),
            }))).toEqual([
                { label: 'Nấu ngay', minScore: 0.75, maxScore: 1, color: '#389e0d', dishIds: ['ready-higher-score', 'ready-lower-score'] },
                { label: 'Mua thêm ít', minScore: 0.5, maxScore: 0.75, color: '#1677ff', dishIds: ['near-by-cook-now', 'near-by-score'] },
                { label: 'Dự phòng', minScore: 0, maxScore: 0.5, color: '#fa8c16', dishIds: ['fallback'] },
            ]);

            expect(DishScorer.groupCookNow([makeScoredDish('only-ready', 1, [], 0.8)]).map(group => group.label))
                .toEqual(['Nấu ngay']);
        });
    });
});
