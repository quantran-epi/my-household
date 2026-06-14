import { CheckCircleFilled, CommentOutlined, FireOutlined, MoreOutlined, RestOutlined, ShopOutlined, TeamOutlined } from '@ant-design/icons';
import { Button } from '@components/Button';
import { Dropdown } from '@components/Dropdown';
import { Image } from '@components/Image';
import { Box } from '@components/Layout/Box';
import { Stack } from '@components/Layout/Stack';
import { DeferredModalContent, Modal } from '@components/Modal';
import { Typography } from '@components/Typography';
import type { CookingMealFeedbackSlot } from '@store/Models/CookingSession';
import { ScheduledMeal, ScheduledMealSlotKey } from '@store/Models/ScheduledMeal';
import { selectAvailableServingsByDishKind, selectDishNameById, selectHouseholdMembers, selectLeftoverTrackerItems } from '@store/Selectors';
import { Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MorningIcon from '../../../../assets/icons/sunrise.png';
import NightIcon from '../../../../assets/icons/night.png';
import NoonIcon from '../../../../assets/icons/time.png';
import { ScheduledMealSlotStateHelper } from '../Helpers/ScheduledMealSlotStateHelper';
import { MealCompletionLeftoverModal, ScheduledMealCookingModal, getScheduledMealDishIds } from './ScheduledMealCooking.widget';
import { MemberDishFeedbackHistoryWidget } from './MemberDishFeedbackHistory.widget';
import { ScheduledMealScopePrompt, ScopeOption } from './ScheduledMealScopePrompt.modal';
import { ScheduledMealFinishFlow } from './ScheduledMealFinishFlow.modal';

export type SlotMeta = { label: string; icon: string; color: string; background: string; border: string };

export const SLOT_META: Record<ScheduledMealSlotKey, SlotMeta> = {
    breakfast: { label: 'Bữa sáng', icon: MorningIcon, color: '#d48806', background: '#fffbe6', border: '#ffe58f' },
    lunch: { label: 'Bữa trưa', icon: NoonIcon, color: '#d46b08', background: '#fff7e6', border: '#ffd591' },
    dinner: { label: 'Bữa tối', icon: NightIcon, color: '#531dab', background: '#f9f0ff', border: '#efdbff' },
};

type ScheduledMealSlotDetailModalProps = {
    open: boolean;
    date: Date;
    slot: ScheduledMealSlotKey;
    meals: ScheduledMeal[];     // all meal plans for the day
    initialAction?: 'cook' | 'finish';   // auto-open the scope prompt for this flow when entered from a card button
    onClose: () => void;
};

// One dish pooled across every plan in this slot — summed planned servings + the members it covers.
type MergedDish = {
    dishId: string;
    plannedServings: number;
    hasServing: boolean;
    memberIds: Set<string>;
    forEveryone: boolean;
};

const sectionTitleStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 };

export const ScheduledMealSlotDetailModal: React.FC<ScheduledMealSlotDetailModalProps> = ({ open, date, slot, meals, initialAction, onClose }) => {
    const dishNameById = useSelector(selectDishNameById);
    const householdMembers = useSelector(selectHouseholdMembers);
    const servingsByDishKind = useSelector(selectAvailableServingsByDishKind);
    const leftoverItems = useSelector(selectLeftoverTrackerItems);

    const [scopePromptOpen, setScopePromptOpen] = useState(false);
    const [scopeMode, setScopeMode] = useState<'cook' | 'finish'>('cook');
    const [cookingOpen, setCookingOpen] = useState(false);
    const [cookingToken, setCookingToken] = useState(0);
    const [cookDishIds, setCookDishIds] = useState<string[]>([]);
    const [finishOpen, setFinishOpen] = useState(false);
    const [finishTargets, setFinishTargets] = useState<ScheduledMeal[]>([]);
    const [bulkFeedbackOpen, setBulkFeedbackOpen] = useState(false);

    const meta = SLOT_META[slot];
    const slotForFeedback = slot as CookingMealFeedbackSlot;
    const memberNameById = useMemo(() => new Map(householdMembers.map(member => [member.id, member.name])), [householdMembers]);
    const leftoverById = useMemo(() => new Map(leftoverItems.map(item => [item.id, item])), [leftoverItems]);

    // Plans that actually touch this slot (planned or skipped), newest first to match the day view.
    const slotItems = useMemo(() => meals
        .filter(meal => ScheduledMealSlotStateHelper.getSlotState(meal, slot) !== 'empty'),
        [meals, slot]);

    // Non-skipped plans that have dishes planned for this slot — the finish-flow + cook targets.
    const plannedItems = useMemo(
        () => slotItems.filter(meal => ScheduledMealSlotStateHelper.getSlotState(meal, slot) === 'planned'),
        [slotItems, slot],
    );

    const allDishIds = useMemo(() => getScheduledMealDishIds(plannedItems.flatMap(meal => meal.meals?.[slot] ?? [])), [plannedItems, slot]);

    // Pooled planned servings per dish across all non-skipped plans — used for the slot-wide cook.
    const allDishServings = useMemo(() => {
        const map: Record<string, number> = {};
        plannedItems.forEach(meal => {
            (meal.meals?.[slot] ?? []).forEach(dishId => {
                const serving = meal.dishServings?.[dishId];
                if (typeof serving === 'number') map[dishId] = (map[dishId] ?? 0) + serving;
            });
        });
        return map;
    }, [plannedItems, slot]);

    // Pooled dish list across every non-skipped plan in this slot: sum servings, union members.
    const mergedDishes = useMemo(() => {
        const map = new Map<string, MergedDish>();
        plannedItems.forEach(meal => {
            const planForEveryone = !(meal.memberIds && meal.memberIds.length > 0);
            const planMembers = (meal.memberIds ?? []).filter(id => memberNameById.has(id));
            (meal.meals?.[slot] ?? []).forEach(dishId => {
                if (!dishId) return;
                const entry = map.get(dishId) ?? { dishId, plannedServings: 0, hasServing: false, memberIds: new Set<string>(), forEveryone: false };
                const serving = meal.dishServings?.[dishId];
                if (typeof serving === 'number') { entry.plannedServings += serving; entry.hasServing = true; }
                if (planForEveryone) entry.forEveryone = true;
                else planMembers.forEach(id => entry.memberIds.add(id));
                map.set(dishId, entry);
            });
        });
        return Array.from(map.values());
    }, [plannedItems, slot, memberNameById]);

    const skippedItems = useMemo(() => slotItems.filter(meal => ScheduledMealSlotStateHelper.getSlotState(meal, slot) === 'skipped'), [slotItems, slot]);

    // The slot is "done" once every planned plan has been marked eaten for this slot. A finished
    // slot is read-only: cook/finish actions are hidden and only feedback stays mutable.
    const slotFinished = useMemo(
        () => plannedItems.length > 0 && plannedItems.every(meal => Boolean(meal.eatenSlots?.[slot])),
        [plannedItems, slot],
    );

    const _dishName = (id: string) => dishNameById.get(id) ?? id;
    const _formatStock = (dishId: string): string | null => {
        const stock = servingsByDishKind.get(dishId);
        if (!stock) return null;
        const total = stock.fresh + stock.leftover;
        if (total <= 0) return null;
        if (stock.fresh > 0 && stock.leftover > 0) return `${stock.fresh} mới · ${stock.leftover} dư`;
        return `${total} phần`;
    };

    // Scope-prompt options depend on the mode: dishes for cook, meal plans for finish.
    const scopeOptions = useMemo<ScopeOption[]>(() => {
        if (scopeMode === 'cook') {
            return allDishIds.map(id => ({ value: id, label: _dishName(id) }));
        }
        return plannedItems.map(meal => ({
            value: meal.id,
            label: meal.name,
            description: `${(meal.meals?.[slot] ?? []).length} món`,
        }));
    }, [scopeMode, allDishIds, plannedItems, slot, dishNameById]);

    // Cook flow: which meal plans own the selected dishes (so the cooked flag covers them).
    const cookedMealIds = useMemo(() => {
        if (cookDishIds.length === 0) return [];
        const selected = new Set(cookDishIds);
        return plannedItems
            .filter(meal => (meal.meals?.[slot] ?? []).some(id => selected.has(id)))
            .map(meal => meal.id);
    }, [cookDishIds, plannedItems, slot]);

    const cookDishServings = useMemo(() => {
        const map: Record<string, number> = {};
        cookDishIds.forEach(id => { if (allDishServings[id] != null) map[id] = allDishServings[id]; });
        return map;
    }, [cookDishIds, allDishServings]);

    const _openScope = (mode: 'cook' | 'finish') => {
        setScopeMode(mode);
        setScopePromptOpen(true);
    };

    // When entered from a card button, auto-open the requested flow's scope prompt once.
    // A finished slot is read-only, so never auto-open cook/finish there.
    useEffect(() => {
        if (open && initialAction && !slotFinished) _openScope(initialAction);
    }, [open, initialAction, slotFinished]);

    const _onScopeConfirm = (values: string[]) => {
        setScopePromptOpen(false);
        if (scopeMode === 'cook') {
            setCookDishIds(getScheduledMealDishIds(values));
            setCookingToken(Date.now());
            setCookingOpen(true);
        } else {
            const byId = new Map(plannedItems.map(meal => [meal.id, meal]));
            setFinishTargets(values.map(id => byId.get(id)).filter(Boolean) as ScheduledMeal[]);
            setFinishOpen(true);
        }
    };

    // ─── Reality lines per plan: eat-out / leftover used / actual dishes / ate-as-planned ──────
    const _realityForMeal = (meal: ScheduledMeal): React.ReactNode => {
        const skipMarker = meal.skipMeals?.[slot];
        const actual = meal.actualMeals?.[slot];
        if (skipMarker?.reason === 'eatOut') {
            return <Stack direction="column" align="stretch" gap={4}>
                <Stack align="center" gap={6}><ShopOutlined style={{ color: '#1677ff' }} /><Typography.Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>Ăn ngoài</Typography.Text></Stack>
                {skipMarker.note && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{skipMarker.note}</Typography.Text>}
            </Stack>;
        }
        if (skipMarker?.reason === 'leftover') {
            const ids = skipMarker.leftoverItemIds ?? [];
            return <Stack direction="column" align="stretch" gap={5}>
                <Stack align="center" gap={6}><RestOutlined style={{ color: '#389e0d' }} /><Typography.Text style={{ fontSize: 12, color: '#389e0d', fontWeight: 600 }}>Dùng phần dư</Typography.Text></Stack>
                {ids.length > 0 ? <Stack wrap="wrap" gap={5}>
                    {ids.map(id => {
                        const item = leftoverById.get(id);
                        const used = skipMarker.leftoverServings?.[id] ?? 1;
                        return <Tag key={id} color="green" style={{ marginInlineEnd: 0, fontSize: 11, borderRadius: 999 }}>{item?.dishName ?? 'Phần dư'} · {used} phần</Tag>;
                    })}
                </Stack> : <Typography.Text type="secondary" style={{ fontSize: 12 }}>Không ghi nhận phần dư cụ thể</Typography.Text>}
                {skipMarker.note && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{skipMarker.note}</Typography.Text>}
            </Stack>;
        }
        if (actual) {
            return <Stack direction="column" align="stretch" gap={5}>
                <Stack align="center" gap={6}><CheckCircleFilled style={{ color: '#52c41a' }} /><Typography.Text style={{ fontSize: 12, color: '#389e0d', fontWeight: 600 }}>Đã ăn món khác</Typography.Text></Stack>
                <Stack wrap="wrap" gap={5}>
                    {actual.dishIds.map((id, index) => <Tag key={`${id}-${index}`} style={{ marginInlineEnd: 0, fontSize: 11, borderRadius: 999 }}>{_dishName(id)}</Tag>)}
                </Stack>
                {actual.note && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{actual.note}</Typography.Text>}
            </Stack>;
        }
        if (meal.eatenSlots?.[slot]) {
            return <Stack align="center" gap={6}><CheckCircleFilled style={{ color: '#52c41a' }} /><Typography.Text style={{ fontSize: 12, color: '#389e0d' }}>Đã ăn đúng kế hoạch</Typography.Text></Stack>;
        }
        return <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chưa ghi nhận thực tế</Typography.Text>;
    };

    // Launched straight into a flow from a card button: skip the detail shell and show only the
    // flow sub-modals. Cancelling/closing the flow returns all the way out via onClose.
    const directAction = Boolean(initialAction);

    return <React.Fragment>
        <Modal
            open={open && !directAction}
            title={<Stack align="center" gap={8}>
                <Image src={meta.icon} preview={false} width={20} style={{ marginBottom: 2 }} />
                <span>{meta.label} · {moment(date).format('DD/MM/YYYY')}</span>
            </Stack>}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            width="min(680px, calc(100vw - 24px))"
            style={{ top: 36 }}
            bodyStyle={{ width: '100%', boxSizing: 'border-box' }}
            headerActions={allDishIds.length > 0 ? <Dropdown
                placement="bottomRight"
                trigger={['click']}
                menu={{
                    items: [
                        { key: 'feedback', label: 'Phản hồi cả bữa', icon: <CommentOutlined /> },
                    ],
                    onClick: ({ key }) => {
                        if (key === 'feedback') setBulkFeedbackOpen(true);
                    },
                }}
            >
                <Button aria-label="Thao tác cả bữa" type="text" icon={<MoreOutlined />} style={{ width: 32, height: 32, paddingInline: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />
            </Dropdown> : undefined}
        >
            <DeferredModalContent active={open} minHeight={200}>
                {slotItems.length === 0 ? <Box style={{ textAlign: 'center', padding: '26px 0' }}>
                    <Typography.Text type="secondary">Chưa có kế hoạch cho {meta.label.toLowerCase()} hôm nay.</Typography.Text>
                </Box> : <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                    <Box style={{ border: `1px solid ${meta.border}`, borderRadius: 8, background: meta.background, padding: '9px 11px' }}>
                        <Typography.Text style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
                            {allDishIds.length} món · {slotItems.length} kế hoạch
                        </Typography.Text>
                    </Box>

                    {/* Guided actions — start cooking / finish meal. Hidden once the slot is finished. */}
                    {slotFinished ? (
                        <Box style={{ border: '1px solid #b7eb8f', borderRadius: 8, background: '#f6ffed', padding: '10px 12px' }}>
                            <Stack align="center" gap={8}>
                                <CheckCircleFilled style={{ color: '#52c41a' }} />
                                <Typography.Text style={{ fontSize: 13, color: '#389e0d', fontWeight: 600 }}>Đã hoàn tất bữa này. Bạn vẫn có thể ghi phản hồi bên dưới.</Typography.Text>
                            </Stack>
                        </Box>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <Button type="primary" icon={<FireOutlined />} disabled={allDishIds.length === 0} onClick={() => _openScope('cook')} style={{ justifyContent: 'center', borderRadius: 8, background: '#fa8c16', borderColor: '#fa8c16' }}>
                                Bắt đầu nấu
                            </Button>
                            <Button type="primary" icon={<RestOutlined />} disabled={plannedItems.length === 0} onClick={() => _openScope('finish')} style={{ justifyContent: 'center', borderRadius: 8, background: '#389e0d', borderColor: '#389e0d' }}>
                                Hoàn tất bữa
                            </Button>
                        </div>
                    )}

                    {/* Section 1 — merged planned dishes across all plans */}
                    <div>
                        <Typography.Text style={sectionTitleStyle}>Món đã lên kế hoạch</Typography.Text>
                        {mergedDishes.length === 0 ? (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Chưa có món nào được lên kế hoạch.</Typography.Text>
                        ) : <Stack direction="column" align="stretch" gap={8}>
                            {mergedDishes.map(dish => {
                                const stock = _formatStock(dish.dishId);
                                const memberIds = Array.from(dish.memberIds);
                                return <Box key={dish.dishId} style={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fff', padding: 11 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'start' }}>
                                        <Typography.Text strong style={{ minWidth: 0, color: '#111827', lineHeight: '19px', overflowWrap: 'anywhere' }}>{_dishName(dish.dishId)}</Typography.Text>
                                        <Stack wrap="wrap" gap={5} justify="flex-end">
                                            {dish.hasServing && <Tag color="blue" style={{ marginInlineEnd: 0, fontSize: 11, borderRadius: 999 }}>{dish.plannedServings} phần</Tag>}
                                            <Tag color={stock ? 'green' : 'default'} style={{ marginInlineEnd: 0, fontSize: 11, borderRadius: 999 }}>{stock ? `còn ${stock}` : 'hết phần'}</Tag>
                                        </Stack>
                                    </div>
                                    <Stack wrap="wrap" gap={5} style={{ marginTop: 8 }}>
                                        {dish.forEveryone
                                            ? <Tag icon={<TeamOutlined />} style={{ marginInlineEnd: 0, fontSize: 11 }}>Cả nhà</Tag>
                                            : memberIds.length === 0
                                                ? <Tag icon={<TeamOutlined />} style={{ marginInlineEnd: 0, fontSize: 11 }}>Cả nhà</Tag>
                                                : memberIds.map(id => <Tag key={id} color="purple" style={{ marginInlineEnd: 0, fontSize: 11 }}>{memberNameById.get(id)}</Tag>)}
                                    </Stack>
                                </Box>;
                            })}
                        </Stack>}
                        {skippedItems.length > 0 && <Stack wrap="wrap" gap={5} style={{ marginTop: 8 }}>
                            {skippedItems.map(meal => {
                                const skipMeta = meal.skipMeals?.[slot] ? ScheduledMealSlotStateHelper.getReasonMeta(meal.skipMeals[slot]!.reason) : undefined;
                                return skipMeta ? <Tag key={meal.id} style={{ marginInlineEnd: 0, fontSize: 11, color: skipMeta.color, borderColor: skipMeta.border, background: skipMeta.background }}>{meal.name} · {skipMeta.label}</Tag> : null;
                            })}
                        </Stack>}
                    </div>

                    {/* Section 2 — Reality */}
                    <div>
                        <Typography.Text style={sectionTitleStyle}>Thực tế đã ăn</Typography.Text>
                        <Stack direction="column" align="stretch" gap={8}>
                            {slotItems.map(meal => <Box key={meal.id} style={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fbfbfb', padding: 11 }}>
                                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 6, overflowWrap: 'anywhere' }}>{meal.name}</Typography.Text>
                                {_realityForMeal(meal)}
                            </Box>)}
                        </Stack>
                    </div>

                    {/* Section 3 — Feedback */}
                    <div>
                        <Typography.Text style={sectionTitleStyle}>Phản hồi trong ngày</Typography.Text>
                        <MemberDishFeedbackHistoryWidget lockedDate={date} compact maxRows={6} />
                    </div>
                </div>}
            </DeferredModalContent>
        </Modal>

        <ScheduledMealScopePrompt
            open={scopePromptOpen}
            mode={scopeMode}
            slotLabel={meta.label.toLowerCase()}
            options={scopeOptions}
            onConfirm={_onScopeConfirm}
            onClose={() => { setScopePromptOpen(false); if (directAction) onClose(); }}
        />

        <ScheduledMealCookingModal
            open={cookingOpen}
            title={`Nấu ${meta.label.toLowerCase()}`}
            dishIds={cookDishIds}
            dishServings={cookDishServings}
            autoStartToken={cookingToken}
            mealSlot={slotForFeedback}
            mealDate={date}
            cookedMealIds={cookedMealIds}
            onClose={() => { setCookingOpen(false); if (directAction) onClose(); }}
        />

        <ScheduledMealFinishFlow
            open={finishOpen}
            slot={slot}
            mealDate={date}
            targets={finishTargets}
            onClose={() => { setFinishOpen(false); if (directAction) onClose(); }}
        />

        {/* Bulk feedback for the whole slot — ratings + actual-eaten only, day+slot scoped. */}
        <MealCompletionLeftoverModal
            open={bulkFeedbackOpen}
            title={`Phản hồi ${meta.label.toLowerCase()}`}
            dishIds={allDishIds}
            mealSlot={slotForFeedback}
            mealDate={date}
            mode="feedback"
            onClose={() => setBulkFeedbackOpen(false)}
        />
    </React.Fragment>;
};
