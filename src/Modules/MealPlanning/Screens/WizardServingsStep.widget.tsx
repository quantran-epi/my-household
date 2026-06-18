import { CheckOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { AppCopy } from "@common/Copy";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { Typography } from "@components/Typography";
import { WizardAnswers } from "@store/Models/Wizard";
import { selectHouseholdMembers, selectWizardAnswers } from "@store/Selectors";
import { Button } from "antd";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";

type WizardServingsStepProps = {
    onNext: (answer: Partial<WizardAnswers>) => void;
    onBack: () => void;
};

const clampServingCount = (value: number): number => Math.max(1, Math.min(24, Math.round(value)));

export const WizardServingsStep: React.FC<WizardServingsStepProps> = ({ onNext, onBack }) => {
    const answers = useSelector(selectWizardAnswers);
    const members = useSelector(selectHouseholdMembers);

    const initialMemberIds = useMemo(() => {
        if (answers.memberIds && answers.memberIds.length > 0) return answers.memberIds;
        return members.map(member => member.id);
    }, [answers.memberIds, members]);

    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialMemberIds);
    const [servingCount, setServingCount] = useState(() => clampServingCount(answers.servingCount ?? (initialMemberIds.length || 2)));
    const hasMembers = members.length > 0;

    const commit = () => onNext({
        memberIds: hasMembers ? selectedMemberIds : [],
        servingCount,
    });

    const toggleMember = (memberId: string) => {
        setSelectedMemberIds(prev => {
            const next = prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId];
            setServingCount(clampServingCount(next.length || 1));
            return next;
        });
    };

    const adjustServing = (delta: number) => {
        setServingCount(prev => clampServingCount(prev + delta));
    };

    return (
        <Box data-testid="wizard-step-servings" style={{ padding: 24, background: "#ffffff" }}>
            <Typography.Title
                level={4}
                style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25, margin: 0, marginBottom: 8 }}
            >
                {AppCopy.wizard.servingsStepTitle}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 16, lineHeight: 1.5, marginBottom: 16 }}>
                {hasMembers ? AppCopy.wizard.servingsStepBody : AppCopy.wizard.servingsFallbackBody}
            </Typography.Text>

            {hasMembers && (
                <Stack direction="column" gap={8} fullwidth align="stretch" style={{ marginBottom: 20 }}>
                    {members.map(member => {
                        const active = selectedMemberIds.includes(member.id);
                        return (
                            <button
                                key={member.id}
                                type="button"
                                data-testid={`wizard-member-${member.id}`}
                                onClick={() => toggleMember(member.id)}
                                style={{
                                    minHeight: 44,
                                    borderRadius: 12,
                                    border: active ? "2px solid #7436dc" : "1px solid #e8e2f7",
                                    background: active ? "#7436dc12" : "#fff",
                                    padding: "10px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                <Typography.Text style={{ fontSize: 16, fontWeight: active ? 600 : 400, color: "#111827", overflowWrap: "anywhere" }}>
                                    {member.name}
                                </Typography.Text>
                                {active && <CheckOutlined style={{ color: "#7436dc", fontSize: 14, flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </Stack>
            )}

            <Box
                style={{
                    borderRadius: 12,
                    border: "1px solid #e8e2f7",
                    background: "#f5f5f5",
                    padding: 12,
                    marginBottom: 24,
                }}
            >
                <Stack align="center" justify="space-between" fullwidth gap={12}>
                    <Typography.Text style={{ fontSize: 16, fontWeight: 600 }}>
                        {hasMembers
                            ? AppCopy.wizard.selectedMembers({ count: selectedMemberIds.length })
                            : AppCopy.wizard.servingCount({ count: servingCount })}
                    </Typography.Text>
                    <Stack align="center" gap={8}>
                        <Button
                            aria-label={AppCopy.wizard.servingsMinusLabel}
                            data-testid="wizard-serving-minus"
                            icon={<MinusOutlined />}
                            onClick={() => adjustServing(-1)}
                            style={{ width: 44, minWidth: 44, height: 44, borderRadius: 22 }}
                        />
                        <Typography.Text style={{ minWidth: 48, textAlign: "center", fontSize: 16, fontWeight: 600 }}>
                            {AppCopy.wizard.servingCount({ count: servingCount })}
                        </Typography.Text>
                        <Button
                            aria-label={AppCopy.wizard.servingsPlusLabel}
                            data-testid="wizard-serving-plus"
                            icon={<PlusOutlined />}
                            onClick={() => adjustServing(1)}
                            style={{ width: 44, minWidth: 44, height: 44, borderRadius: 22 }}
                        />
                    </Stack>
                </Stack>
            </Box>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
                <Button
                    type="text"
                    size="large"
                    data-testid="wizard-skip-servings"
                    onClick={commit}
                    style={{ flex: "1 1 0", minWidth: 0, minHeight: 44, height: "auto", borderRadius: 12, color: "#595959", fontWeight: 600, whiteSpace: "normal", lineHeight: 1.2 }}
                >
                    {AppCopy.common.skip}
                </Button>
                <Button
                    type="primary"
                    size="large"
                    data-testid="wizard-servings-advance"
                    onClick={commit}
                    style={{ flex: "1 1 0", minWidth: 0, minHeight: 44, height: "auto", borderRadius: 12, background: "#7436dc", borderColor: "#7436dc", whiteSpace: "normal", lineHeight: 1.2 }}
                >
                    {AppCopy.wizard.continueAction}
                </Button>
            </div>
        </Box>
    );
};
