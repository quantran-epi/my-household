jest.mock("nanoid", () => ({
    nanoid: () => "test-id",
}));

import reducer, { addIngredientGroupsToShoppingList } from "./ShoppingListReducer";
import type { ShoppingList } from "@store/Models/ShoppingList";

const makeList = (partial?: Partial<ShoppingList>): ShoppingList => ({
    id: "list-1",
    name: "Đi chợ",
    dishes: [],
    ingredients: [],
    scheduledMeals: [],
    createdDate: new Date("2026-06-18T00:00:00.000Z"),
    plannedDate: new Date("2026-06-18T00:00:00.000Z"),
    ...partial,
});

describe("ShoppingListReducer", () => {
    it("adds selected missing ingredient groups and skips duplicates", () => {
        const initialState = {
            shoppingLists: [makeList({
                ingredients: [{
                    id: "existing-gr",
                    ingredientId: "ing-1",
                    isDone: false,
                    amounts: [],
                }],
            })],
        };

        const nextState = reducer(initialState, addIngredientGroupsToShoppingList({
            shoppingListId: "list-1",
            dish: { id: "dish-1", name: "Canh chua", baseServings: 2 },
            targetServings: 3,
            ingredients: [
                { ingredientId: "ing-1", amount: "100", unit: "g" },
                { ingredientId: "ing-2", amount: "2", unit: "quả" },
            ],
        }));

        expect(nextState.shoppingLists[0].ingredients.map(group => group.ingredientId)).toEqual(["ing-1", "ing-2"]);
        expect(nextState.shoppingLists[0].ingredients[1].amounts[0]).toMatchObject({
            ingredientId: "ing-2",
            amount: "2",
            unit: "quả",
            dishesId: "dish-1",
            required: true,
            isDone: false,
            dish: {
                id: "dish-1",
                name: "Canh chua",
                baseServings: 2,
                targetServings: 3,
            },
        });
    });

    it("does not modify completed shopping lists", () => {
        const completedAt = new Date("2026-06-18T08:00:00.000Z");
        const initialState = {
            shoppingLists: [makeList({ completedAt })],
        };

        const nextState = reducer(initialState, addIngredientGroupsToShoppingList({
            shoppingListId: "list-1",
            dish: { id: "dish-1", name: "Canh chua" },
            ingredients: [{ ingredientId: "ing-2" }],
        }));

        expect(nextState.shoppingLists[0]).toEqual(initialState.shoppingLists[0]);
    });
});
