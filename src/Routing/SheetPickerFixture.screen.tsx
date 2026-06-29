import React from "react";
import dayjs from "dayjs";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
    SheetSelect,
    SheetMultiSelect,
    SheetDatePicker,
    SheetActionMenu,
} from "@components/SheetPicker";

// Test-only fixture screen (mounted at the StaticRoutes.SheetPickerFixture route,
// NOT linked from any user-facing nav). It mounts all four Wave-1/2 sheet pickers in
// the deterministic variants the mobile-safari touch e2e drives but which the product
// screens do not expose stably: a single SheetSelect (allowClear + a >=8-option list so
// the search field appears), a SheetMultiSelect (small set, draft/commit/revert), a
// single SheetDatePicker (min/max via disabledDate), and a SheetActionMenu (one normal +
// one danger row). Each is driven by local useState for value/open so the e2e can assert
// the post-gesture trigger summary. Threat T-08-FIX: serves no real data, no PII, no auth
// boundary — matches the existing CrashTest/SheetGestureFixture fixture posture.

const triggerWrapStyle: React.CSSProperties = {
    margin: "12px 0",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
};

const openButtonStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    minHeight: 48,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #d9d9d9",
    background: "#fff",
    fontSize: 16,
    cursor: "pointer",
};

const SELECT_OPTIONS = [
    { value: "pho", label: "Phở bò" },
    { value: "bun-bo", label: "Bún bò Huế" },
    { value: "com-tam", label: "Cơm tấm" },
    { value: "banh-mi", label: "Bánh mì" },
    { value: "goi-cuon", label: "Gỏi cuốn" },
    { value: "cha-gio", label: "Chả giò" },
    { value: "canh-chua", label: "Canh chua" },
    { value: "thit-kho", label: "Thịt kho" },
    { value: "rau-muong", label: "Rau muống xào" },
];

const MULTI_OPTIONS = [
    { value: "sang", label: "Buổi sáng" },
    { value: "trua", label: "Buổi trưa" },
    { value: "toi", label: "Buổi tối" },
];

// Min/max window so the SheetDatePicker exercises disabledDate clamping.
const MIN_DATE = dayjs("2026-06-01");
const MAX_DATE = dayjs("2026-06-30");
const disabledDate = (current: ReturnType<typeof dayjs>): boolean =>
    current.isBefore(MIN_DATE, "day") || current.isAfter(MAX_DATE, "day");

export const SheetPickerFixtureScreen: React.FunctionComponent = () => {
    const [selectValue, setSelectValue] = React.useState<React.Key | undefined>(undefined);
    const [multiValue, setMultiValue] = React.useState<any[] | undefined>(undefined);
    const [dateValue, setDateValue] = React.useState<ReturnType<typeof dayjs> | null>(null);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [lastAction, setLastAction] = React.useState("none");

    return (
        <div style={{ padding: 16 }} data-testid="sheet-picker-fixture">
            <h1 style={{ fontSize: 18 }}>Sheet picker fixture</h1>

            <div style={triggerWrapStyle} data-testid="select-field">
                <span style={labelStyle}>SheetSelect (single, allowClear + search)</span>
                <SheetSelect
                    value={selectValue}
                    onChange={setSelectValue}
                    options={SELECT_OPTIONS}
                    allowClear
                    placeholder="Chọn món"
                />
            </div>

            <div style={triggerWrapStyle} data-testid="multiselect-field">
                <span style={labelStyle}>SheetMultiSelect (draft / Xong / Hủy)</span>
                <SheetMultiSelect
                    value={multiValue}
                    onChange={setMultiValue}
                    options={MULTI_OPTIONS}
                    placeholder="Chọn bữa"
                    data-testid="sheet-multiselect"
                />
            </div>

            <div style={triggerWrapStyle} data-testid="datepicker-field">
                <span style={labelStyle}>SheetDatePicker (single, min/max)</span>
                <SheetDatePicker
                    value={dateValue}
                    onChange={setDateValue}
                    disabledDate={disabledDate}
                    placeholder="Chọn ngày"
                />
            </div>

            <div style={triggerWrapStyle} data-testid="actionmenu-field">
                <span style={labelStyle}>SheetActionMenu (normal + danger)</span>
                <button
                    type="button"
                    data-testid="open-action-menu"
                    style={openButtonStyle}
                    onClick={() => setMenuOpen(true)}
                >
                    Mở menu thao tác
                </button>
                <span data-testid="action-result" style={{ display: "none" }}>
                    {lastAction}
                </span>
                <SheetActionMenu
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    title="Thao tác"
                    data-testid="sheet-actionmenu"
                    actions={[
                        {
                            key: "edit",
                            label: "Sửa",
                            icon: <EditOutlined />,
                            onClick: () => setLastAction("edit"),
                        },
                        {
                            key: "delete",
                            label: "Xóa",
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => setLastAction("delete"),
                        },
                    ]}
                />
            </div>
        </div>
    );
};
