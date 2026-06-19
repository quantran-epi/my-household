import { DishScorer, ScoredDish } from './DishScorer';
import type { Dishes, DishesIngredientAmount } from '@store/Models/Dishes';
import type { Ingredient, IngredientInventory } from '@store/Models/Ingredient';
import { DEFAULT_HOUSEHOLD_PREFERENCE_PROFILE } from '@store/Reducers/AppContextReducer';

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

const makeIngredient = (partial: Partial<Ingredient> & Pick<Ingredient, 'id' | 'name'>): Ingredient => ({
    baseUnit: 'g',
    inventoryUnits: ['g'],
    recipeUnitConversions: { g: 1 },
    ...partial,
});

const inventoryBatch = (id: string, amount: number, expiresAt?: string): IngredientInventory => ({
    lastUpdated: new Date('2026-06-15T00:00:00.000Z'),
    batches: [
        {
            id,
            amount,
            unit: 'g',
            ...(expiresAt ? { expiresAt } : {}),
        },
    ],
});

const inventoryIngredients = [
    makeIngredient({
        id: 'ing-1',
        name: 'Urgent stocked ingredient',
        shelfLife: 'short',
        priceEstimate: { min: 10000, max: 12000, amount: 1000, unit: 'g', currency: 'VND' },
    }),
    makeIngredient({
        id: 'ing-2',
        name: 'Stable stocked ingredient',
        shelfLife: 'medium',
        priceEstimate: { min: 20000, max: 24000, amount: 1000, unit: 'g', currency: 'VND' },
    }),
    makeIngredient({
        id: 'ing-4',
        name: 'Partial stocked ingredient',
        shelfLife: 'medium',
        priceEstimate: { min: 1000, max: 1200, amount: 100, unit: 'g', currency: 'VND' },
    }),
];

const inventoryItems: Record<string, IngredientInventory> = {
    'ing-1': inventoryBatch('batch-ing-1', 200, '2026-06-17T00:00:00.000Z'),
    'ing-2': inventoryBatch('batch-ing-2', 100, '2026-06-25T00:00:00.000Z'),
    'ing-4': inventoryBatch('batch-ing-4', 30),
};

const inventoryDishes = [
    makeDish({
        id: 'inventory-partial',
        name: 'Inventory partial',
        ingredients: [ingredient('ing-1'), ingredient('ing-4')],
        duration: { ...emptyDuration, prepare: 15, cooking: 20 },
        tags: ['budget'],
    }),
    makeDish({
        id: 'inventory-ready',
        name: 'Inventory ready',
        ingredients: [ingredient('ing-1'), ingredient('ing-2', '50')],
        duration: { ...emptyDuration, prepare: 10, cooking: 10 },
        tags: ['quick', 'family'],
    }),
    makeDish({
        id: 'inventory-side',
        name: 'Inventory side',
        ingredients: [ingredient('ing-1')],
        isAccompaniment: true,
    }),
];

// Real cook-now pipeline fixtures. baseServings defaults to 2 in getDishServingScale,
// so a profile servingCount of 4 yields scale 2 — required amounts double.
const cookNowGroupingIngredients = [
    makeIngredient({ id: 'ing-A', name: 'Abundant base ingredient' }),
    makeIngredient({ id: 'ing-B', name: 'Base-covered-only ingredient' }),
    makeIngredient({ id: 'ing-C', name: 'Single missing ingredient' }),
    makeIngredient({ id: 'ing-D', name: 'Missing ingredient D' }),
    makeIngredient({ id: 'ing-E', name: 'Missing ingredient E' }),
    makeIngredient({ id: 'ing-F', name: 'Missing ingredient F' }),
    makeIngredient({ id: 'ing-G', name: 'Missing ingredient G' }),
];

// ing-A (stock 250) covers the scaled requirement (100 * 2 = 200).
// ing-B (stock 120) covers only the unscaled base requirement (100), not the scaled one (200).
const cookNowGroupingInventory: Record<string, IngredientInventory> = {
    'ing-A': inventoryBatch('batch-ing-A', 250),
    'ing-B': inventoryBatch('batch-ing-B', 120),
};

const cookNowGroupingDishes = [
    makeDish({
        id: 'cooknow-base-ready',
        name: 'Base ready dish',
        ingredients: [ingredient('ing-A'), ingredient('ing-B')],
        duration: { ...emptyDuration, prepare: 10, cooking: 10 },
    }),
    makeDish({
        id: 'cooknow-near-ready',
        name: 'Near ready dish',
        ingredients: [ingredient('ing-A'), ingredient('ing-C')],
        duration: { ...emptyDuration, prepare: 10, cooking: 10 },
    }),
    makeDish({
        id: 'cooknow-many-missing',
        name: 'Many missing dish',
        ingredients: [
            ingredient('ing-A'),
            ingredient('ing-D'),
            ingredient('ing-E'),
            ingredient('ing-F'),
            ingredient('ing-G'),
        ],
        duration: { ...emptyDuration, prepare: 10, cooking: 10 },
    }),
];

describe('DishScorer', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-16T12:00:00.000Z'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

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
        it('pins readiness-based cook-now bucket rules, ordering, and empty-bucket filtering', () => {
            const groups = DishScorer.groupCookNow([
                makeScoredDish('ready-lower-score', 1, [], 0.7),
                makeScoredDish('ready-higher-score', 1, [], 0.9),
                makeScoredDish('near-two-missing', 0.6, ['ing-2', 'ing-3'], 0.52),
                makeScoredDish('near-one-missing', 0.4, ['ing-4'], 0.6),
                makeScoredDish('backup-three-missing-high-cooknow', 0.3, ['ing-5', 'ing-6', 'ing-7'], 0.6),
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
                { label: 'Cần mua thêm ít', minScore: 0.5, maxScore: 0.75, color: '#1677ff', dishIds: ['near-one-missing', 'near-two-missing'] },
                { label: 'Dự phòng', minScore: 0, maxScore: 0.5, color: '#fa8c16', dishIds: ['backup-three-missing-high-cooknow', 'fallback'] },
            ]);

            expect(DishScorer.groupCookNow([makeScoredDish('only-ready', 1, [], 0.8)]).map(group => group.label))
                .toEqual(['Nấu ngay']);
        });

        it('routes the real scoreCookNow pipeline into all three buckets when servingCount exceeds baseServings', () => {
            const profile = {
                ...DEFAULT_HOUSEHOLD_PREFERENCE_PROFILE,
                servingCount: 4,
                maxCookMinutes: 30,
            };

            const scored = DishScorer.scoreCookNow(
                cookNowGroupingDishes,
                cookNowGroupingInventory,
                cookNowGroupingDishes,
                cookNowGroupingIngredients,
                profile,
            );

            // Serving scaling (4 / baseServings 2 = 2x) inflates required amounts so the
            // fully-base-stocked dish is NOT zero-missing against scaled amounts.
            const baseReady = scored.find(item => item.dish.id === 'cooknow-base-ready');
            expect(baseReady?.missingIngredientIds.length).toBeGreaterThan(0);

            const groups = DishScorer.groupCookNow(scored);
            const labels = groups.map(group => group.label);

            expect(labels).toEqual(expect.arrayContaining(['Nấu ngay', 'Cần mua thêm ít', 'Dự phòng']));
            expect(labels).toHaveLength(3);

            const dishIdsByLabel = (label: string) =>
                groups.find(group => group.label === label)?.dishes.map(item => item.dish.id) ?? [];

            expect(dishIdsByLabel('Nấu ngay')).toContain('cooknow-base-ready');
            expect(dishIdsByLabel('Cần mua thêm ít')).toContain('cooknow-near-ready');
            expect(dishIdsByLabel('Dự phòng')).toContain('cooknow-many-missing');
        });
    });

    describe('scoreWithInventory', () => {
        it('pins inventory scoring, matched/missing/stocked IDs, and priority ordering', () => {
            const scored = DishScorer.scoreWithInventory(inventoryDishes, inventoryItems, inventoryDishes, inventoryIngredients);

            expect(scored.map(item => ({
                id: item.dish.id,
                score: item.score,
                matchedIngredientIds: item.matchedIngredientIds,
                missingIngredientIds: item.missingIngredientIds,
                stockedIngredientIds: item.stockedIngredientIds,
                partialIngredientIds: item.partialIngredientIds,
                urgentIngredients: item.urgentIngredients,
                extraShoppingCost: item.extraShoppingCost,
                missingPriceCount: item.missingPriceCount,
            }))).toEqual([
                {
                    id: 'inventory-ready',
                    score: 1,
                    matchedIngredientIds: ['ing-1', 'ing-2'],
                    missingIngredientIds: [],
                    stockedIngredientIds: ['ing-1', 'ing-2'],
                    partialIngredientIds: [],
                    urgentIngredients: [{ ingredientId: 'ing-1', daysLeft: 1 }],
                    extraShoppingCost: null,
                    missingPriceCount: 0,
                },
                {
                    id: 'inventory-partial',
                    score: 0.5,
                    matchedIngredientIds: ['ing-1'],
                    missingIngredientIds: ['ing-4'],
                    stockedIngredientIds: ['ing-1', 'ing-4'],
                    partialIngredientIds: ['ing-4'],
                    urgentIngredients: [{ ingredientId: 'ing-1', daysLeft: 1 }],
                    extraShoppingCost: { min: 700, max: 840, currency: 'VND' },
                    missingPriceCount: 0,
                },
            ]);
            expect(scored.some(item => item.dish.id === 'inventory-side')).toBe(false);
        });

        it('pins empty-inventory guard', () => {
            expect(DishScorer.scoreWithInventory(inventoryDishes, {}, inventoryDishes, inventoryIngredients)).toEqual([]);
        });
    });

    describe('scoreCookNow', () => {
        it('pins cook-now ordering and weighted scores against the current scorer output', () => {
            const profile = {
                ...DEFAULT_HOUSEHOLD_PREFERENCE_PROFILE,
                servingCount: 2,
                maxCookMinutes: 30,
                maxExtraCost: 5000,
                preferredTags: ['quick'],
                avoidedTags: ['heavy'],
            };

            const scored = DishScorer.scoreCookNow(inventoryDishes, inventoryItems, inventoryDishes, inventoryIngredients, profile);

            expect(scored.map(item => item.dish.id)).toEqual(['inventory-ready', 'inventory-partial']);
            scored.forEach(item => {
                expect(typeof item.cookNowScore).toBe('number');
                expect(item.cookNowScore).toBeGreaterThanOrEqual(0);
                expect(item.cookNowScore).toBeLessThanOrEqual(1);
            });
            expect(scored[0].cookNowScore).toBeCloseTo(1, 5);
            expect(scored[1].cookNowScore).toBeCloseTo(0.73829, 5);
            expect(scored.map(item => ({
                id: item.dish.id,
                totalMinutes: item.totalMinutes,
                preferenceMatchedTags: item.preferenceMatchedTags,
                preferenceAvoidedTags: item.preferenceAvoidedTags,
                householdMatches: item.householdMatches,
                householdWarnings: item.householdWarnings,
            }))).toEqual([
                {
                    id: 'inventory-ready',
                    totalMinutes: 20,
                    preferenceMatchedTags: ['quick'],
                    preferenceAvoidedTags: [],
                    householdMatches: ['Thích quick'],
                    householdWarnings: [],
                },
                {
                    id: 'inventory-partial',
                    totalMinutes: 35,
                    preferenceMatchedTags: [],
                    preferenceAvoidedTags: [],
                    householdMatches: [],
                    householdWarnings: [],
                },
            ]);
        });
    });
});
