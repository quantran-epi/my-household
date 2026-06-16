// Three personal reducers (cookingSession/householdHealth/shoppingList) transitively
// import the ESM-only `nanoid`, which Jest's transformIgnorePatterns won't transpile.
// Mock it the same way App.test.tsx does so the real store nesting can load.
jest.mock("nanoid", () => ({
    nanoid: () => "test-id",
}));

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import IngredientReducer from "@store/Reducers/IngredientReducer";
import DishesReducer, { addDishes } from "@store/Reducers/DishesReducer";
import WizardReducer, { advanceWizardStep } from "@store/Reducers/WizardReducer";
import type { Dishes } from "@store/Models/Dishes";
import { WizardScreen } from "@modules/MealPlanning/Screens/Wizard.screen";

// Minimal dish so the result step renders its canonical `wizard-step-result`
// branch rather than the empty-catalog route (an empty catalog has its own testid).
const makeDish = (): Dishes => ({
    id: "dish-1",
    name: "Canh chua",
    ingredients: [],
    note: "",
    includeDishes: [],
    steps: [],
    isCompleted: true,
    duration: {} as Dishes["duration"],
    tags: [],
});

// Mirror the production rootReducer nesting (shared/personal) WITHOUT redux-persist.
// Only the slices the rendered tree actually reads are wired: shared.ingredient
// (IngredientPicker), shared.dishes (preference/result steps), personal.wizard
// (step machine). The omitted slices (shoppingList/householdHealth/cookingSession)
// transitively import the ESM-only `nanoid`, which Jest's transformIgnorePatterns
// won't transpile — and the wizard tree never reads them. The selectors use optional
// chaining for personal.*, so the trimmed personal slice resolves cleanly.
const makeTestStore = () =>
    configureStore({
        reducer: combineReducers({
            shared: combineReducers({
                ingredient: IngredientReducer,
                dishes: DishesReducer,
            }),
            personal: combineReducers({
                wizard: WizardReducer,
            }),
        }),
        middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    });

const renderWizard = (store: ReturnType<typeof makeTestStore>) =>
    render(
        <Provider store={store}>
            <MemoryRouter>
                <WizardScreen />
            </MemoryRouter>
        </Provider>
    );

describe("WizardScreen", () => {
    it("renders the ingredients step with no back button in the default (first-step) state", () => {
        const store = makeTestStore();
        renderWizard(store);

        expect(screen.getByTestId("wizard-step-ingredients")).toBeInTheDocument();
        expect(screen.queryByTestId("wizard-back")).not.toBeInTheDocument();
    });

    it("renders the preferences step and shows the back button after advancing", () => {
        const store = makeTestStore();
        store.dispatch(advanceWizardStep("preferences"));
        renderWizard(store);

        expect(screen.getByTestId("wizard-step-preferences")).toBeInTheDocument();
        expect(screen.getByTestId("wizard-back")).toBeInTheDocument();
    });

    it("renders the result step after advancing to result", () => {
        const store = makeTestStore();
        store.dispatch(addDishes(makeDish()));
        store.dispatch(advanceWizardStep("result"));
        renderWizard(store);

        expect(screen.getByTestId("wizard-step-result")).toBeInTheDocument();
    });
});
