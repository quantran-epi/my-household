import { BarChartOutlined, CheckCircleOutlined, FrownOutlined, HistoryOutlined, MehOutlined, PieChartOutlined, SmileOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { DishNutritionHelper, DishNutritionIngredientContribution, DishNutritionNutrientKey } from "@common/Helpers/DishNutritionHelper";
import { DishServingHelper } from "@common/Helpers/DishServingHelper";
import { MealFeedbackTitleHelper } from "@common/Helpers/MealFeedbackTitleHelper";
import { Button } from "@components/Button";
import { Empty } from "@components/Empty";
import { Box } from "@components/Layout/Box";
import { Space } from "@components/Layout/Space";
import { Stack } from "@components/Layout/Stack";
import { DeferredModalContent, Modal } from "@components/Modal";
import { Tag } from "@components/Tag";
import { Tooltip } from "@components/Tootip";
import { Typography } from "@components/Typography";
import { CookingMealFeedbackHistoryRecord, CookingSession, CookingSessionMemberFeedback } from "@store/Models/CookingSession";
import { Dishes } from "@store/Models/Dishes";
import { selectCookingSessions, selectCookTimeStats, selectDishFeedbackHistory, selectDishes, selectHouseholdMembers, selectIngredientsById } from "@store/Selectors";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

type DishesNutritionUsageModalProps = {
    dish: Dishes;
    open: boolean;
    onClose: () => void;
}

type NutrientMetric = {
    key: DishNutritionNutrientKey;
    label: string;
    color: string;
    format: (value?: number) => string;
}

type FeedbackCount = Record<CookingSessionMemberFeedback, number>;

type FeedbackSummaryItem = {
    value: CookingSessionMemberFeedback;
    icon: React.ReactNode;
    color: string;
    background: string;
    border: string;
}

const nutrientMetrics: NutrientMetric[] = [
    { key: "calories", label: "Năng lượng", color: "#7436dc", format: DishNutritionHelper.formatCalories },
    { key: "protein", label: "Đạm", color: "#1677ff", format: DishNutritionHelper.formatGram },
    { key: "carbs", label: "Tinh bột", color: "#fa8c16", format: DishNutritionHelper.formatGram },
    { key: "fat", label: "Chất béo", color: "#d46b08", format: DishNutritionHelper.formatGram },
    { key: "fiber", label: "Chất xơ", color: "#389e0d", format: DishNutritionHelper.formatGram },
    { key: "sodium", label: "Natri", color: "#13a8a8", format: DishNutritionHelper.formatMilligram },
];

const feedbackLabelByValue: Record<CookingSessionMemberFeedback, string> = {
    liked: "Thích",
    neutral: "Ổn",
    disliked: "Không hợp",
};

const feedbackColorByValue: Record<CookingSessionMemberFeedback, string> = {
    liked: "green",
    neutral: "blue",
    disliked: "volcano",
};

const feedbackSummaryItems: FeedbackSummaryItem[] = [
    { value: "liked", icon: <SmileOutlined />, color: "#389e0d", background: "#f6ffed", border: "#b7eb8f" },
    { value: "neutral", icon: <MehOutlined />, color: "#1677ff", background: "#e6f4ff", border: "#91caff" },
    { value: "disliked", icon: <FrownOutlined />, color: "#cf1322", background: "#fff1f0", border: "#ffa39e" },
];

const sectionStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 8,
    background: "#fff",
    padding: 12,
};

const statGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
    gap: 8,
};

const metricCardStyle: React.CSSProperties = {
    border: "1px solid #f0f0f0",
    borderRadius: 8,
    background: "#fafafa",
    padding: "8px 9px",
    minWidth: 0,
};

const rowCardStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.07)",
    borderRadius: 8,
    background: "#fff",
    padding: "8px 9px",
    minWidth: 0,
};

const formatDateTime = (iso?: string): string => {
    if (!iso) return "-";
    const date = dayjs(iso);
    return date.isValid() ? date.format("DD/MM/YYYY HH:mm") : "-";
};

const formatDate = (iso?: string): string => {
    if (!iso) return "-";
    const date = dayjs(iso);
    return date.isValid() ? date.format("DD/MM/YYYY") : "-";
};

const getSessionDate = (session: CookingSession): string => session.finishedAt ?? session.startedAt;

const getDurationMinutes = (session: CookingSession): number | null => {
    if (!session.finishedAt) return null;
    const started = Date.parse(session.startedAt);
    const finished = Date.parse(session.finishedAt);
    if (!Number.isFinite(started) || !Number.isFinite(finished)) return null;
    const minutes = Math.max(0, Math.round((finished - started) / 60000));
    return minutes > 0 ? minutes : null;
};

const formatMinutes = (minutes?: number | null): string => {
    if (!minutes || minutes <= 0) return "-";
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
};

const average = (values: number[]): number | null => {
    if (values.length === 0) return null;
    return Math.round(values.reduce((total, item) => total + item, 0) / values.length);
};

const averageOneDecimal = (values: number[]): number | null => {
    if (values.length === 0) return null;
    return Math.round(values.reduce((total, item) => total + item, 0) / values.length * 10) / 10;
};

const formatAmount = (value?: number | null): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value % 1 === 0 ? String(value) : value.toFixed(1);
};

const MetricCard: React.FunctionComponent<{ label: string; value: React.ReactNode; detail?: React.ReactNode; color?: string }> = ({ label, value, detail, color = "#111827" }) => <Box style={metricCardStyle}>
    <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px" }}>{label}</Typography.Text>
    <Typography.Text strong style={{ display: "block", color, fontSize: 17, lineHeight: "22px", marginTop: 2, overflowWrap: "anywhere" }}>{value}</Typography.Text>
    {detail && <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginTop: 2, overflowWrap: "anywhere" }}>{detail}</Typography.Text>}
</Box>;

const SectionTitle: React.FunctionComponent<{ icon: React.ReactNode; title: string; subtitle?: string; extra?: React.ReactNode }> = ({ icon, title, subtitle, extra }) => <Stack justify="space-between" align="flex-start" gap={10} style={{ marginBottom: 10 }}>
    <Stack align="flex-start" gap={8} style={{ minWidth: 0 }}>
        <span style={{ color: "#1677ff", marginTop: 1 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ display: "block", color: "#111827", fontSize: 14, lineHeight: "19px" }}>{title}</Typography.Text>
            {subtitle && <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 2 }}>{subtitle}</Typography.Text>}
        </div>
    </Stack>
    {extra}
</Stack>;

const FeedbackSummaryCounter: React.FunctionComponent<{ item: FeedbackSummaryItem; count: number }> = ({ item, count }) => {
    const label = feedbackLabelByValue[item.value];

    return <Tooltip title={`${label}: ${count}`}>
        <span
            aria-label={`${label}: ${count}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                minHeight: 24,
                padding: "2px 7px",
                borderRadius: 999,
                border: `1px solid ${item.border}`,
                background: item.background,
                color: item.color,
                lineHeight: 1,
            }}
        >
            <span style={{ display: "inline-flex", fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
            <Typography.Text strong style={{ color: item.color, fontSize: 12, lineHeight: "16px" }}>{count}</Typography.Text>
        </span>
    </Tooltip>;
};

const ContributionRow: React.FunctionComponent<{ row: DishNutritionIngredientContribution; maxCalories: number }> = ({ row, maxCalories }) => {
    const calories = row.total.calories ?? 0;
    const percent = maxCalories > 0 ? Math.max(8, Math.round(calories / maxCalories * 100)) : 0;
    const status = row.missingReason === "nutrition" ? "Thiếu dinh dưỡng" : row.missingReason === "conversion" ? "Thiếu quy đổi" : null;

    return <Box style={rowCardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
            <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: "block", color: "#111827", fontSize: 13, lineHeight: "18px", overflowWrap: "anywhere" }}>{row.ingredientName}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "16px", marginTop: 1 }}>{row.amountLabel}</Typography.Text>
            </div>
            {status ? <Tag color="orange" style={{ marginRight: 0 }}>{status}</Tag> : <Tag color="purple" style={{ marginRight: 0 }}>{DishNutritionHelper.formatCalories(calories)}</Tag>}
        </div>
        {!status && <React.Fragment>
            <div style={{ height: 7, borderRadius: 999, background: "#f1f5f9", overflow: "hidden", marginTop: 7 }}>
                <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #7436dc, #1677ff)" }} />
            </div>
            <Space size={[6, 4]} wrap style={{ marginTop: 7 }}>
                <Tag color="blue" style={{ marginRight: 0 }}>Đạm {DishNutritionHelper.formatGram(row.total.protein)}</Tag>
                <Tag color="green" style={{ marginRight: 0 }}>Xơ {DishNutritionHelper.formatGram(row.total.fiber)}</Tag>
                <Tag color="orange" style={{ marginRight: 0 }}>Béo {DishNutritionHelper.formatGram(row.total.fat)}</Tag>
            </Space>
        </React.Fragment>}
    </Box>;
};

const UsageSessionRow: React.FunctionComponent<{ session: CookingSession; fallbackServings: number }> = ({ session, fallbackServings }) => {
    const isFinished = session.status === "finished";
    const servings = session.targetServings ?? session.baseServings ?? fallbackServings;
    return <Box style={{ ...rowCardStyle, background: isFinished ? "#f6ffed" : "#fff7e6", borderColor: isFinished ? "#b7eb8f" : "#ffd591" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
            <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: "block", color: "#111827", fontSize: 13, lineHeight: "18px" }}>{formatDateTime(getSessionDate(session))}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
                    {formatAmount(servings)} phần · {formatMinutes(getDurationMinutes(session))}
                </Typography.Text>
            </div>
            <Tag color={isFinished ? "success" : "warning"} style={{ marginRight: 0 }}>{isFinished ? "Hoàn tất" : "Đã hủy"}</Tag>
        </div>
    </Box>;
};

const FeedbackRow: React.FunctionComponent<{ record: CookingMealFeedbackHistoryRecord; memberNameById: Map<string, string> }> = ({ record, memberNameById }) => {
    const entries = Object.entries(record.memberFeedback ?? {}) as [string, CookingSessionMemberFeedback][];
    const slot = MealFeedbackTitleHelper.getSlotLabel(record.mealSlot, "short");
    const mealName = MealFeedbackTitleHelper.normalize(record.mealTitle, record.mealSlot, "short") || "Thực đơn";
    const subtitle = [mealName === slot ? null : slot, formatDate(record.mealDate)].filter(Boolean).join(" · ");

    return <Box style={rowCardStyle}>
        <Typography.Text strong style={{ display: "block", color: "#111827", fontSize: 13, lineHeight: "18px", overflowWrap: "anywhere" }}>{mealName}</Typography.Text>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>{subtitle}</Typography.Text>
        <Space size={[5, 5]} wrap style={{ marginTop: 7 }}>
            {entries.map(([memberId, reaction]) => <Tag key={`${record.id}-${memberId}`} color={feedbackColorByValue[reaction]} style={{ marginRight: 0 }}>
                {memberNameById.get(memberId) ?? "Thành viên"}: {feedbackLabelByValue[reaction]}
            </Tag>)}
        </Space>
    </Box>;
};

export const DishesNutritionUsageModal: React.FunctionComponent<DishesNutritionUsageModalProps> = ({ dish, open, onClose }) => {
    const allDishes = useSelector(selectDishes);
    const ingredientsById = useSelector(selectIngredientsById);
    const cookingSessions = useSelector(selectCookingSessions);
    const cookTimeStats = useSelector(selectCookTimeStats);
    const feedbackHistory = useSelector(selectDishFeedbackHistory);
    const householdMembers = useSelector(selectHouseholdMembers);
    const currentDish = useMemo(() => allDishes.find(item => item.id === dish.id) ?? dish, [allDishes, dish]);
    const baseServings = DishServingHelper.getBaseServings(currentDish);

    const nutrition = useMemo(() => DishNutritionHelper.calculateDishNutrition(currentDish, allDishes, ingredientsById), [currentDish, allDishes, ingredientsById]);
    const contributions = useMemo(() => DishNutritionHelper.calculateIngredientContributions(currentDish, allDishes, ingredientsById), [currentDish, allDishes, ingredientsById]);
    const topContributions = useMemo(() => contributions.slice().sort((a, b) => (b.total.calories ?? 0) - (a.total.calories ?? 0)).slice(0, 8), [contributions]);
    const maxContributionCalories = Math.max(1, ...topContributions.map(item => item.total.calories ?? 0));
    const missingNutritionNames = nutrition.missingNutritionIngredientIds.map(id => ingredientsById.get(id)?.name ?? id);
    const missingConversionNames = nutrition.missingConversionIngredientIds.map(id => ingredientsById.get(id)?.name ?? id);
    const sourceDescription = nutrition.sourceNames.length > 0
        ? `Dữ liệu dinh dưỡng lấy từ ${nutrition.sourceNames.length} nguồn: ${nutrition.sourceNames.join(", ")}.`
        : "Chưa có nguồn dữ liệu dinh dưỡng đã ghi cho món này.";

    const dishSessions = useMemo(() => cookingSessions
        .filter(session => session.dishId === currentDish.id && (session.status === "finished" || session.status === "cancelled"))
        .sort((a, b) => dayjs(getSessionDate(b)).valueOf() - dayjs(getSessionDate(a)).valueOf()), [cookingSessions, currentDish.id]);
    const finishedSessions = useMemo(() => dishSessions.filter(session => session.status === "finished"), [dishSessions]);
    const cancelledCount = dishSessions.length - finishedSessions.length;
    const lastFinished = finishedSessions[0];
    const lastFinishedDate = lastFinished ? getSessionDate(lastFinished) : undefined;
    const daysSinceLast = lastFinishedDate ? dayjs().startOf("day").diff(dayjs(lastFinishedDate).startOf("day"), "day") : null;
    const durationAverage = average(finishedSessions.map(getDurationMinutes).filter((value): value is number => typeof value === "number"));
    const learnedCookTime = cookTimeStats[currentDish.id]?.avgTotalMinutes ? Math.round(cookTimeStats[currentDish.id].avgTotalMinutes) : durationAverage;
    const servingAverage = averageOneDecimal(finishedSessions
        .map(session => session.targetServings ?? session.baseServings ?? baseServings)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0));

    const memberNameById = useMemo(() => new Map(householdMembers.map(member => [member.id, member.name])), [householdMembers]);
    const dishFeedbackRows = useMemo(() => feedbackHistory
        .filter(record => record.dishId === currentDish.id)
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()), [feedbackHistory, currentDish.id]);
    const feedbackCounts = useMemo(() => dishFeedbackRows.reduce((result, record) => {
        (Object.values(record.memberFeedback ?? {}) as CookingSessionMemberFeedback[]).forEach(reaction => {
            result[reaction] += 1;
        });
        return result;
    }, { liked: 0, neutral: 0, disliked: 0 } as FeedbackCount), [dishFeedbackRows]);
    const totalFeedback = feedbackCounts.liked + feedbackCounts.neutral + feedbackCounts.disliked;
    const recentFeedbackRows = dishFeedbackRows.slice(0, 5);

    return <Modal
        open={open}
        onCancel={onClose}
        footer={<Button onClick={onClose}>Đóng</Button>}
        width={880}
        destroyOnClose
        title={<Stack align="center" gap={8}>
            <PieChartOutlined style={{ color: "#7436dc" }} />
            <span>Dinh dưỡng & lịch sử dùng món</span>
        </Stack>}
    >
        <DeferredModalContent active={open} minHeight={280}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Box style={{ ...sectionStyle, background: "linear-gradient(135deg, #ffffff 0%, #f7f2ff 100%)" }}>
                    <Stack justify="space-between" align="flex-start" gap={10}>
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text strong style={{ display: "block", color: "#111827", fontSize: 18, lineHeight: "24px", overflowWrap: "anywhere" }}>{currentDish.name}</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 5 }}>Tính theo khẩu phần gốc: {baseServings} phần.</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 2 }}>Dữ liệu có cho {nutrition.coveredIngredientCount}/{nutrition.ingredientCount} nguyên liệu bắt buộc.</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 2, overflowWrap: "anywhere" }}>{sourceDescription}</Typography.Text>
                        </div>
                        {nutrition.hasNutrition ? <CheckCircleOutlined style={{ color: "#389e0d", fontSize: 22 }} /> : <WarningOutlined style={{ color: "#d48806", fontSize: 22 }} />}
                    </Stack>
                </Box>

                <Box style={sectionStyle}>
                    <SectionTitle icon={<PieChartOutlined />} title="Dinh dưỡng mỗi phần" subtitle={`${nutrition.coveredIngredientCount}/${nutrition.ingredientCount} nguyên liệu bắt buộc có dữ liệu`} />
                    {nutrition.hasNutrition ? <React.Fragment>
                        <div style={statGridStyle}>
                            {nutrientMetrics.map(metric => <MetricCard key={metric.key} label={metric.label} value={metric.format(nutrition.perServing[metric.key])} color={metric.color} />)}
                        </div>
                        {(missingNutritionNames.length > 0 || missingConversionNames.length > 0) && <Box style={{ marginTop: 10, border: "1px solid #ffe58f", borderRadius: 8, background: "#fffbe6", padding: "8px 9px" }}>
                            <Typography.Text strong style={{ display: "block", color: "#ad6800", fontSize: 12, lineHeight: "17px" }}>Dữ liệu còn thiếu</Typography.Text>
                            {missingNutritionNames.length > 0 && <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 2 }}>Thiếu dinh dưỡng: {missingNutritionNames.join(", ")}</Typography.Text>}
                            {missingConversionNames.length > 0 && <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px", marginTop: 2 }}>Thiếu quy đổi: {missingConversionNames.join(", ")}</Typography.Text>}
                        </Box>}
                    </React.Fragment> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa đủ dữ liệu dinh dưỡng" />}
                </Box>

                <Box style={sectionStyle}>
                    <SectionTitle icon={<BarChartOutlined />} title="Nguyên liệu đóng góp" subtitle="Sắp theo năng lượng ước tính của cả công thức" />
                    {topContributions.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nguyên liệu để phân tích" /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 8 }}>
                        {topContributions.map(row => <ContributionRow key={row.ingredientId} row={row} maxCalories={maxContributionCalories} />)}
                    </div>}
                </Box>

                <Box style={sectionStyle}>
                    <SectionTitle icon={<HistoryOutlined />} title="Lịch sử dùng món" subtitle={finishedSessions.length > 0 ? `${finishedSessions.length} lần hoàn tất${cancelledCount > 0 ? ` · ${cancelledCount} lần hủy` : ""}` : "Chưa có phiên nấu hoàn tất"} />
                    <div style={statGridStyle}>
                        <MetricCard label="Đã nấu" value={`${finishedSessions.length} lần`} color="#389e0d" detail={cancelledCount > 0 ? `${cancelledCount} lần hủy` : undefined} />
                        <MetricCard label="Lần gần nhất" value={lastFinishedDate ? formatDate(lastFinishedDate) : "Chưa nấu"} color="#1677ff" detail={daysSinceLast === null ? undefined : daysSinceLast === 0 ? "Hôm nay" : `${daysSinceLast} ngày trước`} />
                        <MetricCard label="Thời lượng TB" value={formatMinutes(learnedCookTime)} color="#fa8c16" detail={cookTimeStats[currentDish.id]?.samples ? `${cookTimeStats[currentDish.id].samples} mẫu học được` : undefined} />
                        <MetricCard label="Khẩu phần TB" value={servingAverage ? `${formatAmount(servingAverage)} phần` : "-"} color="#7436dc" detail={`Gốc ${baseServings} phần`} />
                    </div>
                    {dishSessions.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 8, marginTop: 10 }}>
                        {dishSessions.slice(0, 6).map(session => <UsageSessionRow key={session.id} session={session} fallbackServings={baseServings} />)}
                    </div>}
                </Box>

                <Box style={sectionStyle}>
                    <SectionTitle icon={<TeamOutlined />} title="Phản hồi bữa ăn" subtitle={totalFeedback > 0 ? `${totalFeedback} phản hồi từ thành viên` : "Chưa có phản hồi"} extra={totalFeedback > 0 && <Space size={[4, 4]} wrap>
                        {feedbackSummaryItems.map(item => <FeedbackSummaryCounter key={item.value} item={item} count={feedbackCounts[item.value]} />)}
                    </Space>} />
                    {recentFeedbackRows.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phản hồi cho món này" /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 8 }}>
                        {recentFeedbackRows.map(record => <FeedbackRow key={record.id} record={record} memberNameById={memberNameById} />)}
                    </div>}
                </Box>
            </div>
        </DeferredModalContent>
    </Modal>;
}
