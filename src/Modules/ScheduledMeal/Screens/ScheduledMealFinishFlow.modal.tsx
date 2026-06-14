import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, RestOutlined } from '@ant-design/icons';
import { Box } from '@components/Layout/Box';
import { Button } from '@components/Button';
import { Stack } from '@components/Layout/Stack';
import { useMessage } from '@components/Message';
import { DeferredModalContent, Modal } from '@components/Modal';
import { NumberStepper } from '@components/Form/NumberStepper';
import { Typography } from '@components/Typography';
import { ScheduledMeal, ScheduledMealSlotKey } from '@store/Models/ScheduledMeal';
import { setMealSlotEaten, setMealSlotActual, markSkipMeal } from '@store/Reducers/ScheduledMealReducer';
import { addLeftoverTrackerItem, consumeDishServings } from '@store/Reducers/AppContextReducer';
import { selectAvailableServingsByDishKind, selectDishNameById } from '@store/Selectors';
import { Input, Select } from 'antd';
import { Radio } from '@components/Form/Radio';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScheduledMealSlotStateHelper } from '../Helpers/ScheduledMealSlotStateHelper';

type ScheduledMealFinishFlowProps = {
    open: boolean;
    slot: ScheduledMealSlotKey;
    mealDate: Date;
    targets: ScheduledMeal[];     // the meal plans selected to finish, in order
    onClose: () => void;
};

type Branch = 'planned' | 'eatOut' | 'other';
type KindAmounts = { fresh: number; leftover: number };
type Stock = { fresh: number; leftover: number };

type SummaryEntry = {
    dishId: string;
    dishName: string;
    consumedFresh: number;
    consumedLeftover: number;
    newLeftover: number;        // fresh remainder converted to a new leftover record
    resultingAvailable: number;
    markedOnly: boolean;        // over-entry fallback — nothing consumed
};

const emptyStock = (): Stock => ({ fresh: 0, leftover: 0 });

// Default split of the planned serving across kinds: eat fresh first, then leftover.
const defaultEaten = (target: number, stock: Stock): KindAmounts => {
    const fresh = Math.min(target, stock.fresh);
    const leftover = Math.min(Math.max(0, target - fresh), stock.leftover);
    return { fresh, leftover };
};

export const ScheduledMealFinishFlow: React.FC<ScheduledMealFinishFlowProps> = ({ open, slot, mealDate, targets, onClose }) => {
    const dispatch = useDispatch();
    const message = useMessage();
    const dishNameById = useSelector(selectDishNameById);
    const servingsByDishKind = useSelector(selectAvailableServingsByDishKind);

    const [planIndex, setPlanIndex] = useState(0);
    const [step, setStep] = useState<'how' | 'detail'>('how');
    const [branch, setBranch] = useState<Branch>('planned');
    const [note, setNote] = useState('');
    const [plannedEaten, setPlannedEaten] = useState<Record<string, KindAmounts>>({});
    const [otherDishIds, setOtherDishIds] = useState<string[]>([]);
    const [otherEaten, setOtherEaten] = useState<Record<string, KindAmounts>>({});
    const [showSummary, setShowSummary] = useState(false);
    const [summary, setSummary] = useState<SummaryEntry[]>([]);

    const dateKey = useMemo(() => dayjs(mealDate).format('YYYY-MM-DD'), [mealDate]);
    const dishName = (id: string) => dishNameById.get(id) ?? id;
    const stockFor = (id: string): Stock => servingsByDishKind.get(id) ?? emptyStock();

    const currentPlan: ScheduledMeal | undefined = targets[planIndex];
    const plannedDishIds = useMemo(() => {
        if (!currentPlan) return [];
        return Array.from(new Set((currentPlan.meals?.[slot] ?? []).filter(Boolean)));
    }, [currentPlan, slot]);

    // Dishes that currently have any servings in stock — selectable for the "ate other" branch.
    const availableDishOptions = useMemo(() => {
        const result: Array<{ value: string; label: string }> = [];
        servingsByDishKind.forEach((stock, id) => {
            if (stock.fresh + stock.leftover > 0) result.push({ value: id, label: dishName(id) });
        });
        return result.sort((a, b) => a.label.localeCompare(b.label));
    }, [servingsByDishKind, dishNameById]);

    // Reset the whole flow when opened.
    useEffect(() => {
        if (!open) return;
        setPlanIndex(0);
        setShowSummary(false);
        setSummary([]);
    }, [open]);

    // (Re)initialise the per-plan inputs whenever we land on a plan.
    useEffect(() => {
        if (!open) return;
        const plan = targets[planIndex];
        setStep('how');
        setBranch('planned');
        setNote('');
        setOtherDishIds([]);
        setOtherEaten({});
        const next: Record<string, KindAmounts> = {};
        (plan?.meals?.[slot] ?? []).filter(Boolean).forEach(dishId => {
            const target = plan?.dishServings?.[dishId] ?? 0;
            next[dishId] = defaultEaten(target, stockFor(dishId));
        });
        setPlannedEaten(next);
    }, [open, planIndex, targets, slot]);

    const _setKind = (
        setter: React.Dispatch<React.SetStateAction<Record<string, KindAmounts>>>,
        dishId: string,
        kind: keyof KindAmounts,
        value: number,
    ) => {
        setter(current => ({
            ...current,
            [dishId]: { ...emptyStock(), ...current[dishId], [kind]: Math.max(0, value) },
        }));
    };

    // Per-dish: is the entered total beyond what's in stock for either kind?
    const isOverEntry = (dishId: string, eaten: KindAmounts): boolean => {
        const stock = stockFor(dishId);
        return eaten.fresh > stock.fresh || eaten.leftover > stock.leftover;
    };

    const activeDishIds = branch === 'planned' ? plannedDishIds : otherDishIds;
    const activeEaten = branch === 'planned' ? plannedEaten : otherEaten;
    const anyOverEntry = branch !== 'eatOut' && activeDishIds.some(id => isOverEntry(id, activeEaten[id] ?? emptyStock()));

    const _consumeDish = (meal: ScheduledMeal, dishId: string, eaten: KindAmounts): SummaryEntry => {
        const stock = stockFor(dishId);
        if (isOverEntry(dishId, eaten)) {
            return { dishId, dishName: dishName(dishId), consumedFresh: 0, consumedLeftover: 0, newLeftover: 0, resultingAvailable: stock.fresh + stock.leftover, markedOnly: true };
        }
        if (eaten.leftover > 0) dispatch(consumeDishServings({ dishId, portions: eaten.leftover, kind: 'leftover' }));
        if (eaten.fresh > 0) dispatch(consumeDishServings({ dishId, portions: eaten.fresh, kind: 'fresh' }));
        // Uneaten fresh becomes a brand-new leftover record (never merged with existing leftovers).
        const freshRemainder = stock.fresh - eaten.fresh;
        if (freshRemainder > 0) {
            dispatch(consumeDishServings({ dishId, portions: freshRemainder, kind: 'fresh' }));
            dispatch(addLeftoverTrackerItem({
                id: nanoid(10),
                dishId,
                dishName: dishName(dishId),
                portions: freshRemainder,
                storedAt: new Date().toISOString(),
                status: 'available',
                kind: 'leftover',
                scheduledMealId: meal.id,
                mealSlot: slot,
                mealDate: dateKey,
                mealTitle: meal.name,
            }));
        }
        const resultingAvailable = (stock.leftover - eaten.leftover) + freshRemainder;
        return { dishId, dishName: dishName(dishId), consumedFresh: eaten.fresh, consumedLeftover: eaten.leftover, newLeftover: freshRemainder, resultingAvailable, markedOnly: false };
    };

    const _confirmPlan = () => {
        const meal = currentPlan;
        if (!meal) return;
        const recordedAt = new Date().toISOString();
        const entries: SummaryEntry[] = [];

        if (branch === 'eatOut') {
            dispatch(markSkipMeal({ mealId: meal.id, slot, marker: { reason: 'eatOut', note: note.trim() || undefined, markedAt: recordedAt } }));
            dispatch(setMealSlotEaten({ mealId: meal.id, slot, eaten: true }));
        } else {
            activeDishIds.forEach(dishId => {
                entries.push(_consumeDish(meal, dishId, activeEaten[dishId] ?? emptyStock()));
            });
            dispatch(setMealSlotEaten({ mealId: meal.id, slot, eaten: true }));
            dispatch(setMealSlotActual({ mealId: meal.id, slot, record: { dishIds: activeDishIds, note: note.trim() || undefined, recordedAt } }));
        }

        setSummary(current => [...current, ...entries]);
        if (planIndex < targets.length - 1) setPlanIndex(planIndex + 1);
        else { setShowSummary(true); message.success('Đã hoàn tất bữa'); }
    };

    const _renderKindSteppers = (
        dishId: string,
        eaten: KindAmounts,
        setter: React.Dispatch<React.SetStateAction<Record<string, KindAmounts>>>,
    ) => {
        const stock = stockFor(dishId);
        const hasFresh = stock.fresh > 0;
        const hasLeftover = stock.leftover > 0;
        if (!hasFresh && !hasLeftover) {
            return <Typography.Text type="secondary" style={{ fontSize: 12 }}>Không còn phần trong kho — sẽ đánh dấu đã ăn, không trừ kho.</Typography.Text>;
        }
        return <Stack wrap="wrap" gap={10} style={{ width: '100%' }}>
            {hasFresh && <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4 }}>Mới nấu (còn {stock.fresh})</Typography.Text>
                <NumberStepper aria-label="phần mới nấu" min={0} value={eaten.fresh} onChange={next => _setKind(setter, dishId, 'fresh', Number(next ?? 0))} style={{ width: 132 }} />
            </div>}
            {hasLeftover && <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4 }}>Đồ dư (còn {stock.leftover})</Typography.Text>
                <NumberStepper aria-label="phần đồ dư" min={0} value={eaten.leftover} onChange={next => _setKind(setter, dishId, 'leftover', Number(next ?? 0))} style={{ width: 132 }} />
            </div>}
        </Stack>;
    };

    const _renderDishCard = (
        dishId: string,
        eaten: KindAmounts,
        setter: React.Dispatch<React.SetStateAction<Record<string, KindAmounts>>>,
        onRemove?: () => void,
    ) => {
        const over = isOverEntry(dishId, eaten);
        return <Box key={dishId} style={{ border: `1px solid ${over ? '#ffccc7' : 'rgba(15,23,42,0.08)'}`, borderRadius: 8, background: over ? '#fff2f0' : '#fff', padding: 11 }}>
            <Stack justify="space-between" align="center" gap={8} style={{ width: '100%', marginBottom: 8 }}>
                <Typography.Text strong style={{ minWidth: 0, color: '#111827', lineHeight: '19px', overflowWrap: 'anywhere' }}>{dishName(dishId)}</Typography.Text>
                {onRemove && <Typography.Link onClick={onRemove} style={{ fontSize: 12, color: '#cf1322' }}>Bỏ</Typography.Link>}
            </Stack>
            {_renderKindSteppers(dishId, eaten, setter)}
            {over && <Typography.Text style={{ display: 'block', color: '#cf1322', fontSize: 12, marginTop: 6 }}>Không đủ phần trong kho. Có thể vẫn đánh dấu hoàn tất mà không trừ kho.</Typography.Text>}
        </Box>;
    };

    const _addOtherDish = (id: string) => {
        if (!id || otherDishIds.includes(id)) return;
        const stock = stockFor(id);
        setOtherDishIds(current => [...current, id]);
        setOtherEaten(current => ({ ...current, [id]: defaultEaten(1, stock) }));
    };

    const _removeOtherDish = (id: string) => {
        setOtherDishIds(current => current.filter(value => value !== id));
        setOtherEaten(current => { const next = { ...current }; delete next[id]; return next; });
    };

    const slotLabel = ScheduledMealSlotStateHelper.getSlotLabel(slot);
    const branchLabel = branch === 'planned' ? 'Ăn đúng kế hoạch' : branch === 'eatOut' ? 'Ăn ngoài' : 'Ăn món khác';
    const confirmLabel = branch === 'eatOut'
        ? 'Hoàn tất'
        : anyOverEntry ? 'Vẫn đánh dấu hoàn tất (không trừ kho)' : 'Hoàn tất';

    return <Modal
        open={open}
        title={<Stack align="center" gap={8}><RestOutlined style={{ color: '#389e0d' }} /><span>{showSummary ? 'Tóm tắt' : `Hoàn tất ${slotLabel}`}</span></Stack>}
        onCancel={onClose}
        footer={showSummary
            ? (<Stack justify="flex-end" align="center" style={{ width: '100%' }}>
                <Button type="primary" onClick={onClose}>Xong</Button>
            </Stack>)
            : !currentPlan
                ? (<Stack justify="flex-end" align="center" style={{ width: '100%' }}>
                    <Button type="primary" onClick={onClose}>Đóng</Button>
                </Stack>)
                : (<Stack justify="space-between" align="center" gap={8} style={{ width: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{targets.length > 1 ? `Kế hoạch ${planIndex + 1}/${targets.length}` : ''}</Typography.Text>
                    {step === 'how'
                        ? <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => setStep('detail')}>Tiếp tục</Button>
                        : <Stack align="center" gap={8}>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => setStep('how')}>Quay lại</Button>
                            <Button type="primary" icon={<CheckCircleFilled />} onClick={_confirmPlan}>{confirmLabel}</Button>
                        </Stack>}
                </Stack>)}
        width="min(620px, calc(100vw - 24px))"
        destroyOnClose
    >
        <DeferredModalContent active={open} minHeight={240}>
            {showSummary ? (
                <Stack direction="column" align="stretch" gap={10}>
                    <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: '19px' }}>Đã ghi nhận bữa ăn xong. Dưới đây là những gì đã thay đổi với phần ăn của bạn.</Typography.Text>
                    {summary.length === 0
                        ? <Box style={{ border: '1px solid #91caff', borderRadius: 8, background: '#e6f4ff', padding: 11 }}>
                            <Typography.Text style={{ fontSize: 13, color: '#1677ff' }}>Bữa này ăn ngoài nên không có món nào bị trừ khỏi kho phần ăn.</Typography.Text>
                        </Box>
                        : summary.map((entry, index) => <Box key={`${entry.dishId}-${index}`} style={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, background: '#fff', padding: 11 }}>
                            <Typography.Text strong style={{ display: 'block', color: '#111827', lineHeight: '19px', overflowWrap: 'anywhere', marginBottom: 6 }}>{entry.dishName}</Typography.Text>
                            {entry.markedOnly
                                ? <Typography.Text style={{ fontSize: 13, color: '#d46b08', lineHeight: '18px' }}>Bạn ăn nhiều hơn số phần còn trong kho, nên đã đánh dấu là đã ăn mà không trừ kho.</Typography.Text>
                                : <Stack direction="column" align="stretch" gap={3}>
                                    {(entry.consumedFresh > 0 || entry.consumedLeftover > 0)
                                        ? <Typography.Text style={{ fontSize: 13, lineHeight: '18px' }}>Đã ăn {entry.consumedFresh + entry.consumedLeftover} phần{(entry.consumedFresh > 0 && entry.consumedLeftover > 0) ? ` (${entry.consumedFresh} phần mới nấu, ${entry.consumedLeftover} phần đồ dư)` : entry.consumedLeftover > 0 ? ' từ đồ dư' : ' mới nấu'}.</Typography.Text>
                                        : <Typography.Text style={{ fontSize: 13, lineHeight: '18px' }}>Không ăn phần nào trong bữa này.</Typography.Text>}
                                    {entry.newLeftover > 0 && <Typography.Text style={{ fontSize: 13, color: '#d46b08', lineHeight: '18px' }}>{entry.newLeftover} phần nấu thừa được lưu thành đồ dư để dùng sau.</Typography.Text>}
                                    <Typography.Text style={{ fontSize: 13, color: '#389e0d', lineHeight: '18px' }}>{entry.resultingAvailable > 0 ? `Còn ${entry.resultingAvailable} phần trong kho.` : 'Đã dùng hết, không còn phần nào trong kho.'}</Typography.Text>
                                </Stack>}
                        </Box>)}
                </Stack>
            ) : !currentPlan ? (
                <Box style={{ textAlign: 'center', padding: '26px 0' }}><Typography.Text type="secondary">Không có kế hoạch để hoàn tất.</Typography.Text></Box>
            ) : (
                <Stack direction="column" align="stretch" gap={14}>
                    <Box style={{
                        borderRadius: 12,
                        border: '1px solid rgba(56,158,13,0.18)',
                        background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 70%)',
                        padding: '14px 16px',
                    }}>
                        <Stack align="center" gap={10} style={{ marginBottom: 6 }}>
                            <span style={{ width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: '0 8px 18px rgba(56,158,13,0.18)', color: '#389e0d', fontSize: 19, flexShrink: 0 }}><RestOutlined /></span>
                            <div style={{ minWidth: 0 }}>
                                <Typography.Text style={{ display: 'block', color: '#389e0d', fontSize: 12, fontWeight: 800, lineHeight: '16px' }}>Hoàn tất {slotLabel}</Typography.Text>
                                <Typography.Text strong style={{ display: 'block', color: '#111827', fontSize: 18, lineHeight: '24px', overflowWrap: 'anywhere' }}>{currentPlan.name}</Typography.Text>
                            </div>
                        </Stack>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, lineHeight: '19px' }}>
                            Ghi lại bữa này đã ăn thế nào. App sẽ cập nhật kho phần ăn và lưu lại phần dư cho bạn.
                        </Typography.Text>
                    </Box>

                    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: '#94a3b8' }}>BƯỚC {step === 'how' ? '1' : '2'}/2</Typography.Text>

                    {step === 'how' ? <div>
                        <Typography.Text strong style={{ display: 'block', fontSize: 15, color: '#111827', marginBottom: 2 }}>Bạn đã ăn bữa này thế nào?</Typography.Text>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginBottom: 10 }}>Chọn một câu trả lời rồi bấm "Tiếp tục".</Typography.Text>
                        <Radio.Group
                            value={branch}
                            onChange={event => setBranch(event.target.value as Branch)}
                            style={{ width: '100%' }}
                        >
                        <Stack direction="column" align="stretch" gap={8} style={{ width: '100%' }}>
                            {([
                                { label: 'Đúng kế hoạch', description: 'Ăn đúng món đã lên kế hoạch cho bữa này', value: 'planned' },
                                { label: 'Ăn ngoài', description: 'Không nấu, không trừ kho phần ăn', value: 'eatOut' },
                                { label: 'Ăn món khác', description: 'Ăn món khác đang có trong kho phần ăn', value: 'other' },
                            ] as Array<{ label: string; description: string; value: Branch }>).map(option => {
                                const checked = branch === option.value;
                                return <Radio
                                    key={option.value}
                                    value={option.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        width: '100%',
                                        margin: 0,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: `1px solid ${checked ? '#389e0d' : 'rgba(15,23,42,0.12)'}`,
                                        background: checked ? '#f6ffed' : '#fff',
                                    }}
                                >
                                    <Typography.Text strong style={{ display: 'block', lineHeight: '18px' }}>{option.label}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>{option.description}</Typography.Text>
                                </Radio>;
                            })}
                        </Stack>
                        </Radio.Group>
                    </div> : <div>
                        <Box style={{ border: '1px solid rgba(15,23,42,0.08)', background: '#f8fafc', borderRadius: 8, padding: '8px 11px', marginBottom: 12 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Bạn đã chọn: <Typography.Text strong style={{ color: '#111827' }}>{branchLabel}</Typography.Text>
                            </Typography.Text>
                        </Box>

                        <Typography.Text strong style={{ display: 'block', fontSize: 15, color: '#111827', marginBottom: 2 }}>
                            {branch === 'eatOut' ? 'Thêm ghi chú nếu cần' : 'Bạn đã ăn bao nhiêu phần?'}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginBottom: 10 }}>
                            {branch === 'planned'
                                ? 'Nhập số phần mỗi món đã ăn. Phần mới nấu còn dư sẽ tự lưu thành đồ dư.'
                                : branch === 'eatOut'
                                    ? 'Bữa này ăn ngoài nên app sẽ không động vào kho phần ăn. Bấm "Hoàn tất" để ghi nhận.'
                                    : 'Chọn món đã ăn từ kho phần ăn và nhập số phần để app trừ kho cho đúng.'}
                        </Typography.Text>

                        {branch === 'planned' && <Stack direction="column" align="stretch" gap={8}>
                            {plannedDishIds.length === 0
                                ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>Bữa này chưa có món đã lên kế hoạch.</Typography.Text>
                                : plannedDishIds.map(dishId => _renderDishCard(dishId, plannedEaten[dishId] ?? emptyStock(), setPlannedEaten))}
                        </Stack>}

                        {branch === 'eatOut' && <Stack direction="column" align="stretch" gap={8}>
                            <Input.TextArea value={note} onChange={event => setNote(event.target.value)} autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Ghi chú (tuỳ chọn) — ví dụ: ăn nhà ngoại" />
                        </Stack>}

                        {branch === 'other' && <Stack direction="column" align="stretch" gap={8}>
                            {availableDishOptions.length === 0
                                ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>Không có món nào còn phần trong kho để chọn.</Typography.Text>
                                : <Select
                                    value={null}
                                    onChange={value => value && _addOtherDish(value)}
                                    placeholder="Thêm món đã ăn"
                                    showSearch
                                    optionFilterProp="label"
                                    style={{ width: '100%' }}
                                    options={availableDishOptions.filter(option => !otherDishIds.includes(option.value))}
                                />}
                            {otherDishIds.map(dishId => _renderDishCard(dishId, otherEaten[dishId] ?? emptyStock(), setOtherEaten, () => _removeOtherDish(dishId)))}
                            <Input.TextArea value={note} onChange={event => setNote(event.target.value)} autoSize={{ minRows: 1, maxRows: 3 }} placeholder="Ghi chú (tuỳ chọn)" />
                        </Stack>}

                        {anyOverEntry && <Box style={{ border: '1px solid #ffd591', background: '#fff7e6', borderRadius: 8, padding: 10, marginTop: 10 }}>
                            <Stack align="center" gap={6}><CheckCircleFilled style={{ color: '#d46b08' }} /><Typography.Text style={{ fontSize: 12, color: '#ad4e00' }}>Một số món vượt quá phần còn trong kho — sẽ chỉ đánh dấu hoàn tất, không trừ kho cho các món đó.</Typography.Text></Stack>
                        </Box>}
                    </div>}
                </Stack>
            )}
        </DeferredModalContent>
    </Modal>;
};
