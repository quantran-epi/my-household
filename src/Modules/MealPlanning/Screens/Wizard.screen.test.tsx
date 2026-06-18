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
import WizardReducer, { advanceWizardStep, completeWizard } from "@store/Reducers/WizardReducer";
import AppContextReducer, { upsertHouseholdMemberProfile } from "@store/Reducers/AppContextReducer";
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
                appContext: AppContextReducer,
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

    it("renders the servings step and shows the back button after advancing", () => {
        const store = makeTestStore();
        store.dispatch(advanceWizardStep("servings"));
        renderWizard(store);

        expect(screen.getByTestId("wizard-step-servings")).toBeInTheDocument();
        expect(screen.getByTestId("wizard-back")).toBeInTheDocument();
    });

    it("renders household member choices on the servings step", () => {
        const store = makeTestStore();
        store.dispatch(upsertHouseholdMemberProfile({ id: "member-1", name: "Mẹ" }));
        store.dispatch(advanceWizardStep("servings"));
        renderWizard(store);

        expect(screen.getByTestId("wizard-member-member-1")).toBeInTheDocument();
        expect(screen.getByTestId("wizard-serving-minus")).toBeInTheDocument();
        expect(screen.getByTestId("wizard-serving-plus")).toBeInTheDocument();
    });

    it("renders the preferences step after advancing", () => {
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

    it("restarts a completed wizard at the ingredients step on re-entry", () => {
        const store = makeTestStore();
        store.dispatch(addDishes(makeDish()));
        store.dispatch(advanceWizardStep("result"));
        store.dispatch(completeWizard());
        renderWizard(store);

        expect(screen.getByTestId("wizard-step-ingredients")).toBeInTheDocument();
        expect(screen.queryByTestId("wizard-step-result")).not.toBeInTheDocument();
        expect(store.getState().personal.wizard.status).toBe("in_progress");
        expect(store.getState().personal.wizard.answers).toEqual(store.getState().personal.wizard.lastCompletedAnswers);
    });
});
