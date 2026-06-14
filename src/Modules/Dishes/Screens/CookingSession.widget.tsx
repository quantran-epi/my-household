import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, CloseCircleOutlined, ShoppingCartOutlined, PlayCircleOutlined, PlusOutlined, BellOutlined, NotificationOutlined } from "@ant-design/icons";
import { DishDurationHelper } from "@common/Helpers/DishDurationHelper";
import { DishServingHelper } from '@common/Helpers/DishServingHelper';
import { InventoryHelper } from "@common/Helpers/InventoryHelper";
import { IngredientUnitHelper } from "@common/Helpers/IngredientUnitHelper";
import { ActionButton, Button } from "@components/Button";
import { Image } from "@components/Image";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { DeferredModalContent, Modal } from "@components/Modal";
import { NumberStepper } from "@components/Form/NumberStepper";
import { ServingSizeInput } from "@components/Form/ServingSizeInput";
import { Popconfirm } from "@components/Popconfirm";
import { useMessage } from "@components/Message";
import { Tag } from "@components/Tag";
import { Typography } from "@components/Typography";
import { useToggle } from "@hooks";
import { ShoppingListAddWidget } from "@modules/ShoppingList/Screens/ShoppingListAdd.widget";
import { RootRoutes } from "@routing/RootRoutes";
import { Dishes, DishesStep } from "@store/Models/Dishes";
import { Ingredient } from "@store/Models/Ingredient";
import { CookingSession, CookingSessionIngredientStatus } from "@store/Models/CookingSession";
import {
    cancelCooking,
    setCookingIngredientStatus,
    setStepCooking,
    setTargetServingsCooking,
    startCooking,
    toggleCookingStepComplete,
} from "@store/Reducers/CookingSessionReducer";
import { setInventory } from "@store/Reducers/InventoryReducer";
import { nanoid } from "nanoid";
import { useCookingTimer } from "./useCookingTimer";
import { useStepTimer } from "./useStepTimer";
import { CookingTimerCard } from "./CookingTimerCard.widget";
import { StepTimerCard } from "./StepTimerCard.widget";
import {
    selectCookingSessions,
    selectCookTimeStats,
    selectDishes,
    selectDishesById,
    selectIngredientsById,
    selectInventory,
    selectInventoryHealthConfig,
    selectSelectedHouseholdMembers,
} from "@store/Selectors";
import { Alert, Progress, Space, Switch, Tooltip } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ShoppingListIcon from "../../../../assets/icons/shoppingList.png";
import StepsIcon from "../../../../assets/icons/process.png";
import { FinishCookingWidget } from "./FinishCooking.widget";
import { HouseholdMemberPicker } from "@modules/ScheduledMeal/Components/HouseholdMemberPicker";

type CookingIngredientRow = {
    ingredient: Ingredient;
    required: number;
    unit: string;
    inStock: number;
    lacking: number;
    sufficient: boolean;
    prepare: string[];
}

type CookingSessionWidgetProps = {
    dish: Dishes;
    onDone: () => void;
}

const COOKING_NESTED_MODAL_Z_INDEX = 4400;

const collectAllSteps = (
    dish: Dishes,
    dishesById: Map<string, Dishes>,
    visited = new Set<string>()
): string[] => {
    if (visited.has(dish.id)) return [];
    visited.add(dish.id);
    const fromIncluded = (dish.includeDishes ?? []).flatMap(id => {
        const d = dishesById.get(id);
        return d ? collectAllSteps(d, dishesById, visited) : [];
    });
    return [...fromIncluded, ...(dish.steps ?? []).map(s => s.content)];
};

// Same shape as collectAllSteps but keeps the full DishesStep so phase + timer fields survive into
// the cooking session view. Steps are listed by `order` per-dish; included dishes come first to
// match collectAllSteps' ordering.
const collectAllStepObjects = (
    dish: Dishes,
    dishesById: Map<string, Dishes>,
    visited = new Set<string>()
): DishesStep[] => {
    if (visited.has(dish.id)) return [];
    visited.add(dish.id);
    const fromIncluded = (dish.includeDishes ?? []).flatMap(id => {
        const d = dishesById.get(id);
        return d ? collectAllStepObjects(d, dishesById, visited) : [];
    });
    const ownSorted = [...(dish.steps ?? [])].sort((a, b) => a.order - b.order);
    return [...fromIncluded, ...ownSorted];
};

const getSessionIngredientStatus = (session: CookingSession | undefined, ingredientId: string): CookingSessionIngredientStatus => {
    return session?.ingredients?.find(item => item.ingredientId === ingredientId)?.status ?? "needed";
};

export const CookingSessionWidget: React.FunctionComponent<CookingSessionWidgetProps> = ({ dish, onDone }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const message = useMessage();
    const allDishes = useSelector(selectDishes);
    const dishesById = useSelector(selectDishesById);
    const ingredientsById = useSelector(selectIngredientsById);
    const inventoryItems = useSelector(selectInventory);
    const inventoryConfig = useSelector(selectInventoryHealthConfig);
    const sessions = useSelector(selectCookingSessions);
    const cookTimeStats = useSelector(selectCookTimeStats);
    const selectedHouseholdMembers = useSelector(selectSelectedHouseholdMembers);
    const toggleShoppingList = useToggle();
    const [phase, setPhase] = useState<"prep" | "cooking">("prep");
    const [showFinish, setShowFinish] = useState(false);
    // Quick-add target: the ingredient row the user is topping up inline (e.g. "someone gave me 200g").
    const [quickAddRow, setQuickAddRow] = useState<CookingIngredientRow | null>(null);
    const [quickAddAmount, setQuickAddAmount] = useState<number>(0);
    // Tracks the session id whose audio we've already unlocked, so the scheduled-path fallback
    // (below) fires at most once per session and never double-unlocks the direct path where
    // _onStartCooking already unlocked within the start tap.
    const audioUnlockedSessionIdRef = useRef<string | null>(null);
    const baseServings = DishServingHelper.getBaseServings(dish);
    const [targetServings, setTargetServings] = useState<number>(() => baseServings);
    const [cookMemberIds, setCookMemberIds] = useState<string[]>(() => selectedHouseholdMembers.map(m => m.id));

    useEffect(() => {
        setTargetServings(baseServings);
        setPhase("prep");
        setShowFinish(false);
        setCookMemberIds(selectedHouseholdMembers.map(m => m.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dish.id, baseServings]);

    const activeSession = sessions.find(s => s.dishId === dish.id && s.status === "cooking");
    const session = activeSession;
    const activeTargetServings = session?.targetServings ?? targetServings;
    const steps = useMemo(() => collectAllSteps(dish, dishesById), [dish, dishesById]);
    const stepObjects = useMemo(() => collectAllStepObjects(dish, dishesById), [dish, dishesById]);
    const sessionSteps = session?.steps ?? [];
    const totalSteps = sessionSteps.length;
    const currentIndex = Math.min(session?.currentStepIndex ?? 0, Math.max(0, totalSteps - 1));
    const completedStepSet = useMemo(() => new Set(session?.completedStepIndexes ?? []), [session?.completedStepIndexes]);
    const timerView = useCookingTimer(session);
    const currentStepObject = stepObjects[currentIndex];
    const stepTimer = useStepTimer(session, dish.name, currentStepObject);

    // Auto-start a step's timer when the user advances to it. We only start once per step (the
    // hook tracks the last started key) so reopening or pausing/resuming doesn't restart.
    useEffect(() => {
        if (!session) return;
        if (!currentStepObject) return;
        if (!currentStepObject.timerMinutes || currentStepObject.timerMinutes < 1) return;
        if (completedStepSet.has(currentIndex)) return;
        stepTimer.autoStartFor(currentStepObject, currentIndex);
    }, [session, currentStepObject, currentIndex, completedStepSet, stepTimer]);

    // When the user changes step, hide a stale done/dismissed timer card so the next step starts clean.
    useEffect(() => {
        if (!session) return;
        const active = session.activeStepTimer;
        if (active && active.stepIndex !== currentIndex && (active.status === "done" || active.status === "dismissed")) {
            stepTimer.clear();
        }
    }, [session, currentIndex, stepTimer]);

    // Scheduled-meal path fallback: there, ScheduledMealCookingModal dispatches startCooking (with
    // timer phases) BEFORE this widget mounts, so the widget enters the cooking view via the
    // activeSession branch and _onStartCooking — the only place that calls timerView.unlockAudio()
    // within the start tap — never runs. Without unlocking, the AudioContext stays suspended and the
    // phase-expiry alarm is silent. We unlock here once per session as a fallback. On the direct path
    // _onStartCooking already unlocked (phase === "cooking" and the ref is set there), so this no-ops.
    useEffect(() => {
        if (phase === "cooking") return;            // direct path already unlocked in the start tap
        if (!session || !timerView.hasTimer) return; // nothing to ring for
        if (audioUnlockedSessionIdRef.current === session.id) return; // already unlocked this session
        audioUnlockedSessionIdRef.current = session.id;
        timerView.unlockAudio();
    }, [phase, session, timerView]);

    const rows = useMemo<CookingIngredientRow[]>(() => {
        const amounts = DishServingHelper.collectIngredientAmounts(dish, allDishes, { targetServings: activeTargetServings });
        const grouped: Record<string, { total: number; unit: string; prepare: string[] }> = {};
        amounts.forEach(amt => {
            const ingredient = ingredientsById.get(amt.ingredientId);
            const baseUnit = IngredientUnitHelper.getBaseUnit(ingredient, [amt.unit]);
            const val = IngredientUnitHelper.toBaseAmount(ingredient, amt.amount, amt.unit, baseUnit) ?? IngredientUnitHelper.parseAmount(amt.amount);
            if (!grouped[amt.ingredientId]) grouped[amt.ingredientId] = { total: 0, unit: baseUnit, prepare: [] };
            grouped[amt.ingredientId].total += val;
            grouped[amt.ingredientId].prepare = Array.from(new Set([...grouped[amt.ingredientId].prepare, ...(amt.prepare ?? [])]));
        });
        return Object.entries(grouped).map(([ingredientId, { total, unit, prepare }]) => {
            const ingredient = ingredientsById.get(ingredientId);
            if (!ingredient) return null;
            const inv = inventoryItems[ingredientId];
            const required = InventoryHelper.roundAmount(total);
            const inStock = InventoryHelper.availableAmount(inv, ingredient, required, inventoryConfig);
            const lacking = InventoryHelper.roundAmount(Math.max(0, required - inStock));
            return { ingredient, required, unit, inStock, lacking, sufficient: inStock >= required, prepare } as CookingIngredientRow;
        }).filter(Boolean) as CookingIngredientRow[];
    }, [dish, allDishes, ingredientsById, inventoryItems, inventoryConfig, activeTargetServings]);

    const lackingIngredientIds = rows.filter(r => !r.sufficient).map(r => r.ingredient.id);
    const allSufficient = rows.every(r => r.sufficient);
    const plannedTotalMinutes = DishDurationHelper.getTotalMinutesForDish(dish, dishesById);
    const durationText = DishDurationHelper.formatMinutes(plannedTotalMinutes);
    // Learned-time hint: surface what the user actually tends to take, once we have a recorded cook.
    const cookTimeStat = cookTimeStats[dish.id];
    const learnedHint = useMemo(() => {
        if (!cookTimeStat || cookTimeStat.samples < 1) return null;
        if (cookTimeStat.samples === 1) {
            return { text: `Lần gần nhất ${cookTimeStat.lastTotalMinutes} phút`, diverges: false };
        }
        const diverges = plannedTotalMinutes > 0 && Math.abs(cookTimeStat.avgTotalMinutes - plannedTotalMinutes) / plannedTotalMinutes > 0.25;
        return { text: `Bạn thường nấu ~${cookTimeStat.avgTotalMinutes} phút (${cookTimeStat.samples} lần)`, diverges };
    }, [cookTimeStat, plannedTotalMinutes]);

    const _onStartCooking = () => {
        // The live timer uses the top-level dish's own active duration phases (included-dish
        // durations are intentionally not aggregated into the timeline — see plan §8).
        const timerPhases = DishDurationHelper.getActiveItems(dish.duration)
            .map(item => ({ phaseKey: item.phase.key, plannedMinutes: item.minutes }));
        dispatch(startCooking({
            dishId: dish.id,
            dishName: dish.name,
            baseServings,
            targetServings,
            steps,
            ingredientIds: rows.map(row => row.ingredient.id),
            householdMemberIds: cookMemberIds,
            timerPhases,
        }));
        // Unlock audio within this tap so the first phase's expiry chime can play (autoplay policy).
        if (timerPhases.length > 0) timerView.unlockAudio();
        setPhase("cooking");
    };

    const _openQuickAdd = (row: CookingIngredientRow) => {
        setQuickAddRow(row);
        setQuickAddAmount(row.lacking > 0 ? row.lacking : 0);
    };

    const _closeQuickAdd = () => {
        setQuickAddRow(null);
        setQuickAddAmount(0);
    };

    // Inline top-up: append the entered amount as a new batch to the ingredient's inventory, in the
    // row's base unit (purchased today). Lets the user log "someone gave me 200g of beef" without
    // leaving the prep step, so the coverage check can pass immediately.
    const _onQuickAddInventory = () => {
        if (!quickAddRow || quickAddAmount <= 0) return;
        const ingredientId = quickAddRow.ingredient.id;
        const existing = inventoryItems[ingredientId];
        const baseUnit = IngredientUnitHelper.getBaseUnit(quickAddRow.ingredient, [quickAddRow.unit as any]);
        const priorBatches = existing?.batches ?? [];
        dispatch(setInventory({
            ingredientId,
            inventory: {
                unit: existing?.unit ?? baseUnit,
                lastUpdated: new Date(),
                discardedBatches: existing?.discardedBatches ?? [],
                batches: [
                    ...priorBatches,
                    {
                        id: nanoid(),
                        amount: quickAddAmount,
                        unit: baseUnit as any,
                        purchasedAt: new Date().toISOString(),
                    },
                ],
            },
        }));
        message.success(`Đã thêm ${IngredientUnitHelper.formatAmount(quickAddAmount)}${quickAddRow.unit} ${quickAddRow.ingredient.name} vào kho`);
        _closeQuickAdd();
    };

    const _onSessionServingChange = (value: number) => {
        if (!session) return;
        dispatch(setTargetServingsCooking({ sessionId: session.id, targetServings: DishServingHelper.normalizeTargetServings(value, baseServings) }));
    };

    const _onCancelCooking = () => {
        if (!session) return;
        dispatch(cancelCooking(session.id));
        message.success("Đã hủy phiên nấu");
        onDone();
    };

    const _onIngredientStatusChange = (ingredientId: string, status: CookingSessionIngredientStatus) => {
        if (!session) return;
        dispatch(setCookingIngredientStatus({ sessionId: session.id, ingredientId, status }));
    };

    const _formatInventoryAmount = (value: number, unit: string) => `${IngredientUnitHelper.formatAmount(value)}${unit}`;

    // Stock state as a short text line (color + label) shown under the ingredient name — no tags.
    const _inventoryStatusText = (row: CookingIngredientRow): { color: string; label: string } => {
        if (row.ingredient.alwaysAvailable) return { color: "#389e0d", label: "Luôn có sẵn" };
        if (row.sufficient) return { color: "#389e0d", label: `Đủ trong kho (${_formatInventoryAmount(row.inStock, row.unit)})` };
        if (row.inStock > 0) return { color: "#cf1322", label: `Còn ${_formatInventoryAmount(row.inStock, row.unit)}, thiếu ${_formatInventoryAmount(row.lacking, row.unit)}` };
        return { color: "#cf1322", label: "Chưa có trong kho" };
    };

    const _onNext = () => {
        if (!session) return;
        if (currentIndex < totalSteps - 1) dispatch(setStepCooking({ sessionId: session.id, stepIndex: currentIndex + 1 }));
    };

    const _onPrev = () => {
        if (!session) return;
        if (currentIndex > 0) dispatch(setStepCooking({ sessionId: session.id, stepIndex: currentIndex - 1 }));
    };

    const IngredientChecklist = ({ interactive }: { interactive: boolean }) => <Box style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.length === 0 && <Typography.Text type="secondary">Món này chưa có nguyên liệu.</Typography.Text>}
        {rows.map(row => {
            const status = getSessionIngredientStatus(session, row.ingredient.id);
            const disableUsedToggle = interactive && !row.sufficient && status !== "used";
            const statusText = _inventoryStatusText(row);
            const canQuickAdd = !row.sufficient && !row.ingredient.alwaysAvailable;
            return <div key={row.ingredient.id} data-testid={`cooking-ingredient-${row.ingredient.id}`} style={{
                display: 'grid',
                gridTemplateColumns: interactive ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: 8,
                padding: '7px 0',
                borderBottom: '1px solid rgba(5,5,5,0.04)'
            }}>
                <Box style={{ minWidth: 0 }}>
                    <Typography.Text style={{ display: "block", lineHeight: "18px", overflowWrap: "anywhere" }}>{row.ingredient.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "16px" }}>
                        Cần {IngredientUnitHelper.formatAmount(row.required)}{row.unit}
                        {row.prepare.length > 0 ? ` · ${row.prepare.slice(0, 2).join(", ")}` : ""}
                    </Typography.Text>
                    <Typography.Text data-testid={`cooking-ingredient-availability-${row.ingredient.id}`} style={{ display: "block", fontSize: 12, lineHeight: "16px", color: statusText.color }}>
                        {statusText.label}
                    </Typography.Text>
                </Box>
                <Stack align="center" gap={8} style={{ flexShrink: 0 }}>
                    {canQuickAdd && <ActionButton
                        tone="success"
                        shape="circle"
                        icon={<PlusOutlined />}
                        aria-label={`Thêm ${row.ingredient.name} vào kho`}
                        onClick={() => _openQuickAdd(row)}
                    />}
                    {interactive && <Tooltip title={disableUsedToggle ? "Không đủ trong kho để đánh dấu đã dùng" : ""}>
                        <Switch
                            data-testid={`cooking-ingredient-used-toggle-${row.ingredient.id}`}
                            aria-label={`Đánh dấu ${row.ingredient.name} đã dùng`}
                            checked={status === "used"}
                            disabled={disableUsedToggle}
                            checkedChildren="Đã dùng"
                            unCheckedChildren="Chưa"
                            onChange={checked => {
                                if (checked && !row.sufficient) return;
                                _onIngredientStatusChange(row.ingredient.id, checked ? "used" : "needed");
                            }}
                        />
                    </Tooltip>}
                </Stack>
            </div>;
        })}
    </Box>;

    if ((phase === "cooking" || activeSession) && session) {
        if (showFinish || (totalSteps === 0 && !timerView.hasTimer)) {
            return <FinishCookingWidget session={session} onDone={onDone} />;
        }

        const isLast = currentIndex === totalSteps - 1;
        const currentStepDone = completedStepSet.has(currentIndex);
        const stepProgressPercent = totalSteps > 0 ? Math.round(((currentIndex + 1) / totalSteps) * 100) : 0;
        const currentStepHasTimer = Boolean(currentStepObject?.timerMinutes && currentStepObject.timerMinutes >= 1);
        const showStepTimer = stepTimer.view.hasTimer && !stepTimer.view.isFinished && stepTimer.view.stepIndex === currentIndex;
        const currentPhaseMeta = currentStepObject?.phaseKey ? DishDurationHelper.getPhase(currentStepObject.phaseKey) : null;

        return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', padding: 10 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Khẩu phần</Typography.Text>
                <ServingSizeInput value={activeTargetServings} onChange={_onSessionServingChange} style={{ width: '100%' }} />
            </div>

            {timerView.hasTimer && !timerView.isFinished && (
                <CookingTimerCard timer={timerView} onAdvanceLast={() => { timerView.advance(); setShowFinish(true); }} />
            )}

            {showStepTimer && <StepTimerCard timer={stepTimer.view} />}

            {totalSteps > 0 && <Box style={{ background: "#fffbe6", border: "1px solid #ffd591", borderRadius: 8, padding: "16px 14px" }}>
                <Stack justify="space-between" align="center" gap={8} style={{ marginBottom: 10 }}>
                    <ActionButton aria-label="Bước trước" shape="circle" icon={<ArrowLeftOutlined />} disabled={currentIndex === 0} onClick={_onPrev} />
                    <Typography.Text strong style={{ fontSize: 13 }}>Bước {currentIndex + 1}/{totalSteps}</Typography.Text>
                    <ActionButton aria-label="Bước sau" shape="circle" icon={<ArrowRightOutlined />} disabled={isLast} onClick={_onNext} />
                </Stack>
                <Progress percent={stepProgressPercent} showInfo={false} strokeColor="#fa8c16" trailColor="rgba(250,140,22,0.16)" style={{ marginBottom: 10 }} />
                {currentPhaseMeta && <Stack gap={6} align="center" style={{ marginBottom: 6 }}>
                    <span style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: currentPhaseMeta.color,
                    }} />
                    <Typography.Text style={{ fontSize: 12, color: currentPhaseMeta.color, fontWeight: 600 }}>
                        {currentPhaseMeta.label}
                    </Typography.Text>
                    {currentStepHasTimer && <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        · <BellOutlined /> {currentStepObject?.timerMinutes}'
                        {currentStepObject?.unattended ? <> · <NotificationOutlined /> rảnh tay</> : null}
                    </Typography.Text>}
                </Stack>}
                <Typography.Text style={{ fontSize: 16, lineHeight: "24px", display: "block", overflowWrap: "anywhere" }}>
                    {sessionSteps[currentIndex]}
                </Typography.Text>
                <Stack justify="space-between" align="center" gap={8} style={{ marginTop: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Đánh dấu bước này</Typography.Text>
                    <Switch checked={currentStepDone} checkedChildren="Xong" unCheckedChildren="Chưa" onChange={() => dispatch(toggleCookingStepComplete({ sessionId: session.id, stepIndex: currentIndex }))} />
                </Stack>
            </Box>}

            {stepObjects.some(s => s.phaseKey || s.timerMinutes) && <StepListWithRail
                stepObjects={stepObjects}
                sessionSteps={sessionSteps}
                currentIndex={currentIndex}
                completedStepSet={completedStepSet}
                onStepClick={(idx) => dispatch(setStepCooking({ sessionId: session.id, stepIndex: idx }))}
            />}

            {lackingIngredientIds.length > 0 && <Box style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#d46b08' }}>
                Thiếu {lackingIngredientIds.length} nguyên liệu.
            </Box>}

            <Box style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
                <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Nguyên liệu</Typography.Text>
                <IngredientChecklist interactive />
            </Box>

            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setShowFinish(true)} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                Hoàn thành món
            </Button>

            <Popconfirm
                title="Hủy phiên nấu?"
                description="Phiên nấu sẽ bị hủy và không trừ tồn kho. Bạn có chắc không?"
                okText="Hủy phiên nấu"
                okButtonProps={{ danger: true }}
                cancelText="Không"
                zIndex={COOKING_NESTED_MODAL_Z_INDEX}
                onConfirm={_onCancelCooking}
            >
                <Button fullwidth danger icon={<CloseCircleOutlined />}>
                    Hủy nấu
                </Button>
            </Popconfirm>
        </div>;
    }

    return <React.Fragment>
        {!allSufficient && rows.length > 0 && <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`Còn thiếu ${lackingIngredientIds.length} nguyên liệu`}
            description="Thêm nguyên liệu đã có sẵn vào kho bằng nút + ở mỗi dòng, hoặc tạo danh sách mua để đi chợ trước khi nấu."
        />}

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kiểm tra nguyên liệu cần thiết để nấu món này
        </Typography.Text>

        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
            padding: '8px 10px',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            background: '#fafafa',
        }} data-testid="cooking-serving-control">
            <div>
                <Typography.Text strong style={{ display: 'block' }}>Khẩu phần</Typography.Text>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>Gốc {baseServings} phần · {durationText}</Typography.Text>
                {learnedHint && <Typography.Text style={{ display: 'block', fontSize: 12, color: learnedHint.diverges ? '#d46b08' : '#8c8c8c' }}>{learnedHint.text}</Typography.Text>}
            </div>
            <ServingSizeInput
                value={targetServings}
                onChange={(value) => setTargetServings(DishServingHelper.normalizeTargetServings(value, baseServings))}
                style={{ width: 178, flexShrink: 0 }}
            />
        </div>

        <Box style={{ marginTop: 12, marginBottom: 8, border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
            <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Nguyên liệu</Typography.Text>
            <IngredientChecklist interactive={false} />
        </Box>

        {steps.length > 0 && <div style={{
            background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
            padding: '8px 12px', marginBottom: 4, fontSize: 12, color: '#389e0d',
            display: 'flex', alignItems: 'center', gap: 6
        }}>
            <Image src={StepsIcon} preview={false} width={16} style={{ marginBottom: 2 }} />
            {steps.length} bước hướng dẫn sẽ hiển thị sau khi bắt đầu
        </div>}

        <Box style={{ marginTop: 12, marginBottom: 4, border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
            <HouseholdMemberPicker label="Người nấu" value={cookMemberIds} onChange={setCookMemberIds} />
        </Box>

        <Stack gap={8} style={{ marginTop: 8 }}>
            {rows.length > 0 && <Button fullwidth icon={<ShoppingCartOutlined />} onClick={toggleShoppingList.show}>
                Đi chợ
            </Button>}
            <Button
                fullwidth
                type="primary"
                icon={<PlayCircleOutlined />}
                disabled={!allSufficient}
                onClick={_onStartCooking}
                style={allSufficient ? { background: "#fa8c16", borderColor: "#fa8c16" } : undefined}
            >
                Nấu
            </Button>
        </Stack>

        {toggleShoppingList.value && <Modal
            open={toggleShoppingList.value}
            title={<Space>
                <Image src={ShoppingListIcon} preview={false} width={22} style={{ marginBottom: 3 }} />
                Tạo danh sách mua - {dish.name}
            </Space>}
            destroyOnClose
            onCancel={toggleShoppingList.hide}
            footer={null}
            zIndex={COOKING_NESTED_MODAL_Z_INDEX}
        >
            <DeferredModalContent active={toggleShoppingList.value}>
                <ShoppingListAddWidget
                    date={new Date()}
                    dishIds={[dish.id]}
                    initialDishServings={{ [dish.id]: targetServings }}
                    onDone={() => { toggleShoppingList.hide(); onDone(); }}
                    onCreated={(shoppingList) => navigate(RootRoutes.AuthorizedRoutes.ShoppingListRoutes.Detail(shoppingList.id))}
                />
            </DeferredModalContent>
        </Modal>}

        {quickAddRow && <Modal
            open={Boolean(quickAddRow)}
            title={<Space>
                <PlusOutlined style={{ color: "#389e0d" }} />
                Thêm vào kho - {quickAddRow.ingredient.name}
            </Space>}
            destroyOnClose
            onCancel={_closeQuickAdd}
            footer={null}
            zIndex={COOKING_NESTED_MODAL_Z_INDEX}
        >
            <Stack direction="column" align="stretch" gap={12}>
                <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: "19px" }}>
                    Nếu bạn đã có sẵn nguyên liệu này (ví dụ được cho, mua lẻ), nhập lượng để ghi thẳng vào kho. Lô mới sẽ tính là mua hôm nay.
                </Typography.Text>
                <Box style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fafafa" }}>
                    <Stack justify="space-between" align="center" gap={8} style={{ marginBottom: 8 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Cần {IngredientUnitHelper.formatAmount(quickAddRow.required)}{quickAddRow.unit}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Còn thiếu {IngredientUnitHelper.formatAmount(quickAddRow.lacking)}{quickAddRow.unit}</Typography.Text>
                    </Stack>
                    <Stack align="center" gap={8}>
                        <NumberStepper
                            aria-label="lượng thêm vào kho"
                            min={0}
                            step={quickAddRow.unit === "g" || quickAddRow.unit === "ml" ? 50 : 1}
                            value={quickAddAmount}
                            onChange={value => setQuickAddAmount(Math.max(0, Number(value ?? 0)))}
                            style={{ flex: "1 1 auto" }}
                        />
                        <Typography.Text strong style={{ flexShrink: 0, fontSize: 14 }}>{quickAddRow.unit}</Typography.Text>
                    </Stack>
                </Box>
                <Button
                    type="primary"
                    fullwidth
                    icon={<PlusOutlined />}
                    disabled={quickAddAmount <= 0}
                    onClick={_onQuickAddInventory}
                    style={quickAddAmount > 0 ? { background: "#389e0d", borderColor: "#389e0d" } : undefined}
                >
                    Thêm {quickAddAmount > 0 ? `${IngredientUnitHelper.formatAmount(quickAddAmount)}${quickAddRow.unit} ` : ""}vào kho
                </Button>
            </Stack>
        </Modal>}
    </React.Fragment>;
};

type StepListWithRailProps = {
    stepObjects: DishesStep[];
    sessionSteps: string[];
    currentIndex: number;
    completedStepSet: Set<number>;
    onStepClick: (index: number) => void;
}

// Compact step rundown with phase color rail. Lives below the active step card so the user can
// see what's coming and jump back, without expanding the active step area itself.
const StepListWithRail: React.FunctionComponent<StepListWithRailProps> = ({
    stepObjects, sessionSteps, currentIndex, completedStepSet, onStepClick,
}) => {
    return <Box style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
        <Typography.Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Các bước</Typography.Text>
        <Box style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sessionSteps.map((stepText, idx) => {
                // Match by index; sessionSteps is the snapshot taken at startCooking and may be longer
                // than stepObjects (when included-dish step content is flattened) — fall back to the
                // text when the dish step doesn't exist anymore.
                const stepObject = stepObjects[idx];
                const phaseMeta = stepObject?.phaseKey ? DishDurationHelper.getPhase(stepObject.phaseKey) : null;
                const isActive = idx === currentIndex;
                const isDone = completedStepSet.has(idx);
                const railColor = phaseMeta?.color ?? "#d9d9d9";
                return <button
                    key={idx}
                    type="button"
                    onClick={() => onStepClick(idx)}
                    style={{
                        textAlign: "left",
                        display: "grid",
                        gridTemplateColumns: "6px auto minmax(0, 1fr) auto",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: isActive ? `1px solid ${railColor}` : "1px solid transparent",
                        background: isActive ? (phaseMeta?.background ?? "#fafafa") : "transparent",
                        cursor: "pointer",
                    }}
                >
                    <span style={{
                        width: 6,
                        height: 24,
                        borderRadius: 3,
                        background: railColor,
                        opacity: isDone ? 0.4 : 1,
                    }} />
                    <Typography.Text style={{ fontSize: 11, color: "#8c8c8c", fontVariantNumeric: "tabular-nums" }}>
                        {idx + 1}.
                    </Typography.Text>
                    <Typography.Text
                        style={{
                            fontSize: 13,
                            lineHeight: "18px",
                            color: isDone ? "#bfbfbf" : "#262626",
                            textDecoration: isDone ? "line-through" : "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: isActive ? 600 : 400,
                        }}
                    >
                        {stepObject?.content ?? stepText}
                    </Typography.Text>
                    <Stack gap={4} align="center" style={{ flexShrink: 0 }}>
                        {stepObject?.timerMinutes ? <Typography.Text type="secondary" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 2 }}>
                            <BellOutlined /> {stepObject.timerMinutes}'
                        </Typography.Text> : null}
                        {stepObject?.unattended ? <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            <NotificationOutlined />
                        </Typography.Text> : null}
                    </Stack>
                </button>;
            })}
        </Box>
    </Box>;
};
