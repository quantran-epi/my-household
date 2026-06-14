import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DeleteOutlined, FilterOutlined, TeamOutlined } from "@ant-design/icons";
import { ActionButton } from "@components/Button";
import { Select } from "@components/Form/Select";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { Typography } from "@components/Typography";
import type { CookingSession } from "@store/Models/CookingSession";
import { clearCookingHistory } from "@store/Reducers/CookingSessionReducer";
import { selectCookingSessions, selectDishes, selectHouseholdMembers } from "@store/Selectors";
import { DatePicker, Empty, Popconfirm, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const _formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
        + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const _duration = (startedAt: string, finishedAt?: string) => {
    if (!finishedAt) return null;
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
};

// Group sessions by date (dd/mm/yyyy)
const _groupByDate = (sessions: CookingSession[]) => {
    const map: Record<string, CookingSession[]> = {};
    for (const s of sessions) {
        const key = new Date(s.startedAt).toLocaleDateString("vi-VN");
        if (!map[key]) map[key] = [];
        map[key].push(s);
    }
    return Object.entries(map).sort((a, b) =>
        new Date(b[1][0].startedAt).getTime() - new Date(a[1][0].startedAt).getTime()
    );
};

const filterPanelStyle: React.CSSProperties = {
    border: "1px solid #e8edf7",
    borderRadius: 8,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    padding: 10,
    marginBottom: 12,
};

const filterHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 9,
};

const filterGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8,
    alignItems: "end",
};

const filterFieldStyle: React.CSSProperties = {
    minWidth: 0,
};

const filterLabelStyle: React.CSSProperties = {
    display: "block",
    color: "#475569",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "15px",
    marginBottom: 4,
};

const filterActionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 6,
};

const dateGroupStyle: React.CSSProperties = {
    marginBottom: 12,
};

const dateHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid #e8edf7",
    borderRadius: 8,
    background: "#f8fafc",
    padding: "6px 8px",
    marginBottom: 8,
};

const historyItemStyle = (isFinished: boolean): React.CSSProperties => ({
    padding: "10px 12px",
    marginBottom: 8,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e8edf7",
    borderLeft: `3px solid ${isFinished ? "#52c41a" : "#ff4d4f"}`,
});

export const CookingHistoryWidget: React.FC = () => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectCookingSessions);
    const dishes = useSelector(selectDishes);
    const householdMembers = useSelector(selectHouseholdMembers);
    const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    const allHistory = useMemo(() => sessions
        .filter(s => s.status === "finished" || s.status === "cancelled"), [sessions]);

    const dishNameById = useMemo(() => new Map(dishes.map(dish => [dish.id, dish.name])), [dishes]);
    const memberNameById = useMemo(() => new Map(householdMembers.map(member => [member.id, member.name])), [householdMembers]);

    const dishFilterOptions = useMemo(() => {
        const optionsById = new Map<string, { value: string; label: string }>();
        allHistory.forEach(session => {
            if (!session.dishId) return;
            optionsById.set(session.dishId, {
                value: session.dishId,
                label: dishNameById.get(session.dishId) ?? session.dishName ?? session.dishId,
            });
        });
        return Array.from(optionsById.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [allHistory, dishNameById]);

    const memberFilterOptions = useMemo(
        () => householdMembers.map(member => ({ value: member.id, label: member.name })),
        [householdMembers]
    );

    const history = allHistory
        .filter(s => {
            if (!filterDate) return true;
            const d = dayjs(s.startedAt);
            return d.year() === filterDate.year()
                && d.month() === filterDate.month()
                && d.date() === filterDate.date();
        })
        .filter(s => selectedDishIds.length === 0 || selectedDishIds.includes(s.dishId))
        .filter(s => selectedMemberIds.length === 0 || (s.householdMemberIds ?? []).some(id => selectedMemberIds.includes(id)))
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const groups = _groupByDate(history);
    const hasActiveFilters = Boolean(filterDate) || selectedDishIds.length > 0 || selectedMemberIds.length > 0;

    const _clearFilters = () => {
        setFilterDate(null);
        setSelectedDishIds([]);
        setSelectedMemberIds([]);
    };

    if (allHistory.length === 0) {
        return <Empty description="Chưa có lịch sử nấu ăn" style={{ padding: "32px 0" }} />;
    }

    return (
        <>
            <Box style={filterPanelStyle}>
                <div style={filterHeaderStyle}>
                    <Stack align="center" gap={6} style={{ minWidth: 0 }}>
                        <FilterOutlined style={{ color: "#1677ff" }} />
                        <Typography.Text strong style={{ color: "#111827", fontSize: 13, lineHeight: "18px" }}>Bộ lọc</Typography.Text>
                    </Stack>
                    <Tag color={history.length === allHistory.length ? "blue" : "gold"} style={{ marginRight: 0 }}>{history.length}/{allHistory.length} phiên</Tag>
                </div>
                <div style={filterGridStyle}>
                    <div style={filterFieldStyle}>
                        <Typography.Text strong style={filterLabelStyle}>Ngày</Typography.Text>
                        <DatePicker
                            value={filterDate}
                            onChange={setFilterDate}
                            placeholder="Chọn ngày"
                            format="DD/MM/YYYY"
                            allowClear
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div style={filterFieldStyle}>
                        <Typography.Text strong style={filterLabelStyle}>Món ăn</Typography.Text>
                        <Select
                            mode="multiple"
                            allowClear
                            value={selectedDishIds}
                            onChange={ids => setSelectedDishIds(ids)}
                            options={dishFilterOptions}
                            placeholder="Chọn một hoặc nhiều món"
                            maxTagCount="responsive"
                            showSearch
                            optionFilterProp="label"
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div style={filterFieldStyle}>
                        <Typography.Text strong style={filterLabelStyle}>Thành viên</Typography.Text>
                        <Select
                            mode="multiple"
                            allowClear
                            value={selectedMemberIds}
                            onChange={ids => setSelectedMemberIds(ids)}
                            options={memberFilterOptions}
                            placeholder="Mọi thành viên"
                            maxTagCount="responsive"
                            showSearch
                            optionFilterProp="label"
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div style={filterActionsStyle}>
                        <ActionButton disabled={!hasActiveFilters} onClick={_clearFilters}>Xóa lọc</ActionButton>
                        <Popconfirm
                            title="Xoá toàn bộ lịch sử?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            onConfirm={() => dispatch(clearCookingHistory())}
                        >
                            <ActionButton tone="danger" icon={<DeleteOutlined />}>Xoá lịch sử</ActionButton>
                        </Popconfirm>
                    </div>
                </div>
            </Box>

            {groups.length === 0 ? (
                <Empty
                    description={filterDate ? `Không có lịch sử vào ngày ${filterDate.format("DD/MM/YYYY")}` : "Không có lịch sử với bộ lọc đã chọn"}
                    style={{ padding: "24px 0" }}
                />
            ) : (
                <Box>
                    {groups.map(([date, items]) => (
                        <Box key={date} style={dateGroupStyle}>
                            <div style={dateHeaderStyle}>
                                <Stack align="center" gap={6} style={{ minWidth: 0 }}>
                                    <CalendarOutlined style={{ color: "#64748b" }} />
                                    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>{date}</Typography.Text>
                                </Stack>
                                <Tag color="default" style={{ marginRight: 0 }}>{items.length} phiên</Tag>
                            </div>
                            {items.map(s => {
                                const isFinished = s.status === "finished";
                                const dur = _duration(s.startedAt, s.finishedAt);
                                const memberNames = (s.householdMemberIds ?? [])
                                    .map(id => memberNameById.get(id))
                                    .filter(Boolean) as string[];
                                return (
                                    <Box
                                        key={s.id}
                                        style={historyItemStyle(isFinished)}
                                    >
                                        <Stack justify="space-between" align="flex-start">
                                            <Stack gap={6} align="center">
                                                {isFinished
                                                    ? <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                                    : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                                                }
                                                <Typography.Text strong style={{ fontSize: 14 }}>
                                                    {s.dishName}
                                                </Typography.Text>
                                            </Stack>
                                            <Tag color={isFinished ? "success" : "error"} style={{ marginRight: 0 }}>
                                                {isFinished ? "Hoàn thành" : "Huỷ"}
                                            </Tag>
                                        </Stack>
                                        <Stack gap={12} wrap="wrap" style={{ marginTop: 6, paddingLeft: 22 }}>
                                            <Typography.Text type="secondary" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                                                <ClockCircleOutlined /> {_formatDate(s.startedAt)}
                                            </Typography.Text>
                                            {dur && (
                                                <Typography.Text type="secondary" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                                                    <ClockCircleOutlined /> {dur}
                                                </Typography.Text>
                                            )}
                                            {memberNames.length > 0 && (
                                                <Typography.Text type="secondary" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                                                    <TeamOutlined /> {memberNames.join(", ")}
                                                </Typography.Text>
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            )}
        </>
    );
};
