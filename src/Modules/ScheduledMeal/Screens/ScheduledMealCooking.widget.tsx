import { CheckCircleOutlined, EyeOutlined, FireOutlined, RestOutlined } from '@ant-design/icons';
import { DishDurationHelper } from '@common/Helpers/DishDurationHelper';
import { DishServingHelper } from '@common/Helpers/DishServingHelper';
import { ActionButton, Button } from '@components/Button';
import { Box } from '@components/Layout/Box';
import { Stack } from '@components/Layout/Stack';
import { useMessage } from '@components/Message';
import { DeferredModalContent, Modal } from '@components/Modal';
import { Tag } from '@components/Tag';
import { Typography } from '@components/Typography';
import { CookingSessionWidget } from '@modules/Dishes/Screens/CookingSession.widget';
import { Dishes } from '@store/Models/Dishes';
import { CookingMealFeedbackHistoryRecord, CookingMealFeedbackSlot, CookingSessionMemberFeedback } from '@store/Models/CookingSession';
import { addLeftoverTrackerItem, consumeDishServings, DishServingKind, eatLeftoverServings } from '@store/Reducers/AppContextReducer';
import { saveMealFeedbackHistory, startCooking } from '@store/Reducers/CookingSessionReducer';
import { setMealSlotActual, setMealSlotCooked } from '@store/Reducers/ScheduledMealReducer';
import { ScheduledMealActualRecord, ScheduledMealSlotKey } from '@store/Models/ScheduledMeal';
import { selectAvailableServingsByDishKind, selectCookingSessions, selectDishFeedbackHistory, selectDishes, selectDishesById, selectLeftoverTrackerItems, selectScheduledMeals, selectSelectedHouseholdMembers } from '@store/Selectors';
import { Input, Segmented, Select, Switch } from 'antd';
import { NumberStepper } from '@components/Form/NumberStepper';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const REAL_SLOT_KEYS: ScheduledMealSlotKey[] = ['breakfast', 'lunch', 'dinner'];
const toRealSlot = (slot?: CookingMealFeedbackSlot): ScheduledMealSlotKey | undefined =>
    REAL_SLOT_KEYS.includes(slot as ScheduledMealSlotKey) ? (slot as ScheduledMealSlotKey) : undefined;

export const getScheduledMealDishIds = (dishIds: string[]): string[] => Array.from(new Set(dishIds.filter(Boolean)));

const getMealDateKey = (value?: Date | string) => dayjs(value ?? new Date()).format('YYYY-MM-DD');

const feedbackOptions: Array<{ value: CookingSessionMemberFeedback; label: string }> = [
    { value: 'liked', label: 'Thích' },
    { value: 'neutral', label: 'Bình thường' },
    { value: 'disliked', label: 'Không hợp' },
];

const feedbackLabelByValue: Record<CookingSessionMemberFeedback, string> = feedbackOptions.reduce((result, option) => ({
    ...result,
    [option.value]: option.label,
}), {} as Record<CookingSessionMemberFeedback, string>);

const feedbackColorByValue: Record<CookingSessionMemberFeedback, string> = {
    liked: 'green',
    neutral: 'blue',
    disliked: 'volcano',
};

const findMealFeedbackRecord = (
    history: CookingMealFeedbackHistoryRecord[],
    dishId: string,
    context: { scheduledMealId?: string; mealSlot?: CookingMealFeedbackSlot; mealDate?: Date | string; mealTitle?: string },
): CookingMealFeedbackHistoryRecord | undefined => {
    const mealDate = getMealDateKey(context.mealDate);
    return history.find(record => {
        if (context.scheduledMealId && context.mealSlot) {
            return record.scheduledMealId === context.scheduledMealId
                && record.mealSlot === context.mealSlot
                && record.dishId === dishId;
        }
        if (context.scheduledMealId) {
            return record.scheduledMealId === context.scheduledMealId
                && record.dishId === dishId
                && record.mealDate === mealDate;
        }
        return record.dishId === dishId
            && record.mealDate === mealDate
            && (!context.mealTitle || record.mealTitle === context.mealTitle);
    });
};

const collectAllSteps = (dish: Dishes, dishesById: Map<string, Dishes>, visited = new Set<string>()): string[] => {
    if (visited.has(dish.id)) return [];
    visited.add(dish.id);
    const includedSteps = (dish.includeDishes ?? []).flatMap(id => {
        const includedDish = dishesById.get(id);
        return includedDish ? collectAllSteps(includedDish, dishesById, visited) : [];
    });
    return [...includedSteps, ...(dish.steps ?? []).map(step => step.content).filter(Boolean)];
};

// Focused "use what's already in inventory" modal: pick how many servings to consume per kind
// (fresh vs leftover) and draw them down. No leftover-save, feedback, or planned-vs-reality controls.
const ConsumeFromInventoryModal: React.FC<{ open: boolean; dishId?: string; onClose: () => void }> = ({ open, dishId, onClose }) => {
    const dispatch = useDispatch();
    const message = useMessage();
    const dishesById = useSelector(selectDishesById);
    const servingsByDishKind = useSelector(selectAvailableServingsByDishKind);
    const stock = dishId ? servingsByDishKind.get(dishId) : undefined;
    const fresh = stock?.fresh ?? 0;
    const leftover = stock?.leftover ?? 0;
    const dishName = dishId ? dishesById.get(dishId)?.name : undefined;
    const [freshCount, setFreshCount] = useState(0);
    const [leftoverCount, setLeftoverCount] = useState(0);

    useEffect(() => {
        if (open) { setFreshCount(fresh); setLeftoverCount(leftover); }
    }, [open, fresh, leftover]);

    const requested = (fresh > 0 ? freshCount : 0) + (leftover > 0 ? leftoverCount : 0);

    const _confirm = () => {
        let consumed = 0;
        const useFresh = Math.min(Math.max(0, freshCount), fresh);
        const useLeftover = Math.min(Math.max(0, leftoverCount), leftover);
        if (useFresh > 0) { dispatch(consumeDishServings({ dishId: dishId!, portions: useFresh, kind: 'fresh' })); consumed += useFresh; }
        if (useLeftover > 0) { dispatch(consumeDishServings({ dishId: dishId!, portions: useLeftover, kind: 'leftover' })); consumed += useLeftover; }
        message.success(consumed > 0 ? `Đã dùng ${consumed} phần từ kho` : 'Chưa dùng phần nào');
        onClose();
    };

    return <Modal
        open={open}
        title={<Stack align='center' gap={8}><RestOutlined style={{ color: '#52c41a' }} /><span>{dishName ?? 'Dùng từ kho'}</span></Stack>}
        onCancel={onClose}
        footer={<Stack justify='flex-end' gap={8} style={{ width: '100%' }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type='primary' icon={<CheckCircleOutlined />} disabled={requested <= 0} onClick={_confirm}>Dùng phần này</Button>
        </Stack>}
        width='min(460px, calc(100vw - 24px))'
        style={{ top: 80 }}
        destroyOnClose
    >
        <DeferredModalContent active={open} minHeight={140}>
            <Stack direction='column' align='stretch' gap={12}>
                <Box style={{ borderRadius: 10, border: '1px solid rgba(82,196,26,0.20)', background: '#f6ffed', padding: '11px 13px' }}>
                    <Typography.Text type='secondary' style={{ fontSize: 13, lineHeight: '19px' }}>
                        Trong kho còn {fresh} phần mới nấu · {leftover} phần dư. Chọn số phần muốn dùng cho bữa này.
                    </Typography.Text>
                </Box>
                {fresh > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 150px)', gap: 10, alignItems: 'center' }}>
                    <Typography.Text strong style={{ minWidth: 0 }}>Phần mới nấu <Typography.Text type='secondary' style={{ fontWeight: 400 }}>· còn {fresh}</Typography.Text></Typography.Text>
                    <NumberStepper min={0} max={fresh} step={0.5} value={freshCount} onChange={value => setFreshCount(Number(value ?? 0))} style={{ width: '100%' }} />
                </div>}
                {leftover > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 150px)', gap: 10, alignItems: 'center' }}>
                    <Typography.Text strong style={{ minWidth: 0 }}>Phần dư <Typography.Text type='secondary' style={{ fontWeight: 400 }}>· còn {leftover}</Typography.Text></Typography.Text>
                    <NumberStepper min={0} max={leftover} step={0.5} value={leftoverCount} onChange={value => setLeftoverCount(Number(value ?? 0))} style={{ width: '100%' }} />
                </div>}
            </Stack>
        </DeferredModalContent>
    </Modal>;
};

type ScheduledMealCookingModalProps = {
    open: boolean;
    title: string;
    dishIds: string[];
    dishServings?: Record<string, number>;
    autoStartToken?: number;
    scheduledMealId?: string;
    mealSlot?: CookingMealFeedbackSlot;
    mealDate?: Date | string;
    cookedMealIds?: string[];   // meal-plan ids to optimistically mark cooked when a dish starts
    onClose: () => void;
}

export const ScheduledMealCookingModal: React.FC<ScheduledMealCookingModalProps> = ({ open, title, dishIds, dishServings, scheduledMealId, mealSlot, mealDate, cookedMealIds, onClose }) => {
    const dispatch = useDispatch();
    const allDishes = useSelector(selectDishes);
    const dishesById = useSelector(selectDishesById);
    const sessions = useSelector(selectCookingSessions);
    const selectedMembers = useSelector(selectSelectedHouseholdMembers);
    const servingsByDishKind = useSelector(selectAvailableServingsByDishKind);
    const [focusedDishId, setFocusedDishId] = useState<string>();
    const [cookingOpen, setCookingOpen] = useState(false);
    const [choiceDishId, setChoiceDishId] = useState<string>();
    const [consumeDishId, setConsumeDishId] = useState<string>();
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackScope, setFeedbackScope] = useState<{ title: string; dishIds: string[] }>({ title: '', dishIds: [] });
    const uniqueDishIds = useMemo(() => getScheduledMealDishIds(dishIds), [dishIds]);
    const activeSessionByDishId = useMemo(() => new Map(sessions.filter(session => session.status === 'cooking').map(session => [session.dishId, session])), [sessions]);
    const finishedDishIds = useMemo(() => new Set(sessions.filter(session => session.status === 'finished').map(session => session.dishId)), [sessions]);

    const realSlot = toRealSlot(mealSlot);
    // Meal-plan ids whose cooked flag this cooking session governs (optimistic mark + rollback).
    const ownedMealIds = useMemo(
        () => cookedMealIds ?? (scheduledMealId ? [scheduledMealId] : []),
        [cookedMealIds, scheduledMealId],
    );
    // Track whether we optimistically marked cooked this session, so we only roll back our own mark.
    const markedCookedRef = useRef(false);
    // Dishes already finished when the modal opened — excluded from the "cooked" signal so merely
    // opening the cook flow for a dish cooked on a previous day doesn't auto-mark today's slot.
    // Snapshot the finished set at open so only dishes that start/finish during THIS open count.
    // Must be state (not a ref) so the dish list re-renders with the correct baseline — a ref update
    // inside an effect wouldn't trigger a render, leaving prior-day dishes showing as "Đã xong".
    const [baselineFinished, setBaselineFinished] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) setBaselineFinished(new Set(finishedDishIds));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // A dish counts as cooked-this-session only if it's actively cooking now, or it finished after
    // the modal opened (not part of the open-time baseline).
    const cookedThisSession = useMemo(
        () => uniqueDishIds.some(id => activeSessionByDishId.has(id) || (finishedDishIds.has(id) && !baselineFinished.has(id))),
        [uniqueDishIds, activeSessionByDishId, finishedDishIds, baselineFinished],
    );

    // Optimistic mark: as soon as any dish in this slot starts cooking, flag the owning plans cooked.
    useEffect(() => {
        if (!open || !realSlot || ownedMealIds.length === 0) return;
        if (cookedThisSession && !markedCookedRef.current) {
            markedCookedRef.current = true;
            ownedMealIds.forEach(mealId => dispatch(setMealSlotCooked({ mealId, slot: realSlot, cooked: true })));
        }
    }, [open, realSlot, ownedMealIds, cookedThisSession, dispatch]);

    // Rollback: if we marked cooked but every started dish ended cancelled (no produced servings),
    // clear the flag so a fully-abandoned cook doesn't leave the slot looking cooked.
    useEffect(() => {
        if (!realSlot || ownedMealIds.length === 0 || !markedCookedRef.current) return;
        if (!cookedThisSession) {
            markedCookedRef.current = false;
            ownedMealIds.forEach(mealId => dispatch(setMealSlotCooked({ mealId, slot: realSlot, cooked: false })));
        }
    }, [realSlot, ownedMealIds, cookedThisSession, dispatch]);

    // Reset the per-open mark tracker and transient choice when the modal closes.
    useEffect(() => {
        if (!open) { markedCookedRef.current = false; setChoiceDishId(undefined); }
    }, [open]);

    const _startDish = React.useCallback((dishId: string, force = false, servingsOverride?: number) => {
        const dish = dishesById.get(dishId);
        if (!dish) return;
        if (!force && (activeSessionByDishId.has(dishId) || finishedDishIds.has(dishId))) return;
        const planned = dishServings?.[dishId] ?? DishServingHelper.getBaseServings(dish);
        const targetServings = servingsOverride != null && servingsOverride > 0 ? servingsOverride : planned;
        const timerPhases = DishDurationHelper.getActiveItems(dish.duration)
            .map(item => ({ phaseKey: item.phase.key, plannedMinutes: item.minutes }));
        dispatch(startCooking({
            dishId: dish.id,
            dishName: dish.name,
            baseServings: DishServingHelper.getBaseServings(dish),
            targetServings,
            steps: collectAllSteps(dish, dishesById),
            ingredientIds: Array.from(new Set(DishServingHelper.collectIngredientAmounts(dish, allDishes, { targetServings }).map(item => item.ingredientId))),
            householdMemberIds: selectedMembers.map(member => member.id),
            timerPhases,
        }));
    }, [activeSessionByDishId, allDishes, selectedMembers, dishServings, dishesById, dispatch, finishedDishIds]);

    const _availableServings = (dishId: string): number => {
        const stock = servingsByDishKind.get(dishId);
        return stock ? stock.fresh + stock.leftover : 0;
    };

    const _plannedServings = (dishId: string): number => {
        const dish = dishesById.get(dishId);
        return dishServings?.[dishId] ?? (dish ? DishServingHelper.getBaseServings(dish) : 0);
    };

    // Enter the cooking widget for a dish, starting a session at the given servings if none is live.
    const _enterCooking = (dishId: string, servingsOverride?: number) => {
        if (!activeSessionByDishId.has(dishId)) _startDish(dishId, false, servingsOverride);
        setFocusedDishId(dishId);
        setCookingOpen(true);
    };

    const _openDish = (dishId: string) => {
        const hasActive = activeSessionByDishId.has(dishId);
        // Only a dish finished during THIS open jumps to feedback. A dish cooked on a prior day must
        // still be cookable now, so it falls through to the cook choice below.
        const finishedThisSession = !hasActive && finishedDishIds.has(dishId) && !baselineFinished.has(dishId);
        if (finishedThisSession) {
            const dish = dishesById.get(dishId);
            setFeedbackScope({ title: `Phản hồi món - ${dish?.name ?? 'Đã nấu'}`, dishIds: [dishId] });
            setFeedbackOpen(true);
            return;
        }
        // Resuming a live session goes straight into the cooking view.
        if (hasActive) { _enterCooking(dishId); return; }
        // No live session: if there are servings already available, let the user choose between
        // using them, cooking fresh, or cooking just the shortfall.
        if (_availableServings(dishId) > 0) { setChoiceDishId(dishId); return; }
        _enterCooking(dishId);
    };

    const focusedDish = focusedDishId ? dishesById.get(focusedDishId) : undefined;
    const choiceDish = choiceDishId ? dishesById.get(choiceDishId) : undefined;
    const choiceAvailable = choiceDishId ? _availableServings(choiceDishId) : 0;
    const choicePlanned = choiceDishId ? _plannedServings(choiceDishId) : 0;
    const choiceShortfall = Math.max(0, choicePlanned - choiceAvailable);

    return <React.Fragment>
        <Modal
            open={open}
            title={<Stack align='center' gap={8}><FireOutlined style={{ color: '#fa8c16' }} />{title}</Stack>}
            onCancel={onClose}
            footer={null}
            destroyOnClose={false}
            width='min(900px, calc(100vw - 24px))'
            style={{ top: 34 }}
            bodyStyle={{ width: '100%', boxSizing: 'border-box' }}
        >
            <DeferredModalContent active={open} minHeight={260}>
                {uniqueDishIds.length === 0 ? <Box style={{ textAlign: 'center', padding: '26px 0' }}>
                    <Typography.Text type='secondary'>Bữa này chưa có món để nấu.</Typography.Text>
                </Box> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {uniqueDishIds.map(dishId => {
                        const dish = dishesById.get(dishId);
                        const session = activeSessionByDishId.get(dishId);
                        // Only a dish finished during THIS open is "done" here. A dish cooked on a prior
                        // day must stay cookable, so it reads as not-started and keeps a cook button.
                        const finishedThisSession = !session && finishedDishIds.has(dishId) && !baselineFinished.has(dishId);
                        const available = _availableServings(dishId);
                        const statusLabel = session?.steps?.length
                            ? `Đang nấu · bước ${(session.currentStepIndex ?? 0) + 1}/${session.steps.length}`
                            : session ? 'Đang nấu'
                                : finishedThisSession ? 'Đã xong'
                                    : available > 0 ? `Còn ${available} phần trong kho`
                                        : 'Chưa bắt đầu';
                        if (!dish) return null;
                        return <Box key={dishId} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fff', padding: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: 'block', color: '#111827', lineHeight: '19px', overflowWrap: 'anywhere' }}>{dish.name}</Typography.Text>
                                    <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginTop: 2 }}>{statusLabel}{dishServings?.[dishId] ? ` · cần ${dishServings[dishId]} phần` : ''}</Typography.Text>
                                </div>
                                <ActionButton tone={session ? 'primary' : finishedThisSession ? 'default' : 'success'} icon={finishedThisSession ? <EyeOutlined /> : <FireOutlined />} onClick={() => _openDish(dishId)} style={{ minWidth: 104 }}>
                                    {session ? 'Tiếp tục' : finishedThisSession ? 'Phản hồi' : 'Bắt đầu'}
                                </ActionButton>
                            </div>
                        </Box>;
                    })}
                </div>}
            </DeferredModalContent>
        </Modal>

        <Modal
            open={cookingOpen}
            title={<Stack align='center' gap={8}><FireOutlined style={{ color: '#fa8c16' }} />{focusedDish?.name ?? 'Đang nấu'}</Stack>}
            onCancel={() => setCookingOpen(false)}
            footer={null}
            destroyOnClose={false}
            width='min(760px, calc(100vw - 24px))'
            style={{ top: 24 }}
        >
            <DeferredModalContent active={cookingOpen} minHeight={260}>
                {focusedDish ? <CookingSessionWidget dish={focusedDish} onDone={() => setCookingOpen(false)} /> : null}
            </DeferredModalContent>
        </Modal>

        {choiceDishId && (() => {
            const available = _availableServings(choiceDishId);
            const planned = _plannedServings(choiceDishId);
            const shortfall = Math.max(0, planned - available);
            const dish = dishesById.get(choiceDishId);
            const _close = () => setChoiceDishId(undefined);
            return <Modal
                open={Boolean(choiceDishId)}
                title={<Stack align='center' gap={8}><FireOutlined style={{ color: '#fa8c16' }} /><span>{dish?.name ?? 'Món ăn'}</span></Stack>}
                onCancel={_close}
                footer={<Stack justify='flex-end' style={{ width: '100%' }}><Button onClick={_close}>Đóng</Button></Stack>}
                width='min(520px, calc(100vw - 24px))'
                style={{ top: 60 }}
                destroyOnClose
            >
                <DeferredModalContent active={Boolean(choiceDishId)} minHeight={180}>
                    <Stack direction='column' align='stretch' gap={12}>
                        <Box style={{ borderRadius: 12, border: '1px solid rgba(56,158,13,0.18)', background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 70%)', padding: '14px 16px' }}>
                            <Typography.Text strong style={{ display: 'block', fontSize: 15, color: '#111827', marginBottom: 2 }}>Đã có {available} phần sẵn trong kho</Typography.Text>
                            <Typography.Text type='secondary' style={{ display: 'block', fontSize: 13, lineHeight: '19px' }}>
                                Bữa này cần {planned} phần. Bạn muốn dùng phần có sẵn hay nấu thêm?
                            </Typography.Text>
                        </Box>

                        <Box
                            onClick={() => { _close(); setConsumeDishId(choiceDishId); }}
                            style={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, padding: '11px 13px', cursor: 'pointer' }}
                        >
                            <Stack align='center' gap={10}>
                                <RestOutlined style={{ color: '#389e0d', fontSize: 18, flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: 'block', lineHeight: '18px' }}>Dùng phần có sẵn</Typography.Text>
                                    <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>Không nấu, dùng {available} phần đang có trong kho phần ăn.</Typography.Text>
                                </div>
                            </Stack>
                        </Box>

                        {shortfall > 0 && <Box
                            onClick={() => { _close(); _enterCooking(choiceDishId, shortfall); }}
                            style={{ border: '1px solid #ffd591', background: '#fff7e6', borderRadius: 8, padding: '11px 13px', cursor: 'pointer' }}
                        >
                            <Stack align='center' gap={10}>
                                <FireOutlined style={{ color: '#fa8c16', fontSize: 18, flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: 'block', lineHeight: '18px' }}>Nấu thêm {shortfall} phần còn thiếu</Typography.Text>
                                    <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>Dùng {available} phần có sẵn và nấu bù {shortfall} phần cho đủ {planned} phần.</Typography.Text>
                                </div>
                            </Stack>
                        </Box>}

                        <Box
                            onClick={() => { _close(); _enterCooking(choiceDishId); }}
                            style={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, padding: '11px 13px', cursor: 'pointer' }}
                        >
                            <Stack align='center' gap={10}>
                                <FireOutlined style={{ color: '#fa8c16', fontSize: 18, flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: 'block', lineHeight: '18px' }}>Nấu đủ {planned} phần</Typography.Text>
                                    <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>Bỏ qua phần có sẵn, nấu mới toàn bộ bữa.</Typography.Text>
                                </div>
                            </Stack>
                        </Box>
                    </Stack>
                </DeferredModalContent>
            </Modal>;
        })()}

        <ConsumeFromInventoryModal
            open={Boolean(consumeDishId)}
            dishId={consumeDishId}
            onClose={() => setConsumeDishId(undefined)}
        />

        <MealCompletionLeftoverModal
            open={feedbackOpen}
            title={feedbackScope.title}
            dishIds={feedbackScope.dishIds}
            dishServings={dishServings}
            scheduledMealId={scheduledMealId}
            mealSlot={mealSlot ?? 'dish'}
            mealDate={mealDate}
            onClose={() => setFeedbackOpen(false)}
        />
    </React.Fragment>;
};

// Which sections the modal renders. 'feedback' = ratings + actual-eaten only; 'leftover' =
// save-leftover + consume-inventory only; 'full' = everything (used by per-plan "Hoàn tất").
type MealCompletionMode = 'full' | 'feedback' | 'leftover';

type MealCompletionLeftoverModalProps = {
    open: boolean;
    title: string;
    dishIds: string[];
    dishServings?: Record<string, number>;
    scheduledMealId?: string;
    mealSlot?: CookingMealFeedbackSlot;
    mealDate?: Date | string;
    readonly?: boolean;
    mode?: MealCompletionMode;
    onClose: () => void;
}

type LeftoverDishDraft = {
    enabled: boolean;
    portions: number;
    eatInDays: number;
    note: string;
}

export const MealCompletionLeftoverModal: React.FC<MealCompletionLeftoverModalProps> = ({ open, title, dishIds, dishServings, scheduledMealId, mealSlot, mealDate, readonly, mode = 'full', onClose }) => {
    const showLeftoverSection = mode === 'full' || mode === 'leftover';
    const showFeedbackSection = mode === 'full' || mode === 'feedback';
    const dispatch = useDispatch();
    const message = useMessage();
    const dishesById = useSelector(selectDishesById);
    const members = useSelector(selectSelectedHouseholdMembers);
    const feedbackHistory = useSelector(selectDishFeedbackHistory);
    const leftoverItems = useSelector(selectLeftoverTrackerItems);
    const servingsByDishKind = useSelector(selectAvailableServingsByDishKind);
    const scheduledMeals = useSelector(selectScheduledMeals);
    const uniqueDishIds = useMemo(() => getScheduledMealDishIds(dishIds), [dishIds]);
    const mealDateKey = useMemo(() => getMealDateKey(mealDate), [mealDate]);
    const mealDateValue = useMemo(() => dayjs(mealDateKey), [mealDateKey]);
    const mealLeftovers = useMemo(() => leftoverItems.filter(item => {
        if (scheduledMealId && item.scheduledMealId === scheduledMealId) {
            return mealSlot ? item.mealSlot === mealSlot : true;
        }
        // Fallback for older records: match by date + dish ids in scope.
        const dishSet = new Set(uniqueDishIds);
        return dishSet.has(item.dishId) && item.mealDate === mealDateKey;
    }), [leftoverItems, mealDateKey, mealSlot, scheduledMealId, uniqueDishIds]);
    const [drafts, setDrafts] = useState<Record<string, LeftoverDishDraft>>({});
    const [feedback, setFeedback] = useState<Record<string, Record<string, CookingSessionMemberFeedback>>>({});
    const [consumeKind, setConsumeKind] = useState<Record<string, DishServingKind>>({});
    const [consumeCount, setConsumeCount] = useState<Record<string, number>>({});
    // Planned-vs-reality: did the household eat the planned dishes, or something else / a leftover?
    const [actualMode, setActualMode] = useState<'planned' | 'other'>('planned');
    const [actualOtherDishIds, setActualOtherDishIds] = useState<string[]>([]);
    const [actualNote, setActualNote] = useState('');

    // The planned-vs-reality control only applies to a concrete meal slot on a saved ScheduledMeal.
    const realSlot: ScheduledMealSlotKey | undefined = (scheduledMealId && (mealSlot === 'breakfast' || mealSlot === 'lunch' || mealSlot === 'dinner')) ? mealSlot : undefined;

    const availableForKind = React.useCallback((dishId: string, kind: DishServingKind): number => {
        const stock = servingsByDishKind.get(dishId);
        if (!stock) return 0;
        return kind === 'fresh' ? stock.fresh : stock.leftover;
    }, [servingsByDishKind]);

    React.useEffect(() => {
        if (!open) return;
        setDrafts(Object.fromEntries(uniqueDishIds.map(id => [id, { enabled: false, portions: 1, eatInDays: 2, note: '' }])));
        setFeedback(Object.fromEntries(uniqueDishIds.map(id => {
            const record = findMealFeedbackRecord(feedbackHistory, id, { scheduledMealId, mealSlot, mealDate, mealTitle: title });
            return [id, record?.memberFeedback ?? {}];
        })));
        const nextConsumeKind: Record<string, DishServingKind> = {};
        const nextConsumeCount: Record<string, number> = {};
        uniqueDishIds.forEach(id => {
            const stock = servingsByDishKind.get(id);
            if (!stock || (stock.fresh <= 0 && stock.leftover <= 0)) return;
            const kind: DishServingKind = stock.fresh > 0 ? 'fresh' : 'leftover';
            const available = kind === 'fresh' ? stock.fresh : stock.leftover;
            const dish = dishesById.get(id);
            const defaultServings = dishServings?.[id] ?? DishServingHelper.getBaseServings(dish);
            nextConsumeKind[id] = kind;
            nextConsumeCount[id] = Math.min(available, defaultServings);
        });
        setConsumeKind(nextConsumeKind);
        setConsumeCount(nextConsumeCount);
        // Pre-fill the planned-vs-reality control from any previously saved actual record for this slot.
        const existingActual = realSlot ? scheduledMeals.find(meal => meal.id === scheduledMealId)?.actualMeals?.[realSlot] : undefined;
        if (existingActual) {
            const plannedSet = new Set(uniqueDishIds);
            const differs = existingActual.dishIds.length !== uniqueDishIds.length || existingActual.dishIds.some(id => !plannedSet.has(id));
            setActualMode(differs ? 'other' : 'planned');
            setActualOtherDishIds(differs ? existingActual.dishIds : []);
            setActualNote(existingActual.note ?? '');
        } else {
            setActualMode('planned');
            setActualOtherDishIds([]);
            setActualNote('');
        }
    }, [dishServings, dishesById, feedbackHistory, mealDate, mealDateValue, mealSlot, members, open, realSlot, scheduledMealId, scheduledMeals, servingsByDishKind, title, uniqueDishIds]);

    const _setFeedback = (dishId: string, memberId: string, value?: CookingSessionMemberFeedback) => {
        setFeedback(current => ({
            ...current,
            [dishId]: Object.fromEntries(Object.entries({ ...(current[dishId] ?? {}), [memberId]: value }).filter(([, reaction]) => Boolean(reaction))) as Record<string, CookingSessionMemberFeedback>,
        }));
    };

    const _updateDraft = (dishId: string, patch: Partial<LeftoverDishDraft>) => {
        setDrafts(current => ({
            ...current,
            [dishId]: {
                enabled: false,
                portions: 1,
                eatInDays: 2,
                note: '',
                ...(current[dishId] ?? {}),
                ...patch,
            },
        }));
    };

    const _setConsumeKind = (dishId: string, kind: DishServingKind) => {
        setConsumeKind(current => ({ ...current, [dishId]: kind }));
        setConsumeCount(current => {
            const available = availableForKind(dishId, kind);
            const previous = current[dishId] ?? 0;
            return { ...current, [dishId]: Math.min(available, previous > 0 ? previous : available) };
        });
    };

    const _setConsumeCount = (dishId: string, value: number) => {
        const kind = consumeKind[dishId] ?? 'leftover';
        const available = availableForKind(dishId, kind);
        const next = Number.isFinite(value) && value > 0 ? Math.min(available, value) : 0;
        setConsumeCount(current => ({ ...current, [dishId]: next }));
    };

    const _save = () => {
        let saved = 0;
        if (showLeftoverSection) uniqueDishIds.forEach(dishId => {
            const dish = dishesById.get(dishId);
            const draft = drafts[dishId];
            if (!dish || !draft?.enabled || draft.portions <= 0) return;
            // Never store more leftover than the dish actually has available in inventory.
            const stock = servingsByDishKind.get(dishId);
            const availableTotal = (stock?.fresh ?? 0) + (stock?.leftover ?? 0);
            const portions = Math.min(draft.portions, availableTotal);
            if (portions <= 0) return;
            dispatch(addLeftoverTrackerItem({
                id: nanoid(10),
                dishId: dish.id,
                dishName: dish.name,
                portions,
                storedAt: new Date().toISOString(),
                eatBy: dayjs().add(draft.eatInDays, 'day').endOf('day').toISOString(),
                note: draft.note.trim() || undefined,
                status: 'available',
                scheduledMealId,
                mealSlot,
                mealDate: mealDateKey,
                mealTitle: title,
            }));
            saved += 1;
        });
        // Save editable per-meal feedback history and keep per-dish aggregate feedback in sync.
        let rated = 0;
        if (showFeedbackSection) uniqueDishIds.forEach(dishId => {
            const dish = dishesById.get(dishId);
            if (!dish) return;
            const memberFeedback = feedback[dishId] ?? {};
            rated += Object.keys(memberFeedback).length;
            dispatch(saveMealFeedbackHistory({
                scheduledMealId,
                mealSlot,
                mealDate: mealDateKey,
                mealTitle: title,
                dishId,
                dishName: dish.name,
                memberFeedback,
            }));
        });
        // Draw down the dish serving inventory for the chosen kind (fresh vs leftover).
        let totalConsumed = 0;
        if (showLeftoverSection) uniqueDishIds.forEach(dishId => {
            const kind = consumeKind[dishId];
            if (!kind) return;
            const requested = Number(consumeCount[dishId] ?? 0);
            if (!Number.isFinite(requested) || requested <= 0) return;
            const available = availableForKind(dishId, kind);
            if (available <= 0) return;
            const portions = Math.min(requested, available);
            if (portions <= 0) return;
            dispatch(consumeDishServings({ dishId, portions, kind }));
            totalConsumed += portions;
        });
        // Planned-vs-reality: record what was actually eaten when it differs from the plan, on a real
        // ScheduledMeal slot. When "other" maps to tracked leftover items, also draw those down.
        let actualRecorded = false;
        if (realSlot && showFeedbackSection) {
            const actualDishIds = actualMode === 'planned' ? uniqueDishIds : Array.from(new Set(actualOtherDishIds.filter(Boolean)));
            const plannedSet = new Set(uniqueDishIds);
            const differs = actualMode === 'other'
                && (actualDishIds.length !== uniqueDishIds.length || actualDishIds.some(id => !plannedSet.has(id)));
            if (differs) {
                const leftoverItemIds = actualDishIds.flatMap(dishId => {
                    const matched = mealLeftovers.filter(item => item.dishId === dishId && item.status === 'available');
                    return matched.map(item => item.id);
                });
                // Eat one portion from any matched leftover items so the tracker reflects reality.
                leftoverItemIds.forEach(id => dispatch(eatLeftoverServings({ id, count: 1 })));
                dispatch(setMealSlotActual({
                    mealId: scheduledMealId!,
                    slot: realSlot,
                    record: {
                        dishIds: actualDishIds,
                        leftoverItemIds: leftoverItemIds.length > 0 ? leftoverItemIds : undefined,
                        note: actualNote.trim() || undefined,
                        recordedAt: new Date().toISOString(),
                    },
                }));
                actualRecorded = true;
            }
        }
        const parts: string[] = [];
        if (saved > 0) parts.push(`${saved} món còn lại`);
        if (totalConsumed > 0) parts.push(`${totalConsumed} phần đã dùng`);
        if (rated > 0) parts.push(`${rated} phản hồi`);
        if (actualRecorded) parts.push('thực tế đã ăn');
        message.success(parts.length > 0 ? `Đã lưu ${parts.join(' · ')}` : 'Đã hoàn tất bữa ăn');
        onClose();
    };

    const enabledCount = uniqueDishIds.filter(dishId => drafts[dishId]?.enabled).length;
    const memberNameById = useMemo(() => new Map(members.map(member => [member.id, member.name])), [members]);
    // Options for "ate something else": dishes that currently have servings in inventory (fresh or
    // leftover) plus any tracked leftover items, so the user can record a reality that differs from plan.
    const actualOtherOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: Array<{ value: string; label: string }> = [];
        const pushOption = (dishId: string, fallbackName?: string) => {
            if (!dishId || seen.has(dishId)) return;
            seen.add(dishId);
            const name = dishesById.get(dishId)?.name ?? fallbackName ?? dishId;
            options.push({ value: dishId, label: name });
        };
        Array.from(servingsByDishKind.keys()).forEach(dishId => {
            const stock = servingsByDishKind.get(dishId);
            if (stock && (stock.fresh > 0 || stock.leftover > 0)) pushOption(dishId);
        });
        leftoverItems.filter(item => item.status === 'available').forEach(item => pushOption(item.dishId, item.dishName));
        return options;
    }, [servingsByDishKind, leftoverItems, dishesById]);
    const renderFeedbackTags = (dishId: string) => {
        const entries = Object.entries(feedback[dishId] ?? {}) as [string, CookingSessionMemberFeedback][];
        if (entries.length === 0) return <Typography.Text type='secondary' style={{ fontSize: 12 }}>Chưa có phản hồi đã lưu</Typography.Text>;
        return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {entries.map(([memberId, reaction]) => <div key={`${dishId}-${memberId}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center', width: '100%' }}>
                <Typography.Text style={{ minWidth: 0, color: '#111827', fontSize: 13, lineHeight: '18px', overflowWrap: 'anywhere' }}>{memberNameById.get(memberId) ?? 'Thành viên'}</Typography.Text>
                <Tag color={feedbackColorByValue[reaction]} style={{ marginRight: 0, flexShrink: 0 }}>{feedbackLabelByValue[reaction]}</Tag>
            </div>)}
        </div>;
    };

    return <Modal
        open={open}
        title={<Stack align='center' gap={8}><RestOutlined style={{ color: '#52c41a' }} />{title}</Stack>}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        width='min(660px, calc(100vw - 24px))'
        bodyStyle={{ width: '100%', boxSizing: 'border-box' }}
    >
        <DeferredModalContent active={open} minHeight={180}>
            {uniqueDishIds.length === 0 ? <Box style={{ textAlign: 'center', padding: '24px 0' }}>
                <Typography.Text type='secondary'>Không có món để lưu phần còn lại.</Typography.Text>
            </Box> : readonly ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {uniqueDishIds.map(dishId => {
                    const dish = dishesById.get(dishId);
                    if (!dish) return null;
                    return <Box key={dishId} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fff', padding: 10 }}>
                        <Typography.Text strong style={{ display: 'block', color: '#111827', lineHeight: '19px', overflowWrap: 'anywhere' }}>{dish.name}</Typography.Text>
                        <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginTop: 2 }}>Bữa này đã hoàn tất. Phản hồi chỉ xem, không chỉnh sửa.</Typography.Text>
                        <div style={{ marginTop: 8 }}>{renderFeedbackTags(dishId)}</div>
                    </Box>;
                })}
                {mealLeftovers.length > 0 && <Box style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(82,196,26,0.20)', borderRadius: 8, background: '#f6ffed', padding: 10 }}>
                    <Stack align='center' gap={6} style={{ marginBottom: 8 }}>
                        <RestOutlined style={{ color: '#52c41a' }} />
                        <Typography.Text strong style={{ color: '#135200', fontSize: 13, lineHeight: '18px' }}>Phần còn lại đã ghi nhận</Typography.Text>
                    </Stack>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                        {mealLeftovers.map(leftover => {
                            const eatBy = leftover.eatBy ? dayjs(leftover.eatBy) : null;
                            const statusLabel = leftover.status === 'finished' ? 'Đã ăn hết' : leftover.status === 'discarded' ? 'Đã bỏ' : 'Còn';
                            const statusColor = leftover.status === 'finished' ? 'default' : leftover.status === 'discarded' ? 'red' : 'green';
                            return <Box key={leftover.id} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 6, background: '#fff', padding: 9 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'flex-start', width: '100%' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <Typography.Text strong style={{ display: 'block', color: '#111827', fontSize: 13, lineHeight: '18px', overflowWrap: 'anywhere' }}>{leftover.dishName}</Typography.Text>
                                        <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginTop: 2 }}>
                                            {leftover.portions} phần{eatBy ? ` · ăn trước ${eatBy.format('DD/MM')}` : ''}
                                        </Typography.Text>
                                        {leftover.note && <Typography.Text style={{ display: 'block', color: '#475569', fontSize: 12, lineHeight: '17px', marginTop: 4, overflowWrap: 'anywhere' }}>{leftover.note}</Typography.Text>}
                                    </div>
                                    <Tag color={statusColor} style={{ marginRight: 0, flexShrink: 0 }}>{statusLabel}</Tag>
                                </div>
                            </Box>;
                        })}
                    </div>
                </Box>}
                <Button fullwidth onClick={onClose}>Đóng</Button>
            </div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {showFeedbackSection && realSlot && <Box style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(250,173,20,0.30)', borderRadius: 8, background: '#fffbe6', padding: 10 }}>
                    <Stack align='center' gap={6} style={{ marginBottom: 8 }}>
                        <RestOutlined style={{ color: '#d48806' }} />
                        <Typography.Text strong style={{ fontSize: 13, color: '#874d00' }}>Thực tế đã ăn</Typography.Text>
                    </Stack>
                    <Segmented
                        value={actualMode}
                        onChange={value => setActualMode(value as 'planned' | 'other')}
                        options={[{ label: 'Đúng món đã lên kế hoạch', value: 'planned' }, { label: 'Món khác / phần dư', value: 'other' }]}
                        block
                    />
                    {actualMode === 'other' && <div style={{ marginTop: 10 }}>
                        <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Đã ăn món gì?</Typography.Text>
                        <Select
                            mode='multiple'
                            allowClear
                            value={actualOtherDishIds}
                            onChange={setActualOtherDishIds}
                            placeholder='Chọn món hoặc phần dư đã ăn'
                            options={actualOtherOptions}
                            style={{ width: '100%' }}
                        />
                        <Input.TextArea
                            value={actualNote}
                            onChange={event => setActualNote(event.target.value)}
                            placeholder='Ghi chú thêm (không bắt buộc)'
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            style={{ marginTop: 8 }}
                        />
                    </div>}
                </Box>}
                {uniqueDishIds.map(dishId => {
                    const dish = dishesById.get(dishId);
                    const draft = drafts[dishId] ?? { enabled: false, portions: 1, eatInDays: 2, note: '' };
                    if (!dish) return null;
                    // Cap leftover-able portions at what's actually available in inventory for this dish:
                    // you can't store 2 leftover servings when only 1 serving exists.
                    const dishStock = servingsByDishKind.get(dishId);
                    const availableTotal = (dishStock?.fresh ?? 0) + (dishStock?.leftover ?? 0);
                    const maxLeftover = availableTotal > 0 ? availableTotal : 0;
                    return <Box key={dishId} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fff', padding: 10 }}>
                        {showLeftoverSection && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center', width: '100%' }}>
                            <Typography.Text strong style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{dish.name}</Typography.Text>
                            <Switch checked={draft.enabled} disabled={maxLeftover <= 0} checkedChildren='Còn' unCheckedChildren='Hết' onChange={checked => _updateDraft(dishId, { enabled: checked })} />
                        </div>}
                        {!showLeftoverSection && <Typography.Text strong style={{ display: 'block', minWidth: 0, overflowWrap: 'anywhere' }}>{dish.name}</Typography.Text>}
                        {showLeftoverSection && maxLeftover <= 0 && <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, marginTop: 4 }}>Chưa có phần nào trong kho để lưu lại.</Typography.Text>}
                        {showLeftoverSection && draft.enabled && maxLeftover > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(140px, 170px)', gap: 8, marginTop: 10 }}>
                            <div>
                                <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Số phần còn (tối đa {maxLeftover} phần)</Typography.Text>
                                <NumberStepper min={0.5} max={maxLeftover} step={0.5} value={draft.portions} onChange={value => _updateDraft(dishId, { portions: Number(value ?? 0) })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Ăn trước</Typography.Text>
                                <Select value={draft.eatInDays} onChange={value => _updateDraft(dishId, { eatInDays: value })} options={[{ value: 1, label: 'Ngày mai' }, { value: 2, label: '2 ngày' }, { value: 3, label: '3 ngày' }, { value: 5, label: '5 ngày' }]} style={{ width: '100%' }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Ghi chú</Typography.Text>
                                <Input.TextArea value={draft.note} onChange={event => _updateDraft(dishId, { note: event.target.value })} placeholder='Ví dụ: để hộp ngăn mát, phần cho bữa trưa mai...' autoSize={{ minRows: 2, maxRows: 4 }} />
                            </div>
                        </div>}
                        {showLeftoverSection && (() => {
                            const stock = servingsByDishKind.get(dishId);
                            if (!stock || (stock.fresh <= 0 && stock.leftover <= 0)) return null;
                            const bothKinds = stock.fresh > 0 && stock.leftover > 0;
                            const chosenKind: DishServingKind = consumeKind[dishId] ?? (stock.fresh > 0 ? 'fresh' : 'leftover');
                            const maxForKind = availableForKind(dishId, chosenKind);
                            const count = consumeCount[dishId] ?? 0;
                            return <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(82,196,26,0.4)' }}>
                                <Stack align='center' gap={6} style={{ marginBottom: 6 }}>
                                    <RestOutlined style={{ color: '#52c41a' }} />
                                    <Typography.Text strong style={{ display: 'block', fontSize: 12 }}>Dùng từ kho phần ăn</Typography.Text>
                                </Stack>
                                <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                                    Còn {stock.fresh} phần mới nấu · {stock.leftover} phần dư
                                </Typography.Text>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 150px)', gap: 8, alignItems: 'flex-end' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Loại phần dùng</Typography.Text>
                                        {bothKinds ? (
                                            <Segmented
                                                value={chosenKind}
                                                onChange={value => _setConsumeKind(dishId, value as DishServingKind)}
                                                options={[{ label: 'Mới nấu', value: 'fresh' }, { label: 'Phần dư', value: 'leftover' }]}
                                                block
                                            />
                                        ) : (
                                            <Tag color={chosenKind === 'fresh' ? 'volcano' : 'gold'} style={{ marginInlineEnd: 0 }}>{chosenKind === 'fresh' ? 'Mới nấu' : 'Phần dư'}</Tag>
                                        )}
                                    </div>
                                    <div>
                                        <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Số phần dùng (phần)</Typography.Text>
                                        <NumberStepper min={0} max={maxForKind} step={0.5} value={count} onChange={value => _setConsumeCount(dishId, Number(value ?? 0))} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>;
                        })()}
                        {showFeedbackSection && members.length > 0 && <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                            <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Mọi người thấy sao?</Typography.Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {members.map(member => <div key={member.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 132px', gap: 8, alignItems: 'center' }}>
                                    <Typography.Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</Typography.Text>
                                    <Select
                                        size='small'
                                        allowClear
                                        value={feedback[dishId]?.[member.id]}
                                        placeholder='Chọn'
                                        style={{ width: '100%' }}
                                        onChange={value => _setFeedback(dishId, member.id, value)}
                                        options={feedbackOptions}
                                    />
                                </div>)}
                            </div>
                        </div>}
                    </Box>;
                })}
                <Button fullwidth type='primary' icon={<CheckCircleOutlined />} onClick={_save}>{enabledCount > 0 ? `Lưu ${enabledCount} món còn lại` : 'Hoàn tất, không còn dư'}</Button>
            </div>}
        </DeferredModalContent>
    </Modal>;
};
