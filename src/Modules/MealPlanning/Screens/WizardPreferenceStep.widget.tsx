import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { Sheet } from "@components/Sheet";
import { Typography } from "@components/Typography";
import { WizardAnswers } from "@store/Models/Wizard";
import { selectDishes, selectWizardAnswers } from "@store/Selectors";
import { Button } from "antd";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";

type WizardPreferenceStepProps = {
    onNext: (answer: Partial<WizardAnswers>) => void;
    onBack: () => void;
};

// Above this count the tag grid is hosted inside a bottom Sheet to keep the
// step screen compact (mirrors the in-step picker idiom from the UI-SPEC).
const SHEET_THRESHOLD = 12;

export const WizardPreferenceStep: React.FC<WizardPreferenceStepProps> = ({ onNext, onBack }) => {
    const answers = useSelector(selectWizardAnswers);
    const dishes = useSelector(selectDishes);
    const [selectedTags, setSelectedTags] = useState<string[]>(answers.preferredTags ?? []);
    const [sheetOpen, setSheetOpen] = useState(false);

    const availableTags = useMemo(() => {
        const set = new Set<string>();
        dishes.forEach(dish => {
            (dish.tags ?? []).forEach(tag => {
                const trimmed = tag.trim();
                if (trimmed) set.add(trimmed);
            });
        });
        return Array.from(set);
    }, [dishes]);

    const _toggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const useSheet = availableTags.length > SHEET_THRESHOLD;

    const renderTagGrid = () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))", gap: 8 }}>
            {availableTags.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => _toggle(tag)}
                        style={{
                            border: active ? "2px solid #7436dc" : "1px solid #e8e2f7",
                            background: active ? "#7436dc12" : "#fff",
                            borderRadius: 8,
                            padding: "10px 11px",
                            cursor: "pointer",
                            textAlign: "left",
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        {active && <CheckOutlined style={{ color: "#7436dc", fontSize: 13, flexShrink: 0 }} />}
                        <Typography.Text
                            style={{ fontSize: 16, fontWeight: active ? 600 : 400, color: active ? "#7436dc" : "#111827", overflowWrap: "anywhere" }}
                        >
                            {tag}
                        </Typography.Text>
                    </button>
                );
            })}
        </div>
    );

    return (
        <Box data-testid="wizard-step-preferences" style={{ padding: 24, background: "#ffffff" }}>
            <Stack align="center" gap={8} style={{ marginBottom: 16 }}>
                <Box
                    onClick={onBack}
                    data-testid="wizard-preference-back"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                        userSelect: "none",
                        color: "#595959",
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 14 }} />
                    <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: "#595959" }}>
                        Quay lại
                    </Typography.Text>
                </Box>
            </Stack>

            <Typography.Title
                level={4}
                style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25, margin: 0, marginBottom: 24 }}
            >
                Bạn thích món kiểu nào?
            </Typography.Title>

            {availableTags.length === 0 ? (
                <Box style={{ marginBottom: 32 }}>
                    <Typography.Text style={{ fontSize: 16, color: "#595959" }}>
                        Chưa có sở thích để chọn. Bạn có thể bỏ qua bước này.
                    </Typography.Text>
                </Box>
            ) : useSheet ? (
                <Box
                    onClick={() => setSheetOpen(true)}
                    data-testid="wizard-preference-trigger"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: "1px solid #d9d9d9",
                        background: "#f5f5f5",
                        cursor: "pointer",
                        userSelect: "none",
                        marginBottom: 32,
                    }}
                >
                    <Typography.Text style={{ fontSize: 16 }}>
                        {selectedTags.length > 0 ? `Đã chọn ${selectedTags.length} sở thích` : "Chọn sở thích"}
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: "#7436dc" }}>
                        {selectedTags.length > 0 ? "Sửa" : "Chọn"}
                    </Typography.Text>
                </Box>
            ) : (
                <Box style={{ marginBottom: 32 }}>{renderTagGrid()}</Box>
            )}

            <Stack direction="column" gap={8} fullwidth>
                <Button
                    type="primary"
                    size="large"
                    data-testid="wizard-preference-advance"
                    onClick={() => onNext({ preferredTags: selectedTags })}
                    style={{ width: "100%", borderRadius: 12, background: "#7436dc", borderColor: "#7436dc" }}
                >
                    Tiếp tục
                </Button>
                <Button
                    type="text"
                    size="large"
                    data-testid="wizard-skip-preferences"
                    onClick={() => onNext({})}
                    style={{ width: "100%", borderRadius: 12, color: "#595959", fontWeight: 600 }}
                >
                    Tùy bạn
                </Button>
            </Stack>

            {useSheet && (
                <Sheet
                    open={sheetOpen}
                    title="Sở thích"
                    onClose={() => setSheetOpen(false)}
                    data-testid="wizard-preference-sheet"
                >
                    {renderTagGrid()}
                </Sheet>
            )}
        </Box>
    );
};
