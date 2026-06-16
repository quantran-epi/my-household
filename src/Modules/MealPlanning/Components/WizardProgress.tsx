import { LeftOutlined } from "@ant-design/icons";
import { ActionButton } from "@components/Button";
import { Typography } from "@components/Typography";
import React from "react";

type WizardProgressProps = {
    current: number;
    total: number;
    onBack?: () => void;
};

// Accent reserved for the current/completed step markers only (UI-SPEC color rules);
// the back affordance stays neutral (#595959), never accent.
const ACCENT = "#7436dc";
const NEUTRAL_MARKER = "#f5f5f5";
const NEUTRAL_TEXT = "#595959";

// Mirrors the DishSuggester back-button idiom verbatim (DishSuggester.screen.tsx ~543 + ~432-439):
// ActionButton shape="circle" + <LeftOutlined />, neutral color, 40px circle.
const backIconButtonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    minWidth: 40,
    paddingInline: 0,
    borderRadius: 999,
    color: NEUTRAL_TEXT,
};

export const WizardProgress: React.FC<WizardProgressProps> = ({ current, total, onBack }) => {
    return (
        <div
            data-testid="wizard-progress"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px 0",
                background: "#ffffff",
            }}
        >
            {onBack ? (
                // ActionButton's props are explicit and do not forward data-testid, so the
                // test hook lives on a wrapping span; the aria-label stays on the button itself.
                <span data-testid="wizard-back" style={{ display: "inline-flex", flexShrink: 0 }}>
                    <ActionButton
                        shape="circle"
                        height={40}
                        aria-label="Quay lại"
                        onClick={onBack}
                        icon={<LeftOutlined />}
                        style={backIconButtonStyle}
                    />
                </span>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                {Array.from({ length: total }).map((_, index) => (
                    <span
                        key={index}
                        style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 999,
                            background: index <= current ? ACCENT : NEUTRAL_MARKER,
                        }}
                    />
                ))}
            </div>

            <Typography.Text
                style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: NEUTRAL_TEXT, whiteSpace: "nowrap" }}
            >
                {`Bước ${current + 1}/${total}`}
            </Typography.Text>
        </div>
    );
};
