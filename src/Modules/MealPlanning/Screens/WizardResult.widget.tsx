import { Button } from "@components/Button";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { Typography } from "@components/Typography";
import { DishScorer, ScoredDish } from "@modules/DishSuggester/Helpers/DishScorer";
import { RootRoutes } from "@routing/RootRoutes";
import { Dishes } from "@store/Models/Dishes";
import { selectDishes, selectWizardAnswers } from "@store/Selectors";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ACCENT_FULL = "#389e0d";
const ACCENT_PARTIAL = "#d48806";
const ACCENT_LOW = "#d46b08";

type ResultRowProps = {
    dish: Dishes;
    meta?: { matched: number; missing: number; accent: string; label: string };
};

const ResultRow: React.FunctionComponent<ResultRowProps> = ({ dish, meta }) => {
    return <Box
        data-testid={`wizard-result-item-${dish.id}`}
        style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
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
    const ids = answers.selectedIngredientIds ?? [];

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
                <ResultRow key={item.dish.id} dish={item.dish} meta={scoredMeta(item)} />
            ))
            // (b) FULL-CATALOG FALLBACK — friendly suggestion, neutral tone, never a red error.
            : <>
                <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
                    Chưa có món khớp — đây là vài gợi ý từ toàn bộ món của bạn
                </Typography.Text>
                {dishes.slice(0, 5).map(dish => (
                    <ResultRow key={dish.id} dish={dish} />
                ))}
            </>}
    </Box>;
};
