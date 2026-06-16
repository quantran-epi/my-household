import { Button } from "@components/Button";
import { DatePicker } from "@components/Form/DatePicker";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { useMessage } from "@components/Message";
import { Sheet } from "@components/Sheet";
import { Typography } from "@components/Typography";
import { DishScorer, ScoredDish } from "@modules/DishSuggester/Helpers/DishScorer";
import { nanoid } from "@reduxjs/toolkit";
import { RootRoutes } from "@routing/RootRoutes";
import { Dishes } from "@store/Models/Dishes";
import { ScheduledMeal } from "@store/Models/ScheduledMeal";
import { addScheduledMeal } from "@store/Reducers/ScheduledMealReducer";
import { completeWizard } from "@store/Reducers/WizardReducer";
import { selectDishes, selectWizardAnswers } from "@store/Selectors";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ACCENT_FULL = "#389e0d";
const ACCENT_PARTIAL = "#d48806";
const ACCENT_LOW = "#d46b08";

type ResultRowProps = {
    dish: Dishes;
    meta?: { matched: number; missing: number; accent: string; label: string };
    onAddToday: () => void;
    onPickDay: () => void;
};

const ResultRow: React.FunctionComponent<ResultRowProps> = ({ dish, meta, onAddToday, onPickDay }) => {
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
            {`${meta.matched} đủ · ${meta.missing} thiếu`}
        </Typography.Text>}
        <Stack gap={8} style={{ marginTop: 4 }}>
            <Button
                type="primary"
                data-testid={`wizard-add-today-${dish.id}`}
                onClick={onAddToday}
                style={{ borderRadius: 20, paddingInline: 20 }}
            >
                Thêm vào hôm nay
            </Button>
            <Button
                onClick={onPickDay}
                style={{ borderRadius: 20, paddingInline: 20 }}
            >
                Chọn ngày khác
            </Button>
        </Stack>
    </Box>;
};

const scoredMeta = (item: ScoredDish): ResultRowProps["meta"] => {
    const matchPercent = Math.round(item.score * 100);
    const accent = matchPercent >= 100 ? ACCENT_FULL : matchPercent >= 50 ? ACCENT_PARTIAL : ACCENT_LOW;
    const label = matchPercent >= 100 ? "Đủ đồ" : matchPercent >= 50 ? "Gần đủ" : "Cần mua";
    return {
        matched: item.matchedIngredientIds.length,
        missing: item.missingIngredientIds.length,
        accent,
        label,
    };
};

export const WizardResult: React.FunctionComponent = () => {
    const dishes = useSelector(selectDishes);
    const answers = useSelector(selectWizardAnswers);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const message = useMessage();
    const ids = answers.selectedIngredientIds ?? [];

    const [pickerDish, setPickerDish] = useState<Dishes | null>(null);
    const [pickedDate, setPickedDate] = useState<Dayjs>(dayjs());

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
        message.success("Đã thêm vào thực đơn");
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
                Chưa có món nào
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
                Thêm món đầu tiên để bắt đầu lên thực đơn.
            </Typography.Text>
            <Button
                type="primary"
                onClick={() => navigate(RootRoutes.AuthorizedRoutes.DishesRoutes.List())}
                style={{ borderRadius: 20, paddingInline: 20 }}
            >
                Thêm món đầu tiên
            </Button>
        </Box>;
    }

    // (a) MATCHES — scorer output is already sorted; do NOT re-sort.
    const scored = DishScorer.score(dishes, ids, dishes);
    const hasMatches = ids.length > 0 && scored.length > 0;

    return <Box
        data-testid="wizard-step-result"
        style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}
    >
        {hasMatches
            ? scored.slice(0, 5).map(item => (
                <ResultRow
                    key={item.dish.id}
                    dish={item.dish}
                    meta={scoredMeta(item)}
                    onAddToday={() => addDishToDay(item.dish, new Date())}
                    onPickDay={() => openDayPicker(item.dish)}
                />
            ))
            // (b) FULL-CATALOG FALLBACK — friendly suggestion, neutral tone, never a red error.
            : <>
                <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
                    Chưa có món khớp — đây là vài gợi ý từ toàn bộ món của bạn
                </Typography.Text>
                {dishes.slice(0, 5).map(dish => (
                    <ResultRow
                        key={dish.id}
                        dish={dish}
                        onAddToday={() => addDishToDay(dish, new Date())}
                        onPickDay={() => openDayPicker(dish)}
                    />
                ))}
            </>}

        <Sheet
            open={pickerDish !== null}
            title="Chọn ngày khác"
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
                <Button
                    type="primary"
                    onClick={confirmPickedDay}
                    style={{ borderRadius: 20, paddingInline: 20 }}
                >
                    Thêm vào ngày này
                </Button>
            </Stack>
        </Sheet>
    </Box>;
};
