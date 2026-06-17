import { AppstoreAddOutlined } from "@ant-design/icons";
import { AppCopy } from "@common/Copy";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { Sheet } from "@components/Sheet";
import { Typography } from "@components/Typography";
import { IngredientPickerWidget } from "@modules/DishSuggester/Screens/IngredientPicker.widget";
import { WizardAnswers } from "@store/Models/Wizard";
import { selectWizardAnswers } from "@store/Selectors";
import { Button } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";

type WizardIngredientStepProps = {
    onNext: (answer: Partial<WizardAnswers>) => void;
};

export const WizardIngredientStep: React.FC<WizardIngredientStepProps> = ({ onNext }) => {
    const answers = useSelector(selectWizardAnswers);
    const [selectedIds, setSelectedIds] = useState<string[]>(answers.selectedIngredientIds ?? []);
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <Box data-testid="wizard-step-ingredients" style={{ padding: 24, background: "#ffffff" }}>
            <Typography.Title
                level={4}
                style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25, margin: 0, marginBottom: 16 }}
            >
                {AppCopy.wizard.ingredientStepTitle}
            </Typography.Title>

            <Box
                onClick={() => setSheetOpen(true)}
                data-testid="wizard-ingredient-trigger"
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
                <Stack align="center" gap={8}>
                    <AppstoreAddOutlined style={{ color: "#7436dc", fontSize: 18 }} />
                    <Typography.Text style={{ fontSize: 16 }}>
                        {selectedIds.length > 0
                            ? AppCopy.wizard.selectedIngredients({ count: selectedIds.length })
                            : AppCopy.wizard.ingredientPickerTrigger}
                    </Typography.Text>
                </Stack>
                <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: "#7436dc" }}>
                    {selectedIds.length > 0 ? AppCopy.wizard.editAction : AppCopy.wizard.chooseAction}
                </Typography.Text>
            </Box>

            <Stack direction="column" gap={8} fullwidth>
                <Button
                    type="primary"
                    size="large"
                    data-testid="wizard-ingredient-advance"
                    onClick={() => onNext({ selectedIngredientIds: selectedIds })}
                    style={{ width: "100%", borderRadius: 12, background: "#7436dc", borderColor: "#7436dc" }}
                >
                    {AppCopy.wizard.continueAction}
                </Button>
                <Button
                    type="text"
                    size="large"
                    data-testid="wizard-skip-ingredients"
                    onClick={() => onNext({ selectedIngredientIds: [] })}
                    style={{ width: "100%", borderRadius: 12, color: "#595959", fontWeight: 600 }}
                >
                    {AppCopy.common.skip}
                </Button>
            </Stack>

            <Sheet
                open={sheetOpen}
                title={AppCopy.wizard.ingredientSheetTitle}
                onClose={() => setSheetOpen(false)}
                data-testid="wizard-ingredient-sheet"
            >
                <IngredientPickerWidget selectedIds={selectedIds} onChange={setSelectedIds} />
            </Sheet>
        </Box>
    );
};
