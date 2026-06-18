import { QuestionCircleOutlined, ShoppingCartOutlined, UndoOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { IngredientUnitHelper } from "@common/Helpers/IngredientUnitHelper";
import { AppCopy } from "@common/Copy";
import { Button } from "@components/Button";
import { Checkbox } from "@components/Form/Checkbox";
import { DatePicker } from "@components/Form/DatePicker";
import { Input } from "@components/Form/Input";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { useMessage } from "@components/Message";
import { Sheet, SheetActions } from "@components/Sheet";
import { Typography } from "@components/Typography";
import { DishScorer, ScoredDish } from "@modules/DishSuggester/Helpers/DishScorer";
import { nanoid } from "@reduxjs/toolkit";
import { RootRoutes } from "@routing/RootRoutes";
import { Dishes } from "@store/Models/Dishes";
import { Ingredient, IngredientUnit } from "@store/Models/Ingredient";
import { ScheduledMeal } from "@store/Models/ScheduledMeal";
import { ShoppingList } from "@store/Models/ShoppingList";
import { buildHouseholdPreferenceProfile } from "@store/Reducers/AppContextReducer";
import { addScheduledMeal } from "@store/Reducers/ScheduledMealReducer";
import { addIngredientGroupsToShoppingList, addShoppingList, editShoppingList } from "@store/Reducers/ShoppingListReducer";
import { completeWizard } from "@store/Reducers/WizardReducer";
import { selectDishes, selectHouseholdMembers, selectHouseholdPreferenceProfile, selectIngredients, selectInventory, selectInventoryHealthConfig, selectShoppingLists, selectWizardAnswers } from "@store/Selectors";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ACCENT_FULL = "#389e0d";
const ACCENT_PARTIAL = "#d48806";
const ACCENT_LOW = "#d46b08";

type ResultRowProps = {
    dish: Dishes;
    meta?: { matched: number; missing: number; accent: string; label: string };
    reason: string;
    missingCount?: number;
    addState?: MissingAddState;
    onShowReason: () => void;
    onOpenMissing?: () => void;
    onManageShopping?: () => void;
    onUndoShopping?: () => void;
    onAddToday: () => void;
    onPickDay: () => void;
};

type DetailTarget = {
    dish: Dishes;
    item?: ScoredDish;
    reason: string;
};

type MissingSheetTarget = {
    dish: Dishes;
    item: ScoredDish;
};

type MissingAddState = {
    dishId: string;
    shoppingListId: string;
    shoppingListName: string;
    addedIngredientIds: string[];
    skippedIngredientIds: string[];
};

type MissingIngredientRow = {
    ingredientId: string;
    name: string;
    amountLabel?: string;
    amount?: string;
    unit?: IngredientUnit;
    alreadyAdded: boolean;
};

const getDateValue = (date: Date | string | null | undefined): number => {
    const value = date ? new Date(date).valueOf() : 0;
    return Number.isFinite(value) ? value : 0;
};

const getLatestIncompleteShoppingList = (shoppingLists: ShoppingList[]): ShoppingList | undefined => {
    return shoppingLists
        .filter(item => !item.completedAt)
        .slice()
        .sort((a, b) => getDateValue(b.createdDate) - getDateValue(a.createdDate))[0];
};

const buildMissingRows = (item: ScoredDish, allIngredients: Ingredient[], shoppingList?: ShoppingList): MissingIngredientRow[] => {
    const ingredientById = new Map(allIngredients.map(ingredient => [ingredient.id, ingredient]));
    const existingIds = new Set((shoppingList?.ingredients ?? []).map(group => group.ingredientId));

    return item.missingIngredientIds.map(ingredientId => {
        const detail = item.ingredientDetails?.find(row => row.ingredientId === ingredientId);
        const amount = detail && detail.needToBuyAmount > 0
            ? IngredientUnitHelper.formatAmount(detail.needToBuyAmount)
            : undefined;
        return {
            ingredientId,
            name: ingredientById.get(ingredientId)?.name ?? ingredientId,
            amount,
            unit: detail?.unit,
            amountLabel: amount && detail?.unit ? `${amount} ${detail.unit}` : undefined,
            alreadyAdded: existingIds.has(ingredientId),
        };
    });
};

const ResultRow: React.FunctionComponent<ResultRowProps> = ({
    dish,
    meta,
    reason,
    missingCount = 0,
    addState,
    onShowReason,
    onOpenMissing,
    onManageShopping,
    onUndoShopping,
    onAddToday,
    onPickDay,
}) => {
    return <Box
        data-testid={`wizard-result-item-${dish.id}`}
        style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 12,
            borderLeft: meta ? `4px solid ${meta.accent}` : "4px solid #d9d9d9",
        }}
    >
        <Stack justify="space-between" align="center" fullwidth>
            <Typography.Title level={5} style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.25 }}>
                {dish.name}
            </Typography.Title>
            {meta && <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: meta.accent }}>
                {meta.label}
            </Typography.Text>}
        </Stack>
        {meta && <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
            {AppCopy.wizard.ingredientMatchSummary({ matched: meta.matched, missing: meta.missing })}
        </Typography.Text>}
        <Stack align="center" gap={6} fullwidth>
            <Typography.Text
                data-testid={`wizard-reason-${dish.id}`}
                type="secondary"
                style={{ flex: 1, minWidth: 0, fontSize: 15, lineHeight: 1.45, overflowWrap: "anywhere" }}
            >
                {reason}
            </Typography.Text>
            <Button
                type="text"
                shape="circle"
                aria-label={AppCopy.wizard.reasonDetailTitle}
                data-testid={`wizard-reason-detail-${dish.id}`}
                icon={<QuestionCircleOutlined />}
                onClick={onShowReason}
                style={{ width: 32, minWidth: 32, height: 32, color: "#7436dc" }}
            />
        </Stack>
        {addState && <Box style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8 }}>
            <Typography.Text style={{ fontSize: 14, lineHeight: 1.4, color: "#237804" }}>
                {addState.addedIngredientIds.length > 0
                    ? AppCopy.wizard.missingAddedInline({ count: addState.addedIngredientIds.length, listName: addState.shoppingListName })
                    : AppCopy.wizard.missingAlreadyInline({ listName: addState.shoppingListName })}
            </Typography.Text>
            <SheetActions>
                {addState.addedIngredientIds.length > 0 && <Button
                    size="large"
                    icon={<UndoOutlined />}
                    data-testid={`wizard-undo-shopping-${dish.id}`}
                    onClick={onUndoShopping}
                >
                    {AppCopy.wizard.missingUndoAction}
                </Button>}
                <Button
                    type="primary"
                    size="large"
                    icon={<UnorderedListOutlined />}
                    data-testid={`wizard-manage-shopping-${dish.id}`}
                    onClick={onManageShopping}
                >
                    {AppCopy.wizard.missingManageAction}
                </Button>
            </SheetActions>
        </Box>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", marginTop: 4 }}>
            <Button
                type="primary"
                size="large"
                data-testid={`wizard-add-today-${dish.id}`}
                onClick={onAddToday}
                style={{ flex: "1 1 0", minWidth: 0, minHeight: 44, height: "auto", borderRadius: 20, paddingInline: 12, whiteSpace: "normal", lineHeight: 1.2 }}
            >
                {AppCopy.wizard.addToToday}
            </Button>
            <Button
                size="large"
                onClick={onPickDay}
                style={{ flex: "1 1 0", minWidth: 0, minHeight: 44, height: "auto", borderRadius: 20, paddingInline: 12, whiteSpace: "normal", lineHeight: 1.2 }}
            >
                {AppCopy.wizard.pickOtherDay}
            </Button>
        </div>
        {missingCount > 0 && onOpenMissing && <Button
            size="large"
            icon={<ShoppingCartOutlined />}
            data-testid={`wizard-add-missing-${dish.id}`}
            onClick={onOpenMissing}
            style={{ width: "100%", minHeight: 44, height: "auto", borderRadius: 8, whiteSpace: "normal", lineHeight: 1.2 }}
        >
            {AppCopy.wizard.addMissingToShopping}
        </Button>}
    </Box>;
};

const scoredMeta = (item: ScoredDish): ResultRowProps["meta"] => {
    const isReady = item.missingIngredientIds.length === 0;
    const accent = isReady ? ACCENT_FULL : item.missingIngredientIds.length <= 3 ? ACCENT_PARTIAL : ACCENT_LOW;
    const matchPercent = Math.round(item.score * 100);
    const label = isReady
        ? AppCopy.wizard.availabilityReady
        : item.missingIngredientIds.length > 0
            ? AppCopy.wizard.availabilityMissing({ count: item.missingIngredientIds.length })
            : matchPercent >= 50 ? AppCopy.wizard.matchPartial : AppCopy.wizard.matchLow;
    return {
        matched: item.matchedIngredientIds.length,
        missing: item.missingIngredientIds.length,
        accent,
        label,
    };
};

const getReason = (item?: ScoredDish): string => {
    if (!item) return AppCopy.wizard.reasonFallback;
    if (item.missingIngredientIds.length === 0) return AppCopy.wizard.reasonReady;
    if (item.missingIngredientIds.length <= 3) return AppCopy.wizard.reasonFewMissing({ count: item.missingIngredientIds.length });
    const preferred = item.preferenceMatchedTags?.[0];
    if (preferred) return AppCopy.wizard.reasonPreference({ tag: preferred });
    if ((item.householdMatches?.length ?? 0) > 0) return AppCopy.wizard.reasonServing;
    return AppCopy.wizard.reasonFallback;
};

const limitGroups = (groups: Array<{ label?: string; color?: string; dishes: ScoredDish[] }>, limit: number) => {
    let remaining = limit;
    return groups
        .map(group => {
            const dishes = group.dishes.slice(0, remaining);
            remaining -= dishes.length;
            return { ...group, dishes };
        })
        .filter(group => group.dishes.length > 0);
};

export const WizardResult: React.FunctionComponent = () => {
    const dishes = useSelector(selectDishes);
    const ingredients = useSelector(selectIngredients);
    const inventory = useSelector(selectInventory);
    const inventoryConfig = useSelector(selectInventoryHealthConfig);
    const householdMembers = useSelector(selectHouseholdMembers);
    const householdProfile = useSelector(selectHouseholdPreferenceProfile);
    const shoppingLists = useSelector(selectShoppingLists);
    const answers = useSelector(selectWizardAnswers);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const message = useMessage();
    const ids = answers.selectedIngredientIds ?? [];
    const activeShoppingList = useMemo(() => getLatestIncompleteShoppingList(shoppingLists), [shoppingLists]);

    const [pickerDish, setPickerDish] = useState<Dishes | null>(null);
    const [pickedDate, setPickedDate] = useState<Dayjs>(dayjs());
    const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
    const [missingTarget, setMissingTarget] = useState<MissingSheetTarget | null>(null);
    const [selectedMissingIds, setSelectedMissingIds] = useState<string[]>([]);
    const [createShoppingListName, setCreateShoppingListName] = useState<string>(AppCopy.wizard.missingCreateListName);
    const [lastMissingAdd, setLastMissingAdd] = useState<MissingAddState | null>(null);
    const missingRows = useMemo(
        () => missingTarget ? buildMissingRows(missingTarget.item, ingredients, activeShoppingList) : [],
        [activeShoppingList, ingredients, missingTarget]
    );

    const addDishToDay = (dish: Dishes, day: Date, slot: keyof ScheduledMeal["meals"] = "dinner") => {
        const meal: ScheduledMeal = {
            id: nanoid(12),
            name: dish.name,
            plannedDate: day,
            meals: { breakfast: [], lunch: [], dinner: [], [slot]: [dish.id] },
            memberIds: [],
            dishServings: {},
            createdDate: new Date(),
        };
        dispatch(addScheduledMeal(meal));
        message.success(AppCopy.wizard.addedToTodayToast);
        dispatch(completeWizard());
    };

    const openDayPicker = (dish: Dishes) => {
        setPickedDate(dayjs());
        setPickerDish(dish);
    };

    const confirmPickedDay = () => {
        if (pickerDish) addDishToDay(pickerDish, pickedDate.toDate());
        setPickerDish(null);
    };

    const openMissingSheet = (dish: Dishes, item: ScoredDish) => {
        const rows = buildMissingRows(item, ingredients, activeShoppingList);
        setSelectedMissingIds(rows.filter(row => !row.alreadyAdded).map(row => row.ingredientId));
        setCreateShoppingListName(AppCopy.wizard.missingCreateListName);
        setMissingTarget({ dish, item });
    };

    const toggleMissingIngredient = (ingredientId: string, checked: boolean) => {
        setSelectedMissingIds(prev => {
            if (checked) return Array.from(new Set([...prev, ingredientId]));
            return prev.filter(id => id !== ingredientId);
        });
    };

    const confirmAddMissingIngredients = () => {
        if (!missingTarget) return;

        const targetList = getLatestIncompleteShoppingList(shoppingLists);
        const createdDate = new Date();
        const shoppingList = targetList ?? {
            id: `${(createShoppingListName.trim() || AppCopy.wizard.missingCreateListName)}${nanoid(10)}`,
            name: createShoppingListName.trim() || AppCopy.wizard.missingCreateListName,
            dishes: [],
            dishServings: {},
            ingredients: [],
            scheduledMeals: [],
            createdDate,
            plannedDate: createdDate,
            completedAt: undefined,
            completionImports: undefined,
        } as ShoppingList;
        const rows = buildMissingRows(missingTarget.item, ingredients, shoppingList);
        const selectedRows = rows.filter(row => selectedMissingIds.includes(row.ingredientId));
        const rowsToAdd = selectedRows.filter(row => !row.alreadyAdded);
        const skippedIds = rows.filter(row => row.alreadyAdded).map(row => row.ingredientId);

        if (!targetList) dispatch(addShoppingList(shoppingList));
        if (rowsToAdd.length > 0) {
            dispatch(addIngredientGroupsToShoppingList({
                shoppingListId: shoppingList.id,
                dish: {
                    id: missingTarget.dish.id,
                    name: missingTarget.dish.name,
                    baseServings: missingTarget.dish.baseServings,
                },
                ingredients: rowsToAdd.map(row => ({
                    ingredientId: row.ingredientId,
                    amount: row.amount,
                    unit: row.unit,
                })),
                targetServings: answers.servingCount,
            }));
        }

        setLastMissingAdd({
            dishId: missingTarget.dish.id,
            shoppingListId: shoppingList.id,
            shoppingListName: shoppingList.name,
            addedIngredientIds: rowsToAdd.map(row => row.ingredientId),
            skippedIngredientIds: skippedIds,
        });
        setMissingTarget(null);
        message.success(rowsToAdd.length > 0 ? AppCopy.wizard.missingAddedToast : AppCopy.wizard.missingNothingToAddToast);
    };

    const manageMissingShoppingList = (state: MissingAddState) => {
        navigate(RootRoutes.AuthorizedRoutes.ShoppingListRoutes.Detail(state.shoppingListId));
    };

    const undoMissingShoppingAdd = (state: MissingAddState) => {
        if (state.addedIngredientIds.length === 0) return;
        const currentList = shoppingLists.find(list => list.id === state.shoppingListId);
        if (!currentList || currentList.completedAt) return;
        const addedIds = new Set(state.addedIngredientIds);
        dispatch(editShoppingList({
            ...currentList,
            ingredients: currentList.ingredients.filter(group => {
                if (!addedIds.has(group.ingredientId)) return true;
                return !group.amounts.some(amount => amount.dishesId === state.dishId);
            }),
        }));
        setLastMissingAdd(null);
        message.success(AppCopy.wizard.missingUndoToast);
    };

    // (c) EMPTY CATALOG — never render a dish list; route to add the first dish.
    if (dishes.length === 0) {
        return <Box
            data-testid="wizard-empty-catalog"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: 24,
                textAlign: "center",
            }}
        >
            <Typography.Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {AppCopy.emptyStates.emptyCatalogTitle}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
                {AppCopy.emptyStates.emptyCatalogBody}
            </Typography.Text>
            <Button
                type="primary"
                onClick={() => navigate(RootRoutes.AuthorizedRoutes.DishesRoutes.List())}
                style={{ borderRadius: 20, paddingInline: 20 }}
            >
                {AppCopy.emptyStates.emptyCatalogCta}
            </Button>
        </Box>;
    }

    const selectedMembers = answers.memberIds && answers.memberIds.length > 0
        ? householdMembers.filter(member => answers.memberIds?.includes(member.id))
        : [];
    const wizardProfile = {
        ...buildHouseholdPreferenceProfile(householdProfile, selectedMembers),
        servingCount: answers.servingCount ?? householdProfile.servingCount,
        preferredTags: answers.preferredTags ?? householdProfile.preferredTags,
        avoidedTags: answers.avoidedTags ?? householdProfile.avoidedTags,
    };
    const hasInventorySignal = Object.keys(inventory).length > 0;
    const cookNowEnabled = answers.cookNowOnly === true;
    const cookNowScored = cookNowEnabled && hasInventorySignal
        ? DishScorer.scoreCookNow(dishes, inventory, dishes, ingredients, wizardProfile, inventoryConfig)
        : [];
    const standardScored = DishScorer.score(dishes, ids, dishes);
    const scored = cookNowScored.length > 0 ? cookNowScored : standardScored;
    const hasMatches = scored.length > 0;
    const displayGroups = cookNowScored.length > 0
        ? limitGroups(DishScorer.groupCookNow(cookNowScored), 5)
        : limitGroups([{ dishes: scored }], 5);

    const renderDetailList = (title: string, values: string[]) => values.length > 0 ? (
        <Box style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: "#595959" }}>{title}</Typography.Text>
            <Typography.Text style={{ fontSize: 16, lineHeight: 1.5 }}>{values.join(", ")}</Typography.Text>
        </Box>
    ) : null;

    const detailIngredientNames = (ingredientIds: string[]) => ingredientIds
        .map(id => ingredients.find(ingredient => ingredient.id === id)?.name)
        .filter((name): name is string => Boolean(name));
    const selectedMissingCount = missingRows.filter(row => selectedMissingIds.includes(row.ingredientId) && !row.alreadyAdded).length;

    return <Box
        data-testid="wizard-step-result"
        style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}
    >
        {cookNowEnabled && !hasInventorySignal && <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
            {AppCopy.wizard.cookNowWeakSignal}
        </Typography.Text>}

        {hasMatches
            ? displayGroups.map(group => (
                <Stack key={group.label ?? "matches"} direction="column" gap={8} fullwidth align="stretch">
                    {group.label && <Typography.Text style={{ fontSize: 13, fontWeight: 700, color: group.color ?? "#595959", textTransform: "uppercase" }}>
                        {group.label}
                    </Typography.Text>}
                    {group.dishes.map(item => {
                        const reason = getReason(item);
                        const addState = lastMissingAdd?.dishId === item.dish.id ? lastMissingAdd : undefined;
                        return (
                            <ResultRow
                                key={item.dish.id}
                                dish={item.dish}
                                meta={scoredMeta(item)}
                                reason={reason}
                                missingCount={item.missingIngredientIds.length}
                                addState={addState}
                                onShowReason={() => setDetailTarget({ dish: item.dish, item, reason })}
                                onOpenMissing={() => openMissingSheet(item.dish, item)}
                                onManageShopping={addState ? () => manageMissingShoppingList(addState) : undefined}
                                onUndoShopping={addState ? () => undoMissingShoppingAdd(addState) : undefined}
                                onAddToday={() => addDishToDay(item.dish, new Date())}
                                onPickDay={() => openDayPicker(item.dish)}
                            />
                        );
                    })}
                </Stack>
            ))
            // (b) FULL-CATALOG FALLBACK — friendly suggestion, neutral tone, never a red error.
            : <>
                <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
                    {AppCopy.wizard.fullCatalogFallback}
                </Typography.Text>
                {dishes.slice(0, 5).map(dish => (
                    <ResultRow
                        key={dish.id}
                        dish={dish}
                        reason={AppCopy.wizard.reasonFallback}
                        onShowReason={() => setDetailTarget({ dish, reason: AppCopy.wizard.reasonFallback })}
                        onAddToday={() => addDishToDay(dish, new Date())}
                        onPickDay={() => openDayPicker(dish)}
                    />
                ))}
            </>}

        <Button
            type="primary"
            size="large"
            data-testid="wizard-finish"
            onClick={() => {
                dispatch(completeWizard());
                navigate(RootRoutes.AuthorizedRoutes.Root());
            }}
            style={{ width: "100%", borderRadius: 20, paddingInline: 20 }}
        >
            {AppCopy.wizard.finishAction}
        </Button>

        <Sheet
            open={pickerDish !== null}
            title={AppCopy.wizard.daySheetTitle}
            onClose={() => setPickerDish(null)}
            data-testid="wizard-day-sheet"
        >
            <Stack direction="column" gap={16} fullwidth align="stretch" style={{ padding: 16 }}>
                <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={pickedDate}
                    allowClear={false}
                    onChange={(value: Dayjs | null) => { if (value) setPickedDate(value); }}
                />
                <SheetActions>
                    <Button
                        type="primary"
                        size="large"
                        onClick={confirmPickedDay}
                        style={{ borderRadius: 20, paddingInline: 20 }}
                    >
                        {AppCopy.wizard.addToDay}
                    </Button>
                </SheetActions>
            </Stack>
        </Sheet>

        <Sheet
            open={missingTarget !== null}
            title={AppCopy.wizard.missingSheetTitle}
            onClose={() => setMissingTarget(null)}
            data-testid="wizard-missing-sheet"
        >
            <Stack direction="column" gap={16} fullwidth align="stretch" style={{ padding: 16 }}>
                <Box style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Typography.Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.3 }}>
                        {missingTarget?.dish.name}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 15, lineHeight: 1.45 }}>
                        {AppCopy.wizard.missingSheetIntro}
                    </Typography.Text>
                </Box>

                {activeShoppingList ? <Typography.Text style={{ fontSize: 15, fontWeight: 600 }}>
                    {AppCopy.wizard.missingTargetList({ name: activeShoppingList.name })}
                </Typography.Text> : <Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 15, lineHeight: 1.45 }}>
                        {AppCopy.wizard.missingNoActiveList}
                    </Typography.Text>
                    <Input
                        value={createShoppingListName}
                        placeholder={AppCopy.wizard.missingCreateListPlaceholder}
                        onChange={event => setCreateShoppingListName(event.target.value)}
                    />
                </Box>}

                <Stack direction="column" gap={8} fullwidth align="stretch">
                    {missingRows.map(row => {
                        const checked = row.alreadyAdded || selectedMissingIds.includes(row.ingredientId);
                        return <Box
                            key={row.ingredientId}
                            data-testid={`wizard-missing-row-${row.ingredientId}`}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                width: "100%",
                                padding: "10px 0",
                                borderBottom: "1px solid #f0f0f0",
                            }}
                        >
                            <Checkbox
                                checked={checked}
                                disabled={row.alreadyAdded}
                                onChange={event => toggleMissingIngredient(row.ingredientId, event.target.checked)}
                                style={{ marginTop: 2 }}
                            />
                            <Box style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                                <Typography.Text style={{ fontSize: 16, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                                    {row.name}
                                </Typography.Text>
                                {row.amountLabel && <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.35 }}>
                                    {row.amountLabel}
                                </Typography.Text>}
                                {row.alreadyAdded && <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.35 }}>
                                    {AppCopy.wizard.missingAlreadyAdded}
                                </Typography.Text>}
                            </Box>
                        </Box>;
                    })}
                </Stack>

                <SheetActions>
                    <Button size="large" onClick={() => setMissingTarget(null)}>
                        {AppCopy.common.cancel}
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        disabled={selectedMissingCount === 0}
                        onClick={confirmAddMissingIngredients}
                    >
                        {activeShoppingList ? AppCopy.wizard.missingAddAction : AppCopy.wizard.missingCreateAndAddAction}
                    </Button>
                </SheetActions>
            </Stack>
        </Sheet>

        <Sheet
            open={detailTarget !== null}
            title={AppCopy.wizard.reasonDetailTitle}
            onClose={() => setDetailTarget(null)}
            data-testid="wizard-reason-detail-sheet"
        >
            <Stack direction="column" gap={16} fullwidth align="stretch" style={{ padding: 16 }}>
                <Typography.Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    {detailTarget?.dish.name}
                </Typography.Title>
                <Typography.Text style={{ fontSize: 16, lineHeight: 1.5 }}>
                    {detailTarget?.reason}
                </Typography.Text>
                {renderDetailList(AppCopy.wizard.reasonDetailMatched, detailIngredientNames(detailTarget?.item?.matchedIngredientIds ?? []))}
                {renderDetailList(AppCopy.wizard.reasonDetailMissing, detailIngredientNames(detailTarget?.item?.missingIngredientIds ?? []))}
                {renderDetailList(AppCopy.wizard.reasonDetailPreferenceMatch, detailTarget?.item?.preferenceMatchedTags ?? [])}
                {renderDetailList(AppCopy.wizard.reasonDetailPreferenceAvoid, detailTarget?.item?.preferenceAvoidedTags ?? [])}
                {renderDetailList(AppCopy.wizard.reasonDetailHousehold, [
                    ...(detailTarget?.item?.householdMatches ?? []),
                    ...(detailTarget?.item?.householdWarnings ?? []),
                ])}
                <SheetActions>
                    <Button size="large" type="primary" onClick={() => setDetailTarget(null)}>
                        {AppCopy.common.cancel}
                    </Button>
                </SheetActions>
            </Stack>
        </Sheet>
    </Box>;
};
