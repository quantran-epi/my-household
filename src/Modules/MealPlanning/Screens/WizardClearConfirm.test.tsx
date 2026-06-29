// Three personal reducers transitively import the ESM-only `nanoid`; mock it.
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import IngredientReducer from "@store/Reducers/IngredientReducer";
import DishesReducer from "@store/Reducers/DishesReducer";
import WizardReducer, { advanceWizardStep, completeWizard } from "@store/Reducers/WizardReducer";
import AppContextReducer from "@store/Reducers/AppContextReducer";
import InventoryReducer from "@store/Reducers/InventoryReducer";
import SharedConfigReducer from "@store/Reducers/SharedConfigReducer";
import ShoppingListReducer from "@store/Reducers/ShoppingListReducer";
import { WizardScreen } from "@modules/MealPlanning/Screens/Wizard.screen";
import { ModalProvider } from "@components/Modal/ModalProvider";
import { MessageProvider } from "@components/Message";

const makeTestStore = () =>
    configureStore({
        reducer: combineReducers({
            shared: combineReducers({
                ingredient: IngredientReducer,
                dishes: DishesReducer,
                config: SharedConfigReducer,
            }),
            personal: combineReducers({
                appContext: AppContextReducer,
                inventory: InventoryReducer,
                shoppingList: ShoppingListReducer,
                wizard: WizardReducer,
            }),
        }),
        middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    });

const renderWizard = (store) =>
    render(
        <MessageProvider>
            <ModalProvider>
                <Provider store={store}>
                    <MemoryRouter>
                        <WizardScreen />
                    </MemoryRouter>
                </Provider>
            </ModalProvider>
        </MessageProvider>,
    );

// Regression: antd v5 hook-confirm leaves the dialog stuck open when onOk
// dispatches a Redux action synchronously. The clear-defaults confirm uses an
// async onOk so antd closes the modal after the dispatch settles.
describe("WizardScreen clear-defaults confirm", () => {
    it("clears defaults AND closes the confirm modal after confirming", async () => {
        const store = makeTestStore();
        store.dispatch(advanceWizardStep("result"));
        store.dispatch(completeWizard());
        renderWizard(store);

        fireEvent.click(await screen.findByTestId("wizard-clear-defaults"));

        await waitFor(() => expect(document.querySelector(".ant-modal-confirm")).toBeInTheDocument());
        const confirmOk = screen.getAllByRole("button").find(b => b.textContent === "Xóa lựa chọn đã nhớ" && b.closest(".ant-modal-confirm"));
        fireEvent.click(confirmOk as HTMLElement);

        await waitFor(() => expect(store.getState().personal.wizard.lastCompletedAnswers).toBeUndefined());
        await waitFor(() => expect(document.querySelector(".ant-modal-confirm")).not.toBeInTheDocument());
    });
});
