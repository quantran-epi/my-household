import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "@components/Button";
import { Stack } from "@components/Layout/Stack";
import { InputNumber } from "@components/Form/InputNumber/InputNumber";
import React from "react";

type NumberStepperProps = {
    value?: number | string | null;
    onChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    disabled?: boolean;
    addonAfter?: React.ReactNode;
    placeholder?: string;
    size?: "small" | "middle" | "large";
    style?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
    "aria-label"?: string;
}

const toNumber = (value: unknown): number | null => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = typeof value === "number" ? value : parseFloat(String(value));
    return isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min?: number, max?: number): number => {
    let next = value;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    return next;
};

export const NumberStepper: React.FunctionComponent<NumberStepperProps> = ({
    value,
    onChange,
    min,
    max,
    step = 1,
    precision,
    disabled,
    addonAfter,
    placeholder,
    size = "middle",
    style,
    inputStyle,
    "aria-label": ariaLabel,
}) => {
    const numericValue = toNumber(value);
    const buttonWidth = size === "small" ? 28 : 32;
    const controlHeight = size === "small" ? 24 : size === "large" ? 40 : 32;
    const stepperStyle = {
        "--number-stepper-height": `${controlHeight}px`,
        width: "100%",
        ...style,
    } as React.CSSProperties;

    const _onStep = (direction: 1 | -1) => {
        const base = numericValue ?? min ?? 0;
        onChange?.(clamp(base + (step * direction), min, max));
    };

    const minusDisabled = disabled || (typeof min === "number" && numericValue !== null && numericValue <= min);
    const plusDisabled = disabled || (typeof max === "number" && numericValue !== null && numericValue >= max);

    return <Stack.Compact className="number-stepper" style={stepperStyle}>
        <Button
            preserveAntdStyle
            aria-label={ariaLabel ? `Giảm ${ariaLabel}` : "Giảm"}
            icon={<MinusOutlined />}
            disabled={minusDisabled}
            onClick={() => _onStep(-1)}
            size={size === "small" ? undefined : size}
            style={{ flex: "0 0 auto", width: buttonWidth, height: controlHeight, minHeight: controlHeight, paddingInline: 0 }}
        />
        <InputNumber
            min={min}
            max={max}
            step={step}
            precision={precision}
            controls={false}
            disabled={disabled}
            value={numericValue}
            onChange={next => onChange?.(next as number | null)}
            addonAfter={addonAfter}
            placeholder={placeholder}
            size={size}
            style={{ flex: "1 1 auto", minWidth: 56, height: controlHeight, ...inputStyle }}
        />
        <Button
            preserveAntdStyle
            aria-label={ariaLabel ? `Tăng ${ariaLabel}` : "Tăng"}
            icon={<PlusOutlined />}
            disabled={plusDisabled}
            onClick={() => _onStep(1)}
            size={size === "small" ? undefined : size}
            style={{ flex: "0 0 auto", width: buttonWidth, height: controlHeight, minHeight: controlHeight, paddingInline: 0 }}
        />
    </Stack.Compact>
}
